const dns = require('dns');
const { sendToShardManager } = require('./core');

function checkNetwork() {
    dns.lookup('google.com', (err) => {
        if (err) {
            console.error('[WATCHDOG][netmonitor]: Network access failed!');
            sendToShardManager('neterr', { reason: 'Network access failed' });
        }
        else {
            console.log('[WATCHDOG]: Network access check passed.')
        }
    });
}

module.exports = {
    checkNetwork
}

setInterval(checkNetwork, 5 * 60 * 1000);

setInterval();