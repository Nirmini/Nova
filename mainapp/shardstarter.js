const client = require('../core/global/Client');
const dotenv = require('dotenv');
const cfg = require('../settings.json');
const axios = require('axios');
const { fork } = require('child_process');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const StatusAPIToken = process.env.NovaAPI_Key;

// Resolve port with fallback
const statusPort = cfg.ports?.statusapi || 65505;
const baseURL = `http://localhost:${statusPort}`;

client.login(process.env.DISCORD_TOKEN);

/**
 * Polls the /ready endpoint until all shards are ready.
 */
async function waitForAllShardsReady(maxWait = 60000, interval = 2000) {
    const start = Date.now();

    while (Date.now() - start < maxWait) {
        try {
            const res = await axios.post(`${baseURL}/ready`, {}, {
                headers: {
                    'x-api-key': StatusAPIToken
                }
            });

            const { allReady, readyCount, total } = res.data;
            console.log(`[Sharding]: ${readyCount}/${total} shards ready (allReady: ${allReady})`);

            if (allReady) return true;
        } catch (err) {
            console.warn(`[Sharding]: Failed to contact /ready: ${err.message}`);
        }

        await new Promise(res => setTimeout(res, interval));
    }

    console.warn(`[Sharding]: Timed out waiting for all shards to be ready.`);
    return false;
}

console.log(`[Sharding]: Shard booting — waiting for DJS ready.`);

client.on('clientReady', async () => {
    const shardId = client.shard?.ids?.[0] ?? 0;

    console.log(`[Sharding]: Client ready on shard ${shardId}. Reporting to StatusAPI...`);

    try {
        await axios.post(`${baseURL}/post`, {
            shardId,
            healthy: true
        }, {
            headers: {
                'x-api-key': StatusAPIToken,
                'shardstat': 'ready'
            }
        });

        console.log(`[Sharding]: Marked shard ${shardId} as ready. Waiting on all shards...`);

        const allClear = await waitForAllShardsReady();

        if (allClear) {
            console.log(`[Sharding]: All shards ready. Launching ../src/index.js...`);
            const indexPath = path.join(__dirname, '../src/index.js');
            // Fork index.js with an IPC channel so this starter can forward IPC between manager and the bot
            const child = fork(indexPath, [], {
                stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
                env: process.env
            });

            // Only forward structured IPC messages (request/response/to/from/key) to parent.
            // This prevents leaking lifecycle/internal messages that make ShardingManager perform actions
            child.on('message', (msg) => {
                try {
                    if (!msg || typeof msg !== 'object') return;
                    // Only forward explicit IPC requests/responses or routed messages
                    const isStructured = msg.requestId !== undefined || msg.responseId !== undefined || msg.to || msg.from || msg.key;
                    if (!isStructured) return;
                    // tag origin and forward
                    const out = Object.assign({}, msg, { from: 'index' });
                    if (process.send) process.send(out);
                } catch (err) {
                    console.warn(`[Sharding starter] Failed to forward message to parent: ${err.message}`);
                }
            });

            // Only forward structured messages from parent down to the bot child.
            process.on('message', (msg) => {
                try {
                    if (!msg || typeof msg !== 'object') return;
                    // Avoid forwarding lifecycle messages and avoid loops
                    const isStructured = msg.requestId !== undefined || msg.responseId !== undefined || msg.to || msg.from || msg.key;
                    if (!isStructured) return;
                    if (msg.from === 'index' || msg.from === 'bot') return;
                    if (child && child.connected) child.send(msg);
                } catch (err) {
                    console.warn(`[Sharding starter] Failed to forward message to child: ${err.message}`);
                }
            });

            child.on('exit', code => {
                console.log(`[Sharding]: index.js exited with code ${code}`);
            });
        }
    } catch (err) {
        console.error(`[Sharding]: Failed to POST or spawn index.js: ${err.message}`);
    }
});

