// cloudflared.js
const { spawn } = require('child_process');
const path = require('path');

const exePath = path.join(__dirname, '../cloudflared.exe');

// Tunnel ID (DO NOT SHARE!!!)
const tunnelId = '66de4fdf-08ae-48a0-bac9-b6ee6d4d34e3';

const args = ['tunnel', 'run', tunnelId];

function startCloudflared() {
    console.log('[Cloudflared] Starting...');

    const cloudflared = spawn(exePath, args, {
        stdio: 'inherit'
    });

    cloudflared.on('spawn', () => console.log('[Cloudflared] Process started.'));
    cloudflared.on('exit', (code, signal) =>
        console.log(`[Cloudflared] Exited with code ${code}, signal ${signal}`)
    );
    cloudflared.on('error', (err) => console.error('[Cloudflared] Failed to start:', err));
}

// Start once
startCloudflared();

// Keep Node process alive
setInterval(() => {}, 1 << 30);
