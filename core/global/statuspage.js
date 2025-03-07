const axios = require('axios');
require('dotenv').config();
require('./statusmngr');
// Environment Variables
const statusPageApiKey = process.env.STATUSPAGEAPIKEY;
const pageId = process.env.PAGEID;
const metricId = process.env.METRICID; // Ensure this is set in .env
const itemId = process.env.ITEMID;

let statusPageLogResponse = "";

// Measure Latency (Similar to ?ping)
const measureLatency = async () => {
    try {
        const startTime = Date.now();

        // Simulate a lightweight ping with a request to your Statuspage component or another reliable endpoint
        await axios.get(`https://api.statuspage.io/v1/pages/${pageId}`, {
            headers: {
                'Authorization': `OAuth ${statusPageApiKey}`
            },
            timeout: 5000
        });

        const endTime = Date.now();
        const latency = endTime - startTime;

        console.log(`Measured latency: ${latency} ms`);
        return latency;
    } catch (error) {
        console.error('Error measuring latency:', error.message);
        return null; // Return null if latency couldn't be measured
    }
};

// Submit Latency Metric Data with Rate Limiting
const submitLatencyMetrics = async () => {
    console.log("Starting continuous latency metric submission...");

    let dataPointCounter = 0;

    while (true) { // Infinite loop for continuous submission
        const timestamp = Math.floor(Date.now() / 1000); // Current timestamp
        const latency = await measureLatency();

        // Skip submission if latency measurement failed
        if (latency === null) {
            console.warn(`Skipping metric point ${dataPointCounter + 1}: Unable to measure latency.`);
            continue;
        }

        try {
            const response = await axios({
                method: 'post',
                url: `https://api.statuspage.io/v1/pages/${pageId}/metrics/${metricId}/data.json`,
                headers: {
                    'Authorization': `OAuth ${statusPageApiKey}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    data: {
                        timestamp,
                        value: latency
                    }
                }
            });
            dataPointCounter++;
            console.log(`Submitted data point ${dataPointCounter}:`, response.data);

            // Add a delay to prevent hitting rate limits
            await new Promise(resolve => setTimeout(resolve, 90000)); // Wait 90 seconds
        } catch (error) {
            if (error.response?.status === 429) {
                console.error(`Rate limit hit. Retrying after delay...`);
                await new Promise(resolve => setTimeout(resolve, 60000)); // 1-minute delay
            } else {
                console.error(`Error submitting metric point ${dataPointCounter}:`, error.response?.data || error.message);
                break; // Exit loop on a non-recoverable error
            }
        }
    }
};

// **Update Component Status (Prevents changes if in maintenance)**
const updateComponentStatus = async () => {
    try {
        // **Fetch current component status**
        const currentStatusResponse = await axios({
            method: 'get',
            url: `https://api.statuspage.io/v1/pages/${pageId}/components/${itemId}`,
            headers: {
                'Authorization': `OAuth ${statusPageApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const currentStatus = currentStatusResponse.data.status;
        console.log(`Current component status: ${currentStatus}`);

        // **Prevent changes if the status is "under_maintenance"**
        if (currentStatus === 'under_maintenance') {
            console.log('Component is in maintenance mode. Skipping status update.');
            return;
        }

        // **Update status only if it's not in maintenance**
        const response = await axios({
            method: 'patch',
            url: `https://api.statuspage.io/v1/pages/${pageId}/components/${itemId}`,
            headers: {
                'Authorization': `OAuth ${statusPageApiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                component: {
                    status: 'operational'
                }
            }
        });

        console.log('Statuspage item set to operational:', response.data);
        statusPageLogResponse = 'Statuspage item set to operational: ' + JSON.stringify(response.data);

    } catch (error) {
        console.error('Error setting Statuspage item to operational:', error.response?.data || error.message);
        statusPageLogResponse = 'Error setting Statuspage item to operational: ' + error.response?.data || error.message;
    }
};

// Main Function to Run Both Handlers
const main = async () => {
    await updateComponentStatus();
    await submitLatencyMetrics();
};

main();

module.exports = statusPageLogResponse;
