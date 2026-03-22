const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');
const http = require('http');
const cors = require('cors');
const app = express();
const cfg = require('../settings.json');
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.json());

const { getPort } = require('../mainappmodules/ports.js');

// Import your bot manager, shard manager, or relevant modules here
//const botManager = require('../mainapp/shardmngr.js');
const birthdayModule = require('../modules/birthday.js');

// --- Shard & Command Management ---
app.post('/manage/spawn-shard', async (req, res) => {
    try {
        await botManager.respawnShard?.();
        res.json({ message: 'Shard spawn requested.' });
    } catch (e) {
        res.status(500).json({ message: 'Failed to spawn shard.' });
    }
});
app.post('/manage/kill-shard', async (req, res) => {
    try {
        await botManager.killShard?.();
        res.json({ message: 'Shard kill requested.' });
    } catch (e) {
        res.status(500).json({ message: 'Failed to kill shard.' });
    }
});
app.post('/manage/deploy-commands', async (req, res) => {
    try {
        const deploy = spawn('node', [path.join(__dirname, '../src/deploy-cmds.js')]);
        deploy.stdout.on('data', data => console.log(`[deploy-cmds] ${data}`));
        deploy.stderr.on('data', data => console.error(`[deploy-cmds] ${data}`));
        deploy.on('close', code => console.log(`[deploy-cmds] exited with code ${code}`));
        res.json({ message: 'Command deployment started.' });
    } catch (e) {
        res.status(500).json({ message: 'Failed to deploy commands.' });
    }
});
app.post('/manage/run-birthday', async (req, res) => {
    try {
        // Use the correct function from the birthday module
        await birthdayModule.sendBirthdayPing(global.client);
        res.json({ message: 'Birthday service run started.' });
    } catch (e) {
        res.status(500).json({ message: 'Failed to run birthday service.' });
    }
});

// --- Network & Ping Utilities ---
app.post('/manage/test-network', async (req, res) => {
    // Simple connectivity test (to google DNS)
    const dns = require('dns');
    dns.lookup('8.8.8.8', err => {
        if (err) return res.status(500).json({ message: 'Network test failed.' });
        res.json({ message: 'Network connectivity OK.' });
    });
});
app.post('/manage/ping-util', async (req, res) => {
    // Simple ping to google.com
    const { exec } = require('child_process');
    exec('ping -n 1 google.com', (error, stdout) => {
        if (error) return res.status(500).json({ message: 'Ping failed.' });
        const match = stdout.match(/Average = (\d+ms)/i);
        res.json({ message: match ? `Ping OK: ${match[1]}` : 'Ping OK.' });
    });
});

// --- NovaAPIs Integration ---
app.post('/manage/novaapi-status', async (req, res) => {
    try {
        // Check if NovaAPI endpoint is available
        https.get('https://api.nirmini.dev/API/Nova', (apiRes) => {
            let data = '';
            apiRes.on('data', chunk => data += chunk);
            apiRes.on('end', () => {
                if (apiRes.statusCode === 200) {
                    res.json({ message: 'NovaAPI is online.' });
                } else {
                    res.status(500).json({ message: `NovaAPI returned status ${apiRes.statusCode}.` });
                }
            });
        }).on('error', () => {
            res.status(500).json({ message: 'NovaAPI is offline or unreachable.' });
        });
    } catch (e) {
        res.status(500).json({ message: 'Failed to check NovaAPI status.' });
    }
});


// Serve the manage.html dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'manage.html'));
});

// Only shard 0 should spawn the Express server
const shardId = process.env.SHARD_ID ? parseInt(process.env.SHARD_ID) : 0;
if (require.main === module && shardId === 0) {
    const portArray = getPort('devdash');
    const PORT = portArray[2];
    app.listen(PORT, () => {
        console.log(`Manage dashboard running at http://localhost:${PORT}/`);
    });
}