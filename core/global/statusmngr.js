const { WebhookClient, MessageFlags } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const ModuleEnabled = true

const STATUSPAGE_API_KEY = process.env.STATUSPAGEAPIKEY;
const STATUSPAGE_PAGE_ID = process.env.PAGEID;
const NOVADROPDOWN_ID = process.env.NOVADROPDOWN_ID; 
const STATUSPAGE_API = `https://api.statuspage.io/v1/pages/${STATUSPAGE_PAGE_ID}/incidents`;
const webhookURL = '<YOUR_STATUS_WEBHOOK_URL>';
const webhookClient = new WebhookClient({ url: webhookURL });

let lastIncident = null;

if (ModuleEnabled) {

/**
 * Fetch the latest incident from Statuspage API, filtered by group ID.
 */
async function fetchLatestIncident() {
    try {
        const response = await axios.get(STATUSPAGE_API, {
            headers: { 
                'Authorization': `OAuth ${STATUSPAGE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const incidents = response.data;
        if (!incidents.length) return null;

        // Filter incidents to only include those under the specific group ID
        const filteredIncidents = incidents.filter(incident => 
            incident.components.some(component => component.group_id === NOVADROPDOWN_ID)
        );

        return filteredIncidents.length ? filteredIncidents[0] : null; // Return the most recent valid incident
    } catch (error) {
        console.error('Error fetching Statuspage data:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Send an embed message to the Discord webhook
 */
async function sendDiscordWebhook(incident) {
    const statusEmojis = {
        investigating: '<:Investigating:1343438333145124966>',
        identified: '<:Identified:1343438330435731457>',
        monitoring: '<:Monitoring:1343438334734635100>',
        resolved: '<:Operational:1343438331723251823>'
    };
    const embedColours = {
        investigating: 0xBD6A6A,
        identified: 0xBA6ABD,
        monitoring: 0x6ABD74,
        resolved: 0x6ABDB1
    };

    const statusEmoji = statusEmojis[incident.status] || '<:NovaRed:1322771825087873147>';
    const embedTitle = `${statusEmoji} ${incident.name} - ${incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}`;

    // Format incident updates as individual fields with trimmed descriptions
    const updateFields = incident.incident_updates.map(update => {
        let updateBody = update.body || 'Error';
        if (updateBody.length > 260) {
            updateBody = `${updateBody.slice(0, 257)}...`;
        }
        return {
            name: '\u200B', // Invisible title
            value: `**<t:${Math.floor(new Date(update.created_at).getTime() / 1000)}:R>** - ${updateBody}`
        };
    });

    const embed = {
        title: embedTitle,
        color: embedColours[incident.status] || 0xE74C3C,
        fields: [
            ...updateFields, // All updates from incident
            { name: '\u200B', value: 'If you have any further issues, please ping an NDT staff member.' },
            { name: '**Status**', value: `**${incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}**` }
        ],
        timestamp: new Date(incident.created_at).toISOString(),
    };

    try {
        await webhookClient.send({ embeds: [embed] });
        console.log('Sent new webhook message.');
    } catch (error) {
        console.error('Error sending webhook:', error.response?.data || error.message);
    }
}

/**
 * Periodically check for status updates
 */
async function updateStatusEmbed() {
    const latestIncident = await fetchLatestIncident();
    if (!latestIncident || JSON.stringify(latestIncident) === JSON.stringify(lastIncident)) {
        console.log('No new updates.');
        return;
    }

    await sendDiscordWebhook(latestIncident);
    lastIncident = latestIncident;
}

// Run every 5 minutes
setInterval(updateStatusEmbed, 5 * 60 * 1000);
updateStatusEmbed(); // Run immediately on startup
} else {
    console.log('Status Manager is disabled. Status updates will not be displayed.');
}