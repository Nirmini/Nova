const { ShardingManager, WebhookClient } = require('discord.js');
const path = require('path');
require('dotenv').config();
const { getData, setData, updateData, removeData } = require('./statusrtdb');

const webhookURL = '<Your_Sahrding_Logs_Webhook_Here>';
const webhookClient = new WebhookClient({ url: webhookURL });
const express = require('express');
const app = express();

const token = process.env.DISCORD_TOKEN;
const RESHARD_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours

const manager = new ShardingManager(path.join(__dirname, 'index.js'), {
    totalShards: 'auto', // use 'auto' for general use. For specific use then use just an integer above zero.
    token: token
});

const activeCommands = new Map();
const readyShards = new Set(); // Track ready shards

async function updateShardStatus(shardId, status, ping = null, guilds = null) {
    try {
        let updateObj = { status };
        if (ping !== null) updateObj.ping = ping;
        if (guilds !== null) updateObj.guilds = guilds;

        await updateData(`/devshards/${shardId}`, updateObj);
        console.log(`[Shard Monitor]: Updated shard ${shardId}:`, updateObj);
        webhookClient.send(`[DEV] Shard ${shardId} updated: ${JSON.stringify(updateObj)}`);
    } catch (error) {
        console.error(`[Shard Monitor]: Error updating shard ${shardId} status:`, error);
    }
}

manager.on('shardCreate', (shard) => {
    console.log(`Launched shard ${shard.id}`);
    webhookClient.send(`[DEV] Shard Monitor: Launched shard ${shard.id}`);

    shard.on('message', async (message) => {
        if (message.type === 'COMMAND_ACTIVE') {
            activeCommands.set(shard.id, true);
        } else if (message.type === 'COMMAND_DONE') {
            activeCommands.set(shard.id, false);
        }

        if (message.type === 'shardReady') {
            readyShards.add(message.shardId);
            await updateShardStatus(message.shardId, 'online');

            // If all shards are ready, start index.js
            if (readyShards.size === manager.totalShards) {
                console.log('[Shard Monitor]: All shards are ready! Starting index.js...');
                webhookClient.send('[DEV] Shard Monitor: All shards ready. Executing index.js.');
                startIndex();
            }
        } else if (message.type === 'shardDisconnect') {
            await updateShardStatus(message.shardId, 'offline');
        } else if (message.type === 'shardReconnecting') {
            await updateShardStatus(message.shardId, 'reconnecting');
        } else if (message.type === 'statsUpdate') {
            await updateShardStatus(message.shardId, 'online', message.ping, message.guilds);
        }
    });

    shard.on('ready', async () => {
        console.log(`Shard ${shard.id} is ready`);
        readyShards.add(shard.id);
        await updateShardStatus(shard.id, 'online');

        if (readyShards.size === manager.totalShards) {
            console.log('[Shard Monitor]: All shards are ready! Starting index.js...');
            webhookClient.send('[DEV] Shard Monitor: All shards ready. Executing index.js.');
            startIndex();
        }
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

async function restartShards() {
    webhookClient.send("[[DEV] Shard Monitor]: Checking if shards are ready for a restart.");
    console.log('[Shard Monitor]: Checking if shards are ready for a restart.');

    while ([...activeCommands.values()].some(isActive => isActive)) {
        console.log('[Shard Monitor]: Waiting for active shards to finish running commands...');
        await new Promise(resolve => setTimeout(resolve, 5000)); 
    }

    console.log('[Shard Monitor]: No active commands. Restarting shards...');
    webhookClient.send("[[DEV] Shard Monitor]: No active commands. Restarting shards...");
    await manager.respawnAll();
    console.log('[Shard Monitor]: All shards restarted successfully.');
    webhookClient.send("[[DEV] Shard Monitor]: All shards restarted successfully.");
}

async function startIndex() {
    console.log('[Shard Monitor]: Executing index.js now that all shards are ready.');
    const { exec } = require('child_process');
    exec('node src/index.js', (err, stdout, stderr) => {
        if (err) {
            console.error(`[Shard Monitor]: Error executing index.js:`, err);
            webhookClient.send(`[[DEV] Shard Monitor]: Error executing index.js: ${err}`);
            return;
        }
        console.log(`[Shard Monitor]: index.js output:\n${stdout}`);
        if (stderr) console.error(`[Shard Monitor]: index.js errors:\n${stderr}`);
    });
}

async function waitForAllShardsReady(shards) {
    return new Promise((resolve) => {
        let readyShards = new Set();

        // Listen for 'ready' events from all shards
        manager.on('shardCreate', (shard) => {
            shard.once('ready', () => {
                readyShards.add(shard.id);
                console.log(`[Shard Monitor]: Shard ${shard.id} is ready.`);

                // Check if all shards are ready
                if (readyShards.size === manager.totalShards) {
                    console.log('[Shard Monitor]: All shards are fully ready.');
                    resolve();
                }
            });
        });
    });
}

manager.spawn().then(async (shards) => {
    console.log('[Shard Monitor]: All shards launched. Waiting for readiness...');
    webhookClient.send("[[DEV] Shard Monitor]: All shards launched. Waiting for readiness...");

    // Wait for all shards to be ready before continuing
    await waitForAllShardsReady(shards);

    console.log('[Shard Monitor]: All shards are now ready.');
    webhookClient.send("[[DEV] Shard Monitor]: All shards are now ready.");

    // Initialize shard statuses in Firebase
    await setData('/devshards', {}); // Clears old shard data
    console.log('[Shard Monitor]: Cleared previous devshard status in Firebase.');

    // Set interval to restart shards every 3 hours
    setInterval(restartShards, RESHARD_INTERVAL);
}).catch(error => {
    console.error('[Shard Monitor]: Error while launching shards:', error);
    webhookClient.send(`[[DEV] Shard Monitor]: Error while launching shards: ${error}`);
});


app.get('/devshards', async (req, res) => {
    try {
        const data = await getData('/devshards');
        res.json(data || {});
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch shard status" });
    }
});

app.listen(3000, () => console.log('Shard status API running on port 3000'));
