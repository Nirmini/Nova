//Common Deps
const os = require('os');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

/**
 * TO DO:
 * Integrate this density with ../settings.json
 * Move away from IPCs for communication with shard processes
 */

// IPC helpers
function sendToShardManager(type, data = {}) {
    if (process.send) {
        process.send({ type: `wdg:${type}`, ...data });
    }
}

process.send({ type: "wdg:pong" });

module.exports = { sendToShardManager };

require('./netmonitor');
require('./opsmonitor');
require('./perfmonitor');

const envcfg = require('../settings.json');
try {
    if (!envcfg.watchdogcfg.enabled) {
        if (!envcfg.watchdogcfg.alertdisabled) {
            console.warn("[WATCHDOG]: Watchdog is disabled in the running instance! Please review your configuration if this isn't intentional.");
        } else {
            console.log("Suppressed 1 warning(s) from watchdog.");
        }
    } else {
        //Why is there an else here, was I drunk?
    }
} catch(error) {
    console.error('[WATCHDOG]: Stopping due to an error:', error);
    throw new Error("[WATCHDOG]: An error occured while getting Watchdog's settings. Check the recent logs for further information.");
}