const dns = require('dns');
const { sendToShardManager } = require('./core');

function checkNetwork() {
    dns.lookup('google.com', (err) => {
        if (err) {
            console.error('[WATCHDOG][netmonitor]: Network access failed!');
            sendToShardManager('neterr', { reason: 'Network access failed' });
        }
    });
}

// Run every 5 minutes, offset by 0s
setInterval(checkNetwork, 5 * 60 * 1000);