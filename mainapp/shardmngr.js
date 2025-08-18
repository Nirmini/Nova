// What if we actually read the documentation while writing this, Novel idea right?
const { ShardingManager, WebhookClient } = require('discord.js');
const express = require('express');
const dotenv = require('dotenv');
const cfg = require('../settings.json');
dotenv.config();

// Optional webhook logging
const LOG_WEBHOOK_URL = process.env.SHARD_LOG_HOOK;
const logHook = LOG_WEBHOOK_URL ? new WebhookClient({ url: LOG_WEBHOOK_URL }) : null;

// Configuration
const PORT = cfg.ports.ShardMngr || 3001;
const USE_AUTO_SHARDS = cfg.shardingcfg.userecomended;
const SHARD_COUNT = cfg.shardingcfg.shardcount;
const BATCH_SIZE = cfg.shardingcfg.batchsize || 1;
const RESPAWN = cfg.shardingcfg.autorespawn;
const SPAWN_DELAY = cfg.shardingcfg.spawndelay || 5000;

// Helper logger
function log(message) {
    const full = `[ShardManager] ${message}`;
    console.log(full);
    if (logHook) logHook.send({ content: full }).catch(() => {});
}

// Express server
const app = express();
app.use(express.json());

// Initialize manager
const manager = new ShardingManager('./mainapp/shardstarter.js', {
    totalShards: USE_AUTO_SHARDS ? 'auto' : SHARD_COUNT,
    token: process.env.TOKEN,
    env: { ...process.env },
    mode: 'process',
    respawn: RESPAWN,
    shardArgs: ['--enable-source-maps'],
    delay: SPAWN_DELAY
});

// Batched startup logic
(async () => {
    const total = USE_AUTO_SHARDS
        ? await manager.fetchRecommendedShardCount().catch(() => SHARD_COUNT)
        : SHARD_COUNT;

    log(`Spawning ${total} shard(s) in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = [];
        for (let j = 0; j < BATCH_SIZE && (i + j) < total; j++) {
            const shardId = i + j;
            const shard = manager.createShard(shardId);
            batch.push(shard.spawn());
        }

        await Promise.all(batch);
        await new Promise(resolve => setTimeout(resolve, SPAWN_DELAY));
    }
})();

// REST Control API

// Add a new shard manually
app.post('/shard/add', async (req, res) => {
    const id = manager.shards.size;
    try {
        const shard = manager.createShard(id);
        await shard.spawn();
        log(`Shard ${id} added manually.`);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove an existing shard
app.post('/shard/remove', async (req, res) => {
    const { id } = req.body;
    const shard = manager.shards.get(Number(id));
    if (!shard) return res.status(404).json({ error: 'Shard not found' });

    try {
        shard.kill();
        manager.shards.delete(Number(id));
        log(`Shard ${id} removed manually.`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Restart a specific shard or all shards
app.post('/shard/restart', async (req, res) => {
    const { id } = req.body;

    if (id === 'all') {
        log('Restarting all shards...');
        for (const shard of manager.shards.values()) {
            await shard.respawn();
        }
        return res.json({ success: true, message: 'All shards restarted' });
    }

    const shard = manager.shards.get(Number(id));
    if (!shard) return res.status(404).json({ error: 'Shard not found' });

    try {
        await shard.respawn();
        log(`Shard ${id} restarted manually.`);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    log(`ShardManager control API listening on port ${PORT}`);
});
