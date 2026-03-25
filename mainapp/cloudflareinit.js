// cloudflared.js
const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const { log } = require('../mainappmodules/logs');

require('./errorhandling');

const tunnelId = process.env.CF_Tunnel_ID;
const winPath = path.join(__dirname, '../cloudflared.exe');
const linuxCommand = 'cloudflared';
const args = ['tunnel', 'run', tunnelId];

const settings = require('../settings.json');

// --- Health Check Config ---
const INTERVAL_NORMAL    = 10 * 60 * 1000; //  10 minutes
const INTERVAL_DEGRADED  =      60 * 1000; //   1 minute
const GRACE_PERIOD       =  5 * 60 * 1000; //   5 minutes
const FAIL_THRESHOLD     = 2;              // consecutive 503/500s before restart

const plat         = settings.novaBranchVersion === 'prod' ? 'prod' : 'ops';
const healthUrl    = `https://server${plat}.nirmini.dev/api/GetServerCount`;

// --- State ---
let cloudflaredProc  = null;
let healthTimer      = null;
let consecutiveFails = 0;
let degraded         = false;

// --- Tunnel ---
function startCloudflared() {
    log.info('[Cloudflared] Starting...');

    const execCommand = process.platform === 'win32' ? winPath : linuxCommand;
    log.info(`[Cloudflared] Using ${process.platform === 'win32' ? `Windows executable: ${winPath}` : 'system cloudflared command'}`);

    cloudflaredProc = spawn(execCommand, args, { stdio: 'inherit' });

    cloudflaredProc.on('spawn', () => log.info('[Cloudflared] Process started.'));

    cloudflaredProc.on('exit', (code, signal) => {
        log.whook(`[Cloudflared] Exited with code ${code}, signal ${signal}`);
        cloudflaredProc = null;
    });

    cloudflaredProc.on('error', (err) => {
        log.error(`[Cloudflared] Failed to start: ${err.message}`);
        cloudflaredProc = null;
    });
}

function restartCloudflared() {
    log.whook('[Cloudflared] Restarting tunnel due to sustained 503/500 responses...');

    if (cloudflaredProc) {
        try {
            cloudflaredProc.kill();
        } catch (err) {
            log.error(`[Cloudflared] Error killing process before restart: ${err.message}`);
        }
        cloudflaredProc = null;
    }

    startCloudflared();

    // Reset state and enter grace period before resuming health checks
    consecutiveFails = 0;
    degraded         = false;
    scheduleHealthCheck(false, true);
}

// --- Health Check ---
async function runHealthCheck() {
    try {
        const res = await axios.get(healthUrl, { timeout: 10000 });

        if (res.status === 503 || res.status === 500) {
            handleBadStatus(res.status);
        } else {
            // Healthy — reset state and return to normal interval
            if (consecutiveFails > 0 || degraded) {
                log.info(`[Cloudflared:Health] Tunnel recovered. Returning to normal polling.`);
            }
            consecutiveFails = 0;
            degraded         = false;
            scheduleHealthCheck(false, false);
        }
    } catch (err) {
        // axios throws on 5xx depending on config — also catches network errors
        const status = err.response?.status;
        if (status === 503 || status === 500) {
            handleBadStatus(status);
        } else {
            log.warn(`[Cloudflared:Health] Check failed with unexpected error: ${err.message}`);
            scheduleHealthCheck(degraded, false);
        }
    }
}

function handleBadStatus(status) {
    consecutiveFails++;
    log.warn(`[Cloudflared:Health] ${status} received (${consecutiveFails}/${FAIL_THRESHOLD} consecutive).`);

    if (consecutiveFails >= FAIL_THRESHOLD) {
        restartCloudflared();
    } else {
        // Enter degraded mode — poll every minute
        if (!degraded) {
            log.info('[Cloudflared:Health] Entering degraded polling mode (1 min interval).');
            degraded = true;
        }
        scheduleHealthCheck(true, false);
    }
}

function scheduleHealthCheck(useDegradedInterval = false, useGracePeriod = false) {
    if (healthTimer) {
        clearTimeout(healthTimer);
        healthTimer = null;
    }

    let delay;
    if (useGracePeriod) {
        delay = GRACE_PERIOD;
        log.info(`[Cloudflared:Health] Grace period started. Next check in 5 minutes.`);
    } else {
        delay = useDegradedInterval ? INTERVAL_DEGRADED : INTERVAL_NORMAL;
    }

    healthTimer = setTimeout(runHealthCheck, delay);
}

// --- Init ---
startCloudflared();
scheduleHealthCheck(false, false);