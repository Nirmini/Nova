const { log } = require('../mainappmodules/logs');
const settings = require('../settings.json');

/**
 * NIRMINI NOVA: Application Error Handler
 * Author: SimplyKatt
 * Purpose: Record errors when they occur and attempt to restart the application or module.
 * Usage: require('./errorhandling') at the top of any service that needs crash recovery.
 */

const SERVICE_NAME = process.env.SERVICE_NAME || null;

// Lazy-require ipchelper to avoid circular dependency issues at load time
function getIPC() {
    return require('./ipchelper');
}

function requestRestart(reason) {
    log.info(`ERRHNDL: Requesting mainapp restart service "${SERVICE_NAME}" (reason: ${reason})...`);
    try {
        getIPC().send('mainapp', {
            key: 'restartService',
            value: { name: SERVICE_NAME, reason },
            from: SERVICE_NAME
        });
    } catch (err) {
        log.error(`ERRHNDL: Failed to send restart IPC to mainapp: ${err.message}. Exiting instead.`);
        process.exit(1);
    }
}

process.on('uncaughtException', (err) => {
    log.whook(`ERRHNDL: General Uncaught Exception Occurred!\n${err}`);
    log.error(`ERRHNDL: General Uncaught Exception Occurred!\n${err}`);

    if (!settings.mainapplibrary.recover_on_crash) {
        process.exit(1);
    } else if (!SERVICE_NAME) {
        log.error(`ERRHNDL: SERVICE_NAME is not set — cannot request targeted restart. Exiting.`);
        process.exit(1);
    } else {
        log.info(`ERRHNDL: Attempting to Recover the Process...`);
        requestRestart('uncaughtException');
    }
});

process.on('unhandledRejection', (reason) => {
    log.whook(`ERRHNDL: Unhandled Promise Rejection in "${SERVICE_NAME}"!\n${reason}`);
    log.error(`ERRHNDL: Unhandled Promise Rejection in "${SERVICE_NAME}"!\n${reason}`);
    // No restart — log only.
});

module.exports = {};