const os = require('os');
const fs = require('fs');
const { sendToShardManager } = require('./core');

/**
 * TO DO:
 * Make this use something other than IPCs because we're communicating with shard processes not the main process. Also just annoying to implement ngl.
 */

let lastHeartbeat = Date.now();
let lastIndexResponse = Date.now();

function checkUnresponsive() {
    if (Date.now() - lastHeartbeat > 60 * 1000) {
        console.error('[WATCHDOG][perfmonitor]: Process unresponsive for 60s!');
        sendToShardManager('unresp', { reason: 'Process unresponsive for 60s' });
    }
}

function checkRAM() {
    const mem = process.memoryUsage();
    const max = os.totalmem();
    const usage = mem.rss / max;
    if (usage >= 0.5) {
        console.error('[WATCHDOG][perfmonitor]: Process RAM usage above 50%!');
        sendToShardManager('ramleak', { usage: usage, reason: 'Process RAM usage above 50%' });
    }
    const free = os.freemem();
    const total = os.totalmem();
    const sysUsage = 1 - (free / total);
    if (sysUsage >= 0.995) {
        console.error('[WATCHDOG][perfmonitor]: System RAM usage above 99.5%!');
        sendToShardManager('sysram', { usage: sysUsage, reason: 'System RAM usage above 99.5%' });
    }
}

function checkStorage() {
    try {
        const stat = fs.statSync('/');
        // TO-DO: Finish
    } catch (e) {
    }
}

function pingIndex() {
    if (process.send) {
        process.send({ type: 'wdg:ping', from: 'perfmonitor' });
    }
    setTimeout(() => {
        if (Date.now() - lastIndexResponse > 60 * 1000) {
            console.error('[WATCHDOG][perfmonitor]: No response from index.js in 60s!');
            sendToShardManager('indexunresponsive', { reason: 'No response from index.js in 60s' });
        }
    }, 60 * 1000);
}

process.on('message', (msg) => {
    if (msg && msg.type === 'wdg:pong') {
        lastIndexResponse = Date.now();
    }
});

setInterval(checkUnresponsive, 5 * 60 * 1000);
setTimeout(() => setInterval(checkRAM, 5 * 60 * 1000), 60 * 1000);
setTimeout(() => setInterval(checkStorage, 5 * 60 * 1000), 120 * 1000);
setTimeout(() => setInterval(pingIndex, 5 * 60 * 1000), 180 * 1000);