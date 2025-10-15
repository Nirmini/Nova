// What if we actually read the documentation while writing this, Novel idea right?
const { ShardingManager, WebhookClient } = require('discord.js');
const express = require('express');
const dotenv = require('dotenv');
const path = require('node:path');
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

// Path to shard starter script (use absolute path)
const shardScript = path.join(__dirname, 'shardstarter.js');

// Initialize manager
const manager = new ShardingManager(shardScript, {
    totalShards: USE_AUTO_SHARDS ? 'auto' : Number(SHARD_COUNT),
    token: process.env.TOKEN,
    env: { ...process.env },
    mode: 'process',
    respawn: RESPAWN,
    shardArgs: ['--enable-source-maps'],
    delay: SPAWN_DELAY
});

// Track shard child senders and pending sub-requests
const shardSenders = new Map(); // shardId -> sendFunction (child.send or shard.send)
const pendingSubRequests = new Map(); // subRequestId -> { resolve, reject, _t }

// Utility to send a request to a shard and await response
function sendRequestToShard(shardId, payload, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const sender = shardSenders.get(shardId);
        if (!sender) return reject(new Error('Shard sender not available'));
        const subId = `${payload.requestId || Date.now()}_${shardId}_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        const t = setTimeout(() => {
            pendingSubRequests.delete(subId);
            reject(new Error('timeout'));
        }, timeout);
        pendingSubRequests.set(subId, { resolve, reject, _t: t });
        const out = Object.assign({}, payload, { requestId: subId, from: 'shardmngr' });
        try {
            sender(out);
        } catch (err) {
            clearTimeout(t);
            pendingSubRequests.delete(subId);
            return reject(err);
        }
    });
}

// When a shard process responds with a responseId, match and resolve
function handleShardMessage(shardId, msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.responseId && pendingSubRequests.has(msg.responseId)) {
        const p = pendingSubRequests.get(msg.responseId);
        clearTimeout(p._t);
        pendingSubRequests.delete(msg.responseId);
        return p.resolve(msg.value);
    }
    log(`Message from shard ${shardId}: ${JSON.stringify(msg)}`);
}

// Track shards as they are created so we can forward requests
manager.on('shardCreate', (shard) => {
    log(`Shard created: ${shard.id}`);

    const sender = (payload) => {
        try {
            // prefer shard.send, fallback to process.send
            if (typeof shard.send === 'function') return shard.send(payload);
            if (shard.process && typeof shard.process.send === 'function') return shard.process.send(payload);
            throw new Error('No send function on shard');
        } catch (err) {
            console.warn(`[ShardManager] Failed to send to shard ${shard.id}: ${err.message}`);
        }
    };

    shardSenders.set(shard.id, sender);

    // listen for messages from the shard
    try {
        shard.on('message', (msg) => handleShardMessage(shard.id, msg));
    } catch (err) {
        if (shard.process && typeof shard.process.on === 'function') {
            shard.process.on('message', (msg) => handleShardMessage(shard.id, msg));
        }
    }

    shard.on('disconnect', () => { shardSenders.delete(shard.id); });
    shard.on('exit', () => { shardSenders.delete(shard.id); });
});

// IPC: handle incoming requests from mainapp (process message)
process.on('message', async (msg) => {
    if (!msg || typeof msg !== 'object') return;
    const { key, requestId } = msg;
    if (!requestId) return;

    const aggregateKeys = new Set(['GuildCount', 'UserCount', 'Guilds']);
    if (aggregateKeys.has(key)) {
        const shardIds = Array.from(shardSenders.keys()).map(id => Number(id)).sort((a, b) => a - b);
        if (shardIds.length === 0) {
            const fallback = (key === 'GuildCount' || key === 'UserCount') ? 0 : [];
            try { process.send({ responseId: requestId, value: fallback, from: 'shardmngr' }); } catch {}
            return;
        }

        // Prefer the lowest active shard (shard 0, then 1, ...)
        const preferredShard = shardIds[0];

        try {
            const v = await sendRequestToShard(preferredShard, { key, requestId }, 3000);
            try {
                process.send({ responseId: requestId, value: v, from: 'shardmngr' });
            } catch (err) {
                console.warn('[ShardManager] Failed to send response to parent after primary shard reply:', err.message);
            }
            return;
        } catch (err) {
            // Primary shard failed — fall back to aggregate across all shards
            log(`Primary shard ${preferredShard} failed to answer ${key}: ${err.message}. Falling back to aggregate across all shards.`);
            const promises = shardIds.map(id =>
                sendRequestToShard(id, { key, requestId }, 3000).then(v => ({ ok: true, v })).catch(() => ({ ok: false }))
            );

            const settled = await Promise.all(promises);
            let aggregated;
            if (key === 'GuildCount' || key === 'UserCount') {
                aggregated = settled.reduce((acc, r) => acc + (r.ok && typeof r.v === 'number' ? r.v : 0), 0);
            } else if (key === 'Guilds') {
                aggregated = settled.reduce((acc, r) => acc.concat(r.ok && Array.isArray(r.v) ? r.v : []), []);
            }

            try {
                process.send({ responseId: requestId, value: aggregated, from: 'shardmngr' });
            } catch (err2) {
                console.warn('[ShardManager] Failed to send aggregated response to parent:', err2.message);
            }
            return;
        }
    }
});

// Spawn shards (batched). ensures manager.fetchRecommendedShardCount is used correctly and no hang
(async () => {
    try {
        const total = USE_AUTO_SHARDS
            ? await manager.fetchRecommendedShardCount().catch((e) => {
                log(`fetchRecommendedShardCount failed, falling back to configured shard count (${SHARD_COUNT}). Error: ${e?.message || e}`);
                return SHARD_COUNT;
            })
            : SHARD_COUNT;

        log(`Spawning ${total} shard(s) in batches of ${BATCH_SIZE} (respawn=${RESPAWN})...`);

        for (let i = 0; i < total; i += BATCH_SIZE) {
            const batch = [];
            for (let j = 0; j < BATCH_SIZE && (i + j) < total; j++) {
                const shardId = i + j;
                try {
                    const shard = manager.createShard(shardId);
                    batch.push(shard.spawn().catch(err => { log(`Shard ${shardId} spawn failed: ${err.message}`); }));
                } catch (err) {
                    log(`createShard failed for ${shardId}: ${err.message}`);
                }
            }
            await Promise.all(batch);
            await new Promise(resolve => setTimeout(resolve, SPAWN_DELAY));
        }
        log('Shard spawning complete.');
    } catch (err) {
        console.error('[ShardManager] Error during shard spawn:', err);
    }
})();

// REST control endpoints (keep simple for now)
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

app.listen(PORT, () => {
    log(`ShardManager control API listening on port ${PORT}`);
});
