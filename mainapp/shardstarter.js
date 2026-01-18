const client = require('../core/global/Client');
const dotenv = require('dotenv');
const cfg = require('../settings.json');
const axios = require('axios');
const { fork } = require('child_process');
const path = require('path');
const { getPort } = require('../mainappmodules/ports');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const StatusAPIToken = process.env.NovaAPI_Key;

// Color codes for logging
const colors = {
    gray: '\x1b[90m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    white: '\x1b[37m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m',
};

// Helper logger with colors
function log(message, level = 'INF') {
    const ts = new Date().toISOString();
    let color = colors.green;
    let tag = 'INF';

    if (level === 'ERR') {
        color = colors.red;
        tag = 'ERR';
    } else if (level === 'DBG') {
        color = colors.cyan;
        tag = 'DBG';
    } else if (level === 'WARN') {
        color = colors.yellow;
        tag = 'WRN';
    }

    const full = `${colors.gray}${ts}${colors.reset} ${color}${tag}${colors.reset} ${colors.white}[ShardStarter] ${message}${colors.reset}`;
    console.log(full);
}

// Resolve port with fallback
const statusPort = getPort('statusapi')
const baseURL = `http://localhost:${statusPort}`;

client.login(process.env.DISCORD_TOKEN);

/**
 * Polls the /ready endpoint until all shards are ready.
 */
async function waitForAllShardsReady(maxWait = 60000, interval = 2000) {
    const start = Date.now();
    let lastLogTime = 0;
    const logInterval = 10000; // Log status every 10 seconds instead of every 2 seconds

    while (Date.now() - start < maxWait) {
        try {
            const res = await axios.post(`${baseURL}/ready`, {}, {
                headers: {
                    'x-api-key': StatusAPIToken
                }
            });

            const { allReady, readyCount, total } = res.data;
            
            // Only log if enough time has passed or all are ready
            const now = Date.now();
            if (now - lastLogTime >= logInterval || allReady) {
                log(`${readyCount}/${total} shards ready (allReady: ${allReady})`);
                lastLogTime = now;
            }

            if (allReady) return true;
        } catch (err) {
            log(`Failed to contact /ready: ${err.message}`, 'WARN');
        }

        await new Promise(res => setTimeout(res, interval));
    }

    log(`Timed out waiting for all shards to be ready.`, 'WARN');
    return false;
}

log(`Shard booting — waiting for DJS ready.`);

client.on('clientReady', async () => {
    const shardId = client.shard?.ids?.[0] ?? 0;

    log(`Client ready on shard ${shardId}. Reporting to StatusAPI...`);

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

        log(`Marked shard ${shardId} as ready. Waiting on all shards...`);

        const allClear = await waitForAllShardsReady();

        if (allClear) {
            log(`All shards ready. Launching ../src/index.js...`);
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
                    log(`Failed to forward message to parent: ${err.message}`, 'WARN');
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
                    log(`Failed to forward message to child: ${err.message}`, 'WARN');
                }
            });

            child.on('exit', code => {
                log(`index.js exited with code ${code}`);
            });
        }
    } catch (err) {
        log(`Failed to POST or spawn index.js: ${err.message}`, 'ERR');
    }
});

