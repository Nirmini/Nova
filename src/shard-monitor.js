/*
To-Do:
- Move Status API to be managed in-shard
- Improve shard stability code
- Allow forced shard starts
*/

const serviceAccount = require('../keys/status-serviceAccountKey.json');
const { ShardingManager, WebhookClient } = require('discord.js');
const admin = require('firebase-admin');
const express = require('express');
const dotenv = require('dotenv');
const cfg = require('../settings.json');
dotenv.config();

// Firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://nova-statusmngr-default-rtdb.firebaseio.com"
    });
}
const db = admin.database();

// Webhook
const webhookClient = new WebhookClient({ url: process.env.LOG_S_WEBHOOK }); //Lets not leak the Debug webhook URL again.

// Utility functions
async function setData(path, value) { await db.ref(path).set(value); }
async function updateData(path, value) { await db.ref(path).update(value); }
async function getData(path) { const snap = await db.ref(path).once('value'); return snap.val(); }

// ----------- Status API (Health Monitor) -----------
const statusApp = express();
statusApp.use(express.json());

statusApp.get('/shards', async (req, res) => {
    const data = await getData('/devshards');
    res.json(data || {});
});

// ----------- Shard Manager API -----------
const shardMngrApp = express();
shardMngrApp.use(express.json());

const SHARD_COUNT = 1; // Set as needed or from config/env
const manager = new ShardingManager('./src/index.js', {
    totalShards: SHARD_COUNT,
    token: process.env.DISCORD_TOKEN,
    respawn: true
});

// Initialize all shards as "unhealthy"
(async () => {
    const initial = {};
    for (let i = 0; i < SHARD_COUNT; i++) {
        initial[i] = { status: 'unhealthy', lastUpdate: null };
    }
    await setData('/devshards', initial);
})();

// Shard event listeners
manager.on('shardCreate', shard => {
    console.log(`[Shard Monitor] Launched shard ${shard.id}`);
    webhookClient.send(`[Shard Monitor] Launched shard ${shard.id}`);
    updateData(`/devshards/${shard.id}`, { status: 'starting', lastUpdate: Date.now() });

    shard.on('disconnect', () => {
        console.warn(`[Shard Monitor] Shard ${shard.id} disconnected.`);
        updateData(`/devshards/${shard.id}`, { status: 'unhealthy', lastUpdate: Date.now() });
    });

    shard.on('death', () => {
        console.error(`[Shard Monitor] Shard ${shard.id} terminated.`);
        webhookClient.send(`[Shard Monitor] Shard ${shard.id} terminated.`);
        updateData(`/devshards/${shard.id}`, { status: 'terminated', lastUpdate: Date.now() });
    });

    shard.on('reconnecting', () => {
        console.warn(`[Shard Monitor] Shard ${shard.id} reconnecting...`);
        updateData(`/devshards/${shard.id}`, { status: 'reconnecting', lastUpdate: Date.now() });
    });
});

manager.on('shardReady', id => {
    console.log(`[Shard Monitor] Shard ${id} is healthy.`);
    updateData(`/devshards/${id}`, { status: 'healthy', lastUpdate: Date.now() });
});

// Shard management endpoints (example: POST /spawn, POST /kill)
shardMngrApp.post('/spawn', async (req, res) => {
    try {
        await manager.spawn({ amount: SHARD_COUNT, timeout: 30000 });
        res.json({ message: 'Shards spawned.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

shardMngrApp.post('/kill/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const shard = manager.shards.get(id);
    if (shard) {
        await shard.kill();
        res.json({ message: `Shard ${id} killed.` });
    } else {
        res.status(404).json({ error: 'Shard not found' });
    }
});

// ----------- Start servers if main -----------
if (require.main === module) {
    // Status API
    statusApp.listen(cfg.ports.StatusAPI, () => {
        console.log(`[StatusAPI] Express server running on port ${cfg.ports.StatusAPI}`);
    });
    // Shard Manager API
    shardMngrApp.listen(cfg.ports.ShardMngr, () => {
        console.log(`[ShardMngr] Express server running on port ${cfg.ports.ShardMngr}`);
    });

    // Start all shards
    (async () => {
        try {
            await manager.spawn({ amount: SHARD_COUNT, timeout: 30000 });
            console.log(`[Shard Monitor] All shards launched.`);
            webhookClient.send(`[Shard Monitor] All shards launched.`);
        } catch (err) {
            console.error(`[Shard Monitor] Error launching shards: ${err.message}`);
            webhookClient.send(`[Shard Monitor] Error launching shards: ${err.message}`);
            process.exit(1);
        }
    })();
}

// Export both apps and manager for use elsewhere
module.exports = {
    statusApp,
    shardMngrApp,
    manager,
    spawnShard: async () => {
        await manager.spawn({ amount: SHARD_COUNT, timeout: 30000 });
        return true;
    },
    killShard: async (id = 0) => {
        const shard = manager.shards.get(id);
        if (shard) {
            await shard.kill();
            return true;
        }
        throw new Error('Shard not found');
    }
};