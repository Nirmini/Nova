const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// --- Coloured Logs!! :D ---
const colors = {
    gray: "\x1b[90m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    white: "\x1b[37m",
    cyan: "\x1b[36m",
    reset: "\x1b[0m",
};

function log(level, msg) {
    const ts = new Date().toISOString();
    let color = colors.green;
    let tag = 'INF';
    if (level === 'ERR') { color = colors.red; tag = 'ERR'; }
    else if (level === 'DBG') { color = colors.cyan; tag = 'DBG'; }
    else if (level === 'WRN') { color = colors.red; tag = 'WRN'; }
    console.log(`${colors.gray}${ts}${colors.reset} ${color}${tag}${colors.reset} ${colors.white}${msg}${colors.reset}`);
}

const settingsPath = path.join(__dirname, '../../settings.json');
let settings = {};

try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
} catch (error) {
    console.error('Error loading settings.json:', error.message);
}

// Module must be explicitly true — no fail-open
const ModuleEnabled = settings.modules?.status_core === true;

// Provider: 'statuspage' | 'betterstack' | 'custom:<url>'
const statusProvider = (settings.status_provider || 'statuspage').toLowerCase().trim();

let statusPageLogResponse = '';

// ---------------------------------------------------------------------------
// Statuspage provider
// ---------------------------------------------------------------------------

function buildStatuspageModule() {
    const statusPageApiKey = process.env.STATUSPAGEAPIKEY;
    const pageId           = process.env.PAGEID;
    const metricId         = process.env.METRICID;
    const itemId           = process.env.ITEMID;
    const STATUSPAGE_BASE  = 'https://api.statuspage.io/v1';

    if (!statusPageApiKey || !pageId || !metricId || !itemId) {
        log('ERR', '[Statuspage] Missing required env vars: STATUSPAGEAPIKEY, PAGEID, METRICID, ITEMID. Status Core will not start.');
        return null;
    }

    // Used for deduplication
    let loopRunning = false;

    const measureLatency = async () => {
        try {
            const startTime = Date.now();
            await axios.get(`${STATUSPAGE_BASE}/pages/${pageId}`, {
                headers: { 'Authorization': `OAuth ${statusPageApiKey}` },
                timeout: 5000
            });
            return Date.now() - startTime;
        } catch (error) {
            log('WRN', `[Statuspage] Latency measurement failed: ${error.message}`);
            return null;
        }
    };

    const submitLatency = async (latency) => {
        const timestamp = Math.floor(Date.now() / 1000);
        try {
            const res = await axios.post(
                `${STATUSPAGE_BASE}/pages/${pageId}/metrics/${metricId}/data.json`,
                { data: { timestamp, value: latency } },
                { headers: { 'Authorization': `OAuth ${statusPageApiKey}`, 'Content-Type': 'application/json' } }
            );
            log('INF', `[Statuspage] Submitted latency: ${latency}ms`);
            statusPageLogResponse = `Submitted latency ${latency}ms: ${JSON.stringify(res.data)}`;
            return res.data;
        } catch (error) {
            if (error.response?.status === 429) {
                log('WRN', '[Statuspage] Rate limited while submitting latency. Waiting 60s.');
                await new Promise(resolve => setTimeout(resolve, 60000));
            } else {
                log('ERR', `[Statuspage] Submission error: ${error.response?.data || error.message}`);
                statusPageLogResponse = `Submission error: ${error.response?.data || error.message}`;
            }
        }
    };

    const startLatencyLoop = async () => {
        if (loopRunning) return;
        loopRunning = true;
        log('INF', '[Statuspage] Starting latency metric loop.');

        const runLoop = async () => {
            while (true) {
                try {
                    const latency = await measureLatency();
                    if (latency !== null) {
                        await submitLatency(latency);
                    } else {
                        log('DBG', '[Statuspage] Latency measurement returned null; skipping submission.');
                    }
                    await new Promise(resolve => setTimeout(resolve, 90000));
                } catch (err) {
                    log('ERR', `[Statuspage] Fatal error in loop: ${err.message}`);
                    log('INF', '[Statuspage] Restarting loop in 30s...');
                    await new Promise(resolve => setTimeout(resolve, 30000));
                    return runLoop();
                }
            }
        };

        runLoop();
    };

    const updateComponentStatus = async (newStatus = 'operational') => {
        try {
            const current = await axios.get(
                `${STATUSPAGE_BASE}/pages/${pageId}/components/${itemId}`,
                { headers: { 'Authorization': `OAuth ${statusPageApiKey}` } }
            );
            if (current.data.status === 'under_maintenance') {
                log('INF', '[Statuspage] Component in maintenance. Skipping status update.');
                return;
            }

            const response = await axios.patch(
                `${STATUSPAGE_BASE}/pages/${pageId}/components/${itemId}`,
                { component: { status: newStatus } },
                { headers: { 'Authorization': `OAuth ${statusPageApiKey}`, 'Content-Type': 'application/json' } }
            );

            log('INF', `[Statuspage] Component set to ${newStatus}.`);
            statusPageLogResponse = `Statuspage item updated: ${JSON.stringify(response.data)}`;
        } catch (error) {
            log('ERR', `[Statuspage] Failed to update component: ${error.response?.data || error.message}`);
            statusPageLogResponse = `Status update failed: ${error.response?.data || error.message}`;
        }
    };

    const init = async () => {
        await updateComponentStatus();
        try {
            const firstLatency = await measureLatency();
            if (firstLatency !== null) await submitLatency(firstLatency);
        } catch (err) {
            log('WRN', `[Statuspage] Initial latency submission failed: ${err.message}`);
        }
        await startLatencyLoop();
    };

    return { init, update: updateComponentStatus };
}

// ---------------------------------------------------------------------------
// BetterStack provider
// ---------------------------------------------------------------------------

function buildBetterStackModule() {
    const BETTERSTACK_TOKEN = process.env.BETTERSTACK_TOKEN;
    const MONITOR_ID        = process.env.BETTERSTACK_MONITOR_ID;
    const BS_BASE           = 'https://uptime.betterstack.com/api/v2';

    if (!BETTERSTACK_TOKEN || !MONITOR_ID) {
        log('ERR', '[BetterStack] Missing required env vars: BETTERSTACK_TOKEN, BETTERSTACK_MONITOR_ID. Status Core will not start.');
        return null;
    }

    /**
     * Maps a generic status string to a BetterStack monitor paused state.
     * BetterStack Uptime doesn't support arbitrary status labels on monitors —
     * the only writable field is `paused`. Non-operational states pause the monitor
     * so alerting is suppressed; operational resumes it.
     */
    const updateComponentStatus = async (newStatus = 'operational') => {
        const shouldPause = newStatus !== 'operational';

        try {
            const response = await axios.patch(
                `${BS_BASE}/monitors/${MONITOR_ID}`,
                { paused: shouldPause },
                { headers: { 'Authorization': `Bearer ${BETTERSTACK_TOKEN}`, 'Content-Type': 'application/json' } }
            );

            const resultStatus = response.data?.data?.attributes?.status || 'unknown';
            log('INF', `[BetterStack] Monitor ${shouldPause ? 'paused' : 'unpaused'} (requested: ${newStatus}, reported: ${resultStatus}).`);
            statusPageLogResponse = `BetterStack monitor updated: paused=${shouldPause}, status=${resultStatus}`;
        } catch (error) {
            log('ERR', `[BetterStack] Failed to update monitor: ${error.response?.data || error.message}`);
            statusPageLogResponse = `BetterStack update failed: ${error.response?.data || error.message}`;
        }
    };

    const init = async () => {
        // Ensure monitor is unpaused on startup (treat as coming back operational)
        await updateComponentStatus('operational');
        // No latency loop — Telemetry is not in scope for BetterStack
    };

    return { init, update: updateComponentStatus };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

let activeModule = null;

if (!ModuleEnabled) {
    log('INF', 'Status Core module is disabled (settings.modules.status_core is not true). No env vars required.');
} else if (statusProvider === 'statuspage') {
    activeModule = buildStatuspageModule();
} else if (statusProvider === 'betterstack') {
    activeModule = buildBetterStackModule();
} else if (statusProvider.startsWith('custom:')) {
    log('INF', `[Custom] Provider detected (${statusProvider}). Custom status core is not yet implemented.`);
} else {
    log('ERR', `Unknown status_provider "${statusProvider}". Valid options: statuspage, betterstack, custom:<url>.`);
}

if (activeModule) {
    activeModule.init().catch(err => log('ERR', `Status Core init failed: ${err.message || err}`));
}

// ---------------------------------------------------------------------------
// External API
// ---------------------------------------------------------------------------

module.exports = {
    init:       () => activeModule?.init()   ?? Promise.resolve(),
    update:     (status) => activeModule?.update(status) ?? Promise.resolve(),
    getLastLog: () => statusPageLogResponse
};