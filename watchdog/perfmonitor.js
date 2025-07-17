const os = require('os');
const fs = require('fs');
const { sendToShardManager } = require('./core');

let lastHeartbeat = Date.now();
let lastIndexResponse = Date.now();

function checkUnresponsive() {
    // Simulate process heartbeat check (could be replaced with actual heartbeat logic)
    if (Date.now() - lastHeartbeat > 60 * 1000) {
        console.error('[WATCHDOG][perfmonitor]: Process unresponsive for 60s!');
        sendToShardManager('unresp', { reason: 'Process unresponsive for 60s' });
    }
}

function checkRAM() {
    // Process RAM usage
    const mem = process.memoryUsage();
    const max = os.totalmem();
    const usage = mem.rss / max;
    if (usage >= 0.5) {
        console.error('[WATCHDOG][perfmonitor]: Process RAM usage above 50%!');
        sendToShardManager('ramleak', { usage: usage, reason: 'Process RAM usage above 50%' });
    }

    // System RAM usage
    const free = os.freemem();
    const total = os.totalmem();
    const sysUsage = 1 - (free / total);
    if (sysUsage >= 0.995) {
        console.error('[WATCHDOG][perfmonitor]: System RAM usage above 99.5%!');
        sendToShardManager('sysram', { usage: sysUsage, reason: 'System RAM usage above 99.5%' });
    }
}

function checkStorage() {
    // Simple disk usage check (works on Unix, for Windows use a library)
    try {
        const stat = fs.statSync('/');
        // This is a placeholder; for real disk usage use a package like 'diskusage'
        // Here, just simulate a check
        // sendToShardManager('storagelimit', { usage: 1.0, reason: 'Storage usage above 99.5%' });
    } catch (e) {
        // Ignore or log
    }
}

// IPC to index.js for heartbeat
function pingIndex() {
    if (process.send) {
        process.send({ type: 'wdg:ping', from: 'perfmonitor' });
    }
    // If no response in 60s, alert shard manager
    setTimeout(() => {
        if (Date.now() - lastIndexResponse > 60 * 1000) {
            console.error('[WATCHDOG][perfmonitor]: No response from index.js in 60s!');
            sendToShardManager('indexunresponsive', { reason: 'No response from index.js in 60s' });
        }
    }, 60 * 1000);
}

// Listen for IPC from index.js
process.on('message', (msg) => {
    if (msg && msg.type === 'wdg:pong') {
        lastIndexResponse = Date.now();
    }
});

// Schedule checks every 5 minutes, staggered
setInterval(checkUnresponsive, 5 * 60 * 1000); // 0s offset
setTimeout(() => setInterval(checkRAM, 5 * 60 * 1000), 60 * 1000); // 1m offset
setTimeout(() => setInterval(checkStorage, 5 * 60 * 1000), 120 * 1000); // 2m offset
setTimeout(() => setInterval(pingIndex, 5 * 60 * 1000), 180 * 1000); // 3m offset