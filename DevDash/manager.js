// This manager.js provides connectivity and data access for DevDash.
// It imports the Discord client and exposes operational info for the dashboard.
// Now also serves the DevDash dashboard via Express.

const path = require('path');
const express = require('express');
const fs = require('fs');
const client = require(path.join(__dirname, '../core/global/Client'));
const os = require('os');
const app = express();
const cfg = require('../settings.json');

const OPSINFO_PATH = path.join(__dirname, 'opsinfo.js');

// Require other util files to bundle them into runtime
require("./remote");
require("./manage");
require("./settings");
require("./sysmsgs");

// Serve static files (logo, css, opsinfo.js, etc.)
app.use(express.static(__dirname));

// Serve the dashboard HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Helper: Wait for client to be ready (max 2 minutes, retry every 45s)
async function waitForClientReady(timeoutMs = 120000, retryMs = 45000) {
    const start = Date.now();
    while (!client.isReady?.()) {
        if (Date.now() - start > timeoutMs) throw new Error('Client not ready after 2 minutes');
        await new Promise(r => setTimeout(r, retryMs));
    }
}

// API endpoint for operational info
app.get('/api/opsinfo', async (req, res) => {
    try {
        await waitForClientReady();
        res.json(module.exports.getOperationalInfo());
    } catch (e) {
        // Fallback: try to serve the last written opsinfo.js
        try {
            const raw = fs.readFileSync(OPSINFO_PATH, 'utf8');
            // Extract the object from window.OPERATIONAL_INFO = {...};
            const match = raw.match(/window\.OPERATIONAL_INFO\s*=\s*({[\s\S]*});?/);
            if (match) {
                const data = eval('(' + match[1] + ')');
                return res.json(data);
            }
        } catch {}
        res.status(503).json({ error: 'Bot not ready and no fallback data.' });
    }
});

// API endpoint for guilds
app.get('/botguilds', async (req, res) => {
    try {
        await waitForClientReady();
        const guildIDs = getGuildIDs();
        res.json({ guilds: guildIDs });
    } catch (e) {
        // Fallback: try to serve from opsinfo.js
        try {
            const raw = fs.readFileSync(OPSINFO_PATH, 'utf8');
            const match = raw.match(/window\.OPERATIONAL_INFO\s*=\s*({[\s\S]*});?/);
            if (match) {
                const data = eval('(' + match[1] + ')');
                return res.json({ guilds: data.guildIDs || [] });
            }
        } catch {}
        res.status(503).json({ error: 'Bot not ready and no fallback data.' });
    }
});

// API endpoint for users
app.get('/users', async (req, res) => {
    try {
        await waitForClientReady();
        const userIDs = client.users?.cache ? Array.from(client.users.cache.keys()) : [];
        res.json({ users: userIDs });
    } catch (e) {
        // Fallback: try to serve from opsinfo.js
        try {
            const raw = fs.readFileSync(OPSINFO_PATH, 'utf8');
            const match = raw.match(/window\.OPERATIONAL_INFO\s*=\s*({[\s\S]*});?/);
            if (match) {
                const data = eval('(' + match[1] + ')');
                return res.json({ users: Array(data.users || 0).fill('N/A') });
            }
        } catch {}
        res.status(503).json({ error: 'Bot not ready and no fallback data.' });
    }
});

// Start the dashboard server ONLY after the client is ready
if (!global.__DEVDASH_MNGR_STARTED) {
    client.once('ready', () => {
        const PORT = cfg.ports.DevDash[1];
        app.listen(PORT, () => {
            console.log(`DevDash manager running at http://localhost:${PORT}/`);
        });
        writeOpsInfo();
        setInterval(writeOpsInfo, 45000);
        global.__DEVDASH_MNGR_STARTED = true;
    });
}

// Write operational info to opsinfo.js for static dashboard fallback
function writeOpsInfo() {
    if (!client.isReady?.()) return;
    const info = module.exports.getOperationalInfo();
    const js = `window.OPERATIONAL_INFO = ${JSON.stringify(info, null, 4)};`;
    fs.writeFileSync(OPSINFO_PATH, js, 'utf8');
}

function getUptime() {
    const seconds = process.uptime();
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

function getCPUUsage() {
    // Returns average CPU usage over 1 minute
    const load = os.loadavg()[0];
    const cores = os.cpus().length;
    const percent = ((load / cores) * 100).toFixed(1);
    return `${percent}%`;
}

function getRAMUsage() {
    const used = os.totalmem() - os.freemem();
    const percent = ((used / os.totalmem()) * 100).toFixed(1);
    return `${(used / 1024 / 1024).toFixed(0)}MB / ${(os.totalmem() / 1024 / 1024).toFixed(0)}MB (${percent}%)`;
}

function getPing() {
    return client.ws?.ping ?? 'N/A';
}

function getShard() {
    // Returns [currentShard, totalShards]
    const current = client.shard?.ids?.[0] ?? 0;
    const total = client.shard?.count ?? 1;
    return [current, total];
}

function getStatus() {
    if (!client.isReady?.()) return 'Not Ready';
    return 'Online';
}

function getGuildCount() {
    return client.guilds?.cache?.size ?? 0;
}

function getUserCount() {
    return client.users?.cache?.size ?? 0;
}

function getGuildIDs() {
    return client.guilds?.cache ? Array.from(client.guilds.cache.keys()) : [];
}

module.exports = {
    getOperationalInfo: () => ({
        uptime: getUptime(),
        uptime_status: 'ok',
        cpu: getCPUUsage(),
        cpu_status: 'ok',
        ram: getRAMUsage(),
        ram_status: 'ok',
        ping: getPing(),
        ping_status: 'ok',
        shard: getShard(),
        shard_status: (() => {
            const [cur, total] = getShard();
            // If only 1 shard and many guilds, mark as error
            if (total === 1 && getGuildCount() > 5000) return 'err';
            return 'ok';
        })(),
        status: getStatus(),
        status_status: client.isReady?.() ? 'ok' : 'err',
        guilds: getGuildCount(),
        users: getUserCount(),
        guildIDs: getGuildIDs()
    }),
    client
};