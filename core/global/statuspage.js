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

const ModuleEnabled = settings.modules?.statuspage_core || true; // Fail Open

// Env Vars
const statusPageApiKey = process.env.STATUSPAGEAPIKEY;
const pageId = process.env.PAGEID;
const metricId = process.env.METRICID;
const itemId = process.env.ITEMID;
const STATUSPAGE_BASE = 'https://api.statuspage.io/v1';

let statusPageLogResponse = "";

// Used for deduplication
let loopRunning = false;

// Simulate Ping / Latency Measurement
const measureLatency = async () => {
    try {
        const startTime = Date.now();
        await axios.get(`${STATUSPAGE_BASE}/pages/${pageId}`, {
            headers: { 'Authorization': `OAuth ${statusPageApiKey}` },
            timeout: 5000
        });
        return Date.now() - startTime;
    } catch (error) {
        log('WRN', `Latency measurement failed: ${error.message}`);
        return null;
    }
};

// Submit single latency point
const submitLatency = async (latency) => {
    const timestamp = Math.floor(Date.now() / 1000);
    try {
        const res = await axios.post(
            `${STATUSPAGE_BASE}/pages/${pageId}/metrics/${metricId}/data.json`,
            { data: { timestamp, value: latency } },
            { headers: { 'Authorization': `OAuth ${statusPageApiKey}`, 'Content-Type': 'application/json' } }
        );
        log('INF', `Submitted latency: ${latency}ms`);
        statusPageLogResponse = `Submitted latency ${latency}ms: ${JSON.stringify(res.data)}`;
        return res.data;
    } catch (error) {
        if (error.response?.status === 429) {
            log('WRN', 'Rate limited while submitting latency. Waiting 60s.');
            await new Promise(resolve => setTimeout(resolve, 60000));
        } else {
            log('ERR', `Submission error: ${error.response?.data || error.message}`);
            statusPageLogResponse = `Submission error: ${error.response?.data || error.message}`;
        }
    }
};

// Periodic loop
const startLatencyLoop = async () => {
    if (loopRunning) return;
    loopRunning = true;

    log('INF', 'Starting latency metric loop.');

    const runLoop = async () => {
        while (true) {
            try {
                const latency = await measureLatency();
                if (latency !== null) {
                    await submitLatency(latency);
                } else {
                    log('DBG', 'Latency measurement returned null; skipping submission.');
                }
                await new Promise(resolve => setTimeout(resolve, 90000));
            } catch (err) {
                log('ERR', `[Statuspage] Fatal error in loop: ${err.message}`);
                log('INF', '[Statuspage] Restarting loop in 30s...');
                await new Promise(resolve => setTimeout(resolve, 30000));
                return runLoop(); // restart fresh
            }
        }
    };

    runLoop();
};

// Update component status manually
const updateComponentStatus = async (newStatus = 'operational') => {
    try {
        const current = await axios.get(
            `https://api.statuspage.io/v1/pages/${pageId}/components/${itemId}`,
            {
                headers: {
                    'Authorization': `OAuth ${statusPageApiKey}`
                }
            }
        );
        if (current.data.status === 'under_maintenance') {
            log('INF', 'Component in maintenance. Skipping status update.');
            return;
        }

        const response = await axios.patch(
            `${STATUSPAGE_BASE}/pages/${pageId}/components/${itemId}`,
            { component: { status: newStatus } },
            { headers: { 'Authorization': `OAuth ${statusPageApiKey}`, 'Content-Type': 'application/json' } }
        );

        log('INF', `Component set to ${newStatus}.`);
        statusPageLogResponse = `Statuspage item updated: ${JSON.stringify(response.data)}`;
    } catch (error) {
        log('ERR', `Failed to update component: ${error.response?.data || error.message}`);
        statusPageLogResponse = `Status update failed: ${error.response?.data || error.message}`;
    }
};

// Initialization runner
const init = async () => {
    if (!ModuleEnabled) {
        log('INF', 'Module disabled via settings.');
        return;
    }

    // Validate required env values
    if (!statusPageApiKey || !pageId || !metricId || !itemId) {
        log('ERR', 'Missing STATUSPAGE environment variables. Please set STATUSPAGEAPIKEY, PAGEID, METRICID and ITEMID.');
        return;
    }

    await updateComponentStatus();
    // submit one immediate latency datapoint so Statuspage has data right away
    try {
        const firstLatency = await measureLatency();
        if (firstLatency !== null) await submitLatency(firstLatency);
    } catch (err) {
        log('WRN', `Initial latency submission failed: ${err.message}`);
    }
    await startLatencyLoop(); // No await to keep looping
};

// External API
module.exports = {
    init,
    update: updateComponentStatus,
    getLastLog: () => statusPageLogResponse
};

// Auto-run init when module is required by the application entrypoint.
// init() will internally check whether this process should be the primary runner (IS_PRIMARY).
init().catch(err => log('ERR', `Statuspage init failed: ${err.message || err}`));
