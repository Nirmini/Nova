const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const settingsPath = path.join(__dirname, '../../settings.json');
let settings = {};

try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
} catch (error) {
    console.error('Error loading settings.json:', error.message);
}

const ModuleEnabled = settings.modules?.statuspageupdates || false;

// Env Vars
const statusPageApiKey = process.env.STATUSPAGEAPIKEY;
const pageId = process.env.PAGEID;
const metricId = process.env.METRICID;
const itemId = process.env.ITEMID;

let statusPageLogResponse = "";

// Used for deduplication
let loopRunning = false;

// Simulate Ping / Latency Measurement
const measureLatency = async () => {
    try {
        const startTime = Date.now();
        await axios.get(`https://api.statuspage.io/v1/pages/${pageId}`, {
            headers: {
                'Authorization': `OAuth ${statusPageApiKey}`
            },
            timeout: 5000
        });
        return Date.now() - startTime;
    } catch (error) {
        console.error('[Statuspage] Latency measurement failed:', error.message);
        return null;
    }
};

// Submit single latency point
const submitLatency = async (latency) => {
    const timestamp = Math.floor(Date.now() / 1000);
    try {
        const res = await axios.post(
            `https://api.statuspage.io/v1/pages/${pageId}/metrics/${metricId}/data.json`,
            {
                data: { timestamp, value: latency }
            },
            {
                headers: {
                    'Authorization': `OAuth ${statusPageApiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`[Statuspage] Submitted latency: ${latency}ms`);
        return res.data;
    } catch (error) {
        if (error.response?.status === 429) {
            console.warn('[Statuspage] Rate limited. Waiting 60s.');
            await new Promise(resolve => setTimeout(resolve, 60000));
        } else {
            console.error('[Statuspage] Submission error:', error.response?.data || error.message);
        }
    }
};

// Periodic loop
const startLatencyLoop = async () => {
    if (loopRunning) return;
    loopRunning = true;

    console.log('[Statuspage] Starting latency metric loop.');

    while (true) {
        const latency = await measureLatency();
        if (latency !== null) await submitLatency(latency);
        await new Promise(resolve => setTimeout(resolve, 90000));
    }
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
            console.log('[Statuspage] Component in maintenance. Skipping status update.');
            return;
        }

        const response = await axios.patch(
            `https://api.statuspage.io/v1/pages/${pageId}/components/${itemId}`,
            {
                component: { status: newStatus }
            },
            {
                headers: {
                    'Authorization': `OAuth ${statusPageApiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`[Statuspage] Component set to ${newStatus}.`);
        statusPageLogResponse = `Statuspage item updated: ${JSON.stringify(response.data)}`;
    } catch (error) {
        console.error('[Statuspage] Failed to update component:', error.response?.data || error.message);
        statusPageLogResponse = `Status update failed: ${error.response?.data || error.message}`;
    }
};

// Initialization runner
const init = async () => {
    const isPrimary = process.env.IS_PRIMARY === 'true'; // Optional shard control

    if (!ModuleEnabled) {
        console.log('[Statuspage] Module disabled via settings.');
        return;
    }

    if (!isPrimary) {
        console.log('[Statuspage] Not primary process. Skipping startup.');
        return;
    }

    await updateComponentStatus();
    await startLatencyLoop(); // No await to keep looping
};

// External API
module.exports = {
    init,
    update: updateComponentStatus,
    statusPageLogResponse
};

// Only auto-run if main process
if (require.main === module) {
    init();
}
