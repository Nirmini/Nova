// File: api/NovaAPIv2.js
const express = require('express');
const path = require('path');
const settings = require('../../settings.json');
const { spawn } = require('child_process');

require('../../mainapp/errorhandling');
require('../../mainapp/sentry');

const app = express();
app.use(express.json());

// --- Structured Logging ---
function logRoute(route, message, extra = {}) {
    const ts = new Date().toISOString();
    const extraStr = Object.keys(extra).length ? ` | Extra: ${JSON.stringify(extra)}` : '';
    console.log(`[${ts}] [${route}] ${message}${extraStr}`);
}

// --- Middleware: API Access Guard ---
const API_KEY = process.env.NovaAPI_Key;
const ALLOWED_ORIGINS = [
    'https://api.nirmini.dev',
    'https://serverops.nirmini.dev',
];

function apiAccessGuard(req, res, next) {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const apiKey = req.headers['x-api-key'];
    const token = req.headers['x-token'];
    const originHeader = req.headers['origin'] || req.headers['referer'] || '';
    const origin = originHeader.replace(/\/+$/, '').trim();

    logRoute("API Guard", "Incoming request", {
        version: "v2",
        method: req.method,
        path: req.originalUrl,
        ip: clientIp,
        apiKeyProvided: !!apiKey,
        tokenProvided: !!token,
        origin,
    });

    const isLocalhost = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(clientIp);
    const validApiKey = apiKey && apiKey === API_KEY;
    const validOrigin = ALLOWED_ORIGINS.includes(origin);

    if (isLocalhost || validApiKey || validOrigin) return next();

    const reason = !validOrigin
        ? `Invalid Origin: ${origin || 'none'}`
        : 'Invalid API key';
    logRoute("API Guard", "Access denied", { reason });
    return res.status(403).json({ error: 'Forbidden', reason });
}

// --- IPC Request Helper ---
function requestBotData(key, payload = null, timeout = 5000) {
    return new Promise((resolve, reject) => {
        if (!process.send) return reject(new Error('No parent process for IPC'));

        const requestId = Date.now() + Math.random();
        const listener = (msg) => {
            if (!msg || typeof msg !== 'object') return;
            if (msg.responseId === requestId) {
                process.off('message', listener);
                resolve(msg.value);
            }
        };

        process.on('message', listener);
        process.send({ from: 'NovaAPI', key, payload, requestId });

        setTimeout(() => {
            process.off('message', listener);
            reject(new Error(`IPC request timed out for key: ${key}`));
        }, timeout);
    });
}

// --- Helper: unified body for GET/POST ---
function getRequestBody(req) {
    return req.method === 'GET' ? (req.query || req.body || {}) : (req.body || {});
}

// --- NovaAPI V2 ROUTES ---

// 📁 Dashboard (Use Dedicated Server/User Data APIs when using the public API, allowed on the internal API.)
app.all('/api/dashboard/:action', apiAccessGuard, async (req, res) => {
    const { action } = req.params;
    const body = getRequestBody(req);
    try {
        switch (action) {
            case 'getgconfig':
                return res.json(await requestBotData('GetGuildConfig', body));
            case 'setgconfig':
                return res.json(await requestBotData('SetGuildConfig', body));
            default:
                return res.status(404).json({ error: 'Unknown dashboard action' });
        }
    } catch (err) {
        logRoute('Dashboard', 'Error', { err: err.message });
        return res.status(500).json({ error: err.message });
    }
});

// ⚙️ Status (NovaAPI Note: To Be Added)
app.all('/api/status/:action', async (req, res) => {
    const { action } = req.params;
    const body = getRequestBody(req);
    try {
        switch (action) {
            case 'getshards':
                return res.json(await requestBotData('GetShards', body));
            case 'getapp':
                return res.json(await requestBotData('GetApp', body));
            default:
                return res.status(404).json({ error: 'Unknown status action' });
        }
    } catch (err) {
        logRoute('Status', 'Error', { err: err.message });
        return res.status(500).json({ error: err.message });
    }
});

// 👤 Users
app.all('/api/users/:action', apiAccessGuard, async (req, res) => {
    const { action } = req.params;
    const body = getRequestBody(req);
    try {
        switch (action) {
            case 'getusrdata':
                return res.json(await requestBotData('GetUserData', body));
            case 'setusrdata':
                return res.json(await requestBotData('SetUserData', body));
            case 'getusrsubs':
                return res.json(await requestBotData('GetUserSubs', body));
            case 'setusrsubs':
                return res.json(await requestBotData('SetUserSubs', body));
            case 'getusrbdy':
                return res.json(await requestBotData('GetUserBday', body));
            case 'setusrbdy':
                return res.json(await requestBotData('SetUserBday', body));
            case 'usercount':
                return res.json(await requestBotData('UserCount'));
            default:
                return res.status(404).json({ error: 'Unknown user action' });
        }
    } catch (err) {
        logRoute('Users', 'Error', { err: err.message });
        return res.status(500).json({ error: err.message });
    }
});

// 🏛️ Servers
app.all('/api/servers/:action', apiAccessGuard, async (req, res) => {
    const { action } = req.params;
    const body = getRequestBody(req);
    try {
        switch (action) {
            case 'getguildconfig':
                return res.json(await requestBotData('GetGuildConfig', body));
            case 'setguildconfig':
                return res.json(await requestBotData('SetGuildConfig', body));
            case 'delguildconfig':
                return res.json(await requestBotData('DelGuildConfig', body));
            case 'getguilddata':
                return res.json(await requestBotData('GetGuildData', body));
            case 'setguilddata':
                return res.json(await requestBotData('SetGuildData', body));
            case 'delguilddata':
                return res.json(await requestBotData('DelGuildData', body));
            case 'getguildsubs':
                return res.json(await requestBotData('GetGuildSubs', body));
            case 'guildcount':
                return res.json(await requestBotData('GuildCount'));
            default:
                return res.status(404).json({ error: 'Unknown server action' });
        }
    } catch (err) {
        logRoute('Servers', 'Error', { err: err.message });
        return res.status(500).json({ error: err.message });
    }
});

// 🔐 Auth / Messaging
app.all('/api/auth/:action', apiAccessGuard, async (req, res) => {
    const { action } = req.params;
    const body = getRequestBody(req);
    try {
        const valid = ['login', 'onboarding', 'invite', 'mfa', 'email'];
        if (!valid.includes(action)) return res.status(404).json({ error: 'Unknown auth action' });
        const key = `Auth_${action.charAt(0).toUpperCase() + action.slice(1)}`;
        return res.json(await requestBotData(key, body));
    } catch (err) {
        logRoute('Auth', 'Error', { err: err.message });
        return res.status(500).json({ error: err.message });
    }
});

app.get('/api/getservercount', async (req, res) => {
    try {
        const servers = await requestBotData('GuildCount');
        res.json({ servers });
    } catch (err) {
        res.status(500).json({ servers: 0, error: err.message });
    }
});

app.get('/api/getusercount', async (req, res) => {
    try {
        const users = await requestBotData('UserCount');
        res.json({ users });
    } catch (err) {
        res.status(500).json({ users: 0, error: err.message });
    }
});

app.post('/trello/event', (req, res) => {
    const payload = JSON.stringify(req.body);

    const child = spawn('node', [
        path.resolve(__dirname, '../Trello/TrelloHandling.js'),
        payload
    ]);

    child.stdout.on('data', (data) => console.log(`[Trello] ${data.toString().trim()}`));
    child.stderr.on('data', (data) => console.error(`[Trello ERR] ${data.toString().trim()}`));

    child.on('close', (code) => {
        console.log(`[Trello] TrelloHandling exited with code ${code}`);
    });

    // Respond immediately so Trello doesn't retry
    res.status(200).json({ ok: true });
});

// --- Start Express *if standalone* ---
if (require.main === module) {
    const PORT = settings.ports.Cloudflare || 29958;
    if (!global.__NOVAAPI_STARTED) {
        app.listen(PORT, () => logRoute("Server", `NovaAPI v2 running on http://localhost:${PORT}`));
        global.__NOVAAPI_STARTED = true;
    }
}

module.exports = { app, requestBotData };
