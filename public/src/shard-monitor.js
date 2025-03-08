const { ShardingManager, WebhookClient } = require('discord.js');
const path = require('path');
require('dotenv').config();
const { getData, setData, updateData, removeData } = require('./statusrtdb');

const webhookURL = '<YOUR_WEBHOOK_LOGS_URL>';
const webhookClient = new WebhookClient({ url: webhookURL });
const express = require('express');
const app = express();

const token = process.env.DISCORD_TOKEN;
const RESHARD_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours

const manager = new ShardingManager(path.join(__dirname, 'index.js'), {
    totalShards: 'auto',
    token: token
});

const activeCommands = new Map(); // Tracks active commands per shard

// Function to update shard status in Firebase
async function updateShardStatus(shardId, status) {
    try {
        await updateData(`/shards/${shardId}`, { status });
        console.log(`[Shard Monitor]: Updated shard ${shardId} status to ${status}`);
    } catch (error) {
        console.error(`[Shard Monitor]: Error updating shard ${shardId} status:`, error);
    }
}

// Event when a shard is created
manager.on('shardCreate', (shard) => {
    console.log(`Launched shard ${shard.id}`);
    webhookClient.send(`[DEV]Shard Monitor: Launched shard ${shard.id}`);

    shard.on('message', async (message) => {
        if (message.type === 'COMMAND_ACTIVE') {
            activeCommands.set(shard.id, true);
        } else if (message.type === 'COMMAND_DONE') {
            activeCommands.set(shard.id, false);
        }

        if (message.type === 'shardReady') {
            await updateShardStatus(message.shardId, 'online');
        } else if (message.type === 'shardDisconnect') {
            await updateShardStatus(message.shardId, 'offline');
        } else if (message.type === 'shardReconnecting') {
            await updateShardStatus(message.shardId, 'reconnecting');
        }
    });

    shard.on('ready', async () => {
        console.log(`Shard ${shard.id} is ready`);
        await updateShardStatus(shard.id, 'online');
    });

    shard.on('disconnect', async () => {
        console.log(`Shard ${shard.id} disconnected`);
        await updateShardStatus(shard.id, 'offline');
    });

    shard.on('reconnecting', async () => {
        console.log(`Shard ${shard.id} reconnecting`);
        await updateShardStatus(shard.id, 'reconnecting');
    });

    shard.on('death', async (process) => {
        console.error(`Shard ${shard.id}'s process died with code ${process.exitCode}`);
        await updateShardStatus(shard.id, 'dead');
    });

    shard.on('error', async (error) => {
        console.error(`Error in shard ${shard.id}:`, error);
        await updateShardStatus(shard.id, 'error');
    });
});

// Function to restart all shards safely
async function restartShards() {
    webhookClient.send("[[DEV]Shard Monitor]: Checking if shards are ready for a restart.");
    console.log('[Shard Monitor]: Checking if shards are ready for a restart.');

    // Wait for all shards to finish active commands
    while ([...activeCommands.values()].some(isActive => isActive)) {
        console.log('[Shard Monitor]: Waiting for active shards to finish running commands...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before checking again
    }

    console.log('[Shard Monitor]: No active commands. Restarting shards...');
    webhookClient.send("[[DEV]Shard Monitor]: No active commands. Restarting shards...");
    await manager.respawnAll();
    console.log('[Shard Monitor]: All shards restarted successfully.');
    webhookClient.send("[[DEV]Shard Monitor]: All shards restarted successfully.");
}

// Start the shards initially
manager.spawn().then(async () => {
    console.log('[Shard Monitor]: All shards launched successfully.');
    webhookClient.send("[[DEV]Shard Monitor]: All shards launched successfully.");

    // Initialize shard statuses in Firebase
    await setData('/shards', {}); // Clears old shard data
    console.log('[Shard Monitor]: Cleared previous shard status in Firebase.');

    // Set interval to restart shards every 3 hours
    setInterval(restartShards, RESHARD_INTERVAL);
}).catch(error => {
    console.error('[Shard Monitor]: Error while launching shards:', error);
    webhookClient.send(`[[DEV]Shard Monitor]: Error while launching shards: ${error}`);
});

// API route to get shard statuses from Firebase
app.get('/shards', async (req, res) => {
    try {
        const data = await getData('/shards');
        res.json(data || {});
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch shard status" });
    }
});

app.listen(3000, () => console.log('Shard status API running on port 3000'));
