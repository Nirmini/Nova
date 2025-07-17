const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');
const http = require('http');
const app = express();
const cfg = require('../settings.json');
app.use(express.json());
app.use(express.static(__dirname));

// Import your bot manager, shard manager, or relevant modules here
const botManager = require('../src/shard-monitor'); // Adjust as needed
const modules = require('../src/modules.js'); // ModuleManager for birthday

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
        await modules.executeModuleFunction('BirthdayHandler', 'sendBirthdayPing', global.client);
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

// --- Watchdog Integration ---
app.post('/manage/watchdog-status', async (req, res) => {
    try {
        // Check if watchdog process is running by checking for a PID file or process
        // For demonstration, check if the core.js module is loaded and try to require it
        const watchdogPath = path.join(__dirname, '../watchdog/core.js');
        let status = 'Unknown';
        try {
            require.resolve(watchdogPath);
            status = 'Watchdog module loaded';
        } catch {
            status = 'Watchdog module not found';
        }

        // Optionally, check if the process is running (advanced: use ps-list or pid file)
        res.json({ message: `Watchdog status: ${status}` });
    } catch (e) {
        res.status(500).json({ message: 'Failed to check watchdog status.' });
    }
});
app.post('/manage/watchdog-check', async (req, res) => {
    try {
        // Attempt to send a message to the watchdog process if IPC is set up
        // For now, just simulate
        res.json({ message: 'Watchdog check triggered (simulated).' });
    } catch (e) {
        res.status(500).json({ message: 'Failed to trigger watchdog check.' });
    }
});

// --- NovaAPIs Integration ---
app.post('/manage/novaapi-status', async (req, res) => {
    try {
        // Check if NovaAPI endpoint is available
        https.get('https://thatwest7014.pages.dev/API/Nova', (apiRes) => {
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
app.post('/manage/novaapi-sync', async (req, res) => {
    // Placeholder: Replace with actual NovaAPI sync logic if needed
    res.json({ message: 'NovaAPI sync triggered (placeholder)' });
});

// --- Miscellaneous & Utilities ---
app.post('/manage/clear-cache', async (req, res) => {
    // Placeholder: Replace with actual cache clearing logic
    res.json({ message: 'Cache cleared (placeholder)' });
});
app.post('/manage/restart-bot', async (req, res) => {
    // Placeholder: Replace with actual restart logic
    res.json({ message: 'Bot restart triggered (placeholder)' });
});

// Serve the manage.html dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'manage.html'));
});

if (require.main === module) {
    const PORT = cfg.ports.DevDash[2];
    app.listen(PORT, () => {
        console.log(`Manage dashboard running at http://localhost:${PORT}/`);
    });
}