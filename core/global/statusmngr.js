const { ChannelType, WebhookClient, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
const client = require('./Client.js'); 

const settingsPath = path.join(__dirname, '../../settings.json');
let settings = {};

try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
} catch (error) {
    console.error('Error loading settings.json:', error.message);
}

const ModuleEnabled = settings.modules?.statuspageupdates || false;

const STATUSPAGE_API_KEY = process.env.STATUSPAGEAPIKEY;
const STATUSPAGE_PAGE_ID = process.env.PAGEID;
const NOVADROPDOWN_ID = process.env.NOVADROPDOWN_ID;
const STATUSPAGE_API = `https://api.statuspage.io/v1/pages/${STATUSPAGE_PAGE_ID}/incidents`;
const webhookURL = 'YOUR_STATUS_UPDATES_WEBHOOK_URL';
const webhookClient = new WebhookClient({ url: webhookURL });

const lockFilePath = path.join(__dirname, 'incidentLock.json');

/**
 * Load the lock file to persist incident states across restarts.
 */
function loadLockFile() {
    try {
        if (fs.existsSync(lockFilePath)) {
            const data = fs.readFileSync(lockFilePath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading lock file:', error.message);
    }
    return {};
}

/**
 * Save the lock file to persist incident states across restarts.
 */
function saveLockFile() {
    try {
        fs.writeFileSync(lockFilePath, JSON.stringify(lock, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving lock file:', error.message);
    }
}

let lock = loadLockFile();

if (ModuleEnabled) {
    /**
     * Clean up resolved incidents from the lock file during initialization.
     */
    async function cleanUpResolvedIncidents() {
        try {
            const response = await axios.get(STATUSPAGE_API, {
                headers: {
                    'Authorization': `OAuth ${STATUSPAGE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const incidents = response.data;

            // Get IDs of resolved incidents
            const resolvedIncidentIds = incidents
                .filter(incident => incident.status === 'resolved')
                .map(incident => incident.id);

            let lockModified = false;

            // Remove resolved incidents from the lock file
            for (const incidentId of resolvedIncidentIds) {
                if (lock[incidentId]) {
                    console.log(`Cleaning up resolved incident ${incidentId} from lock file.`);
                    delete lock[incidentId];
                    lockModified = true;
                }
            }

            if (lockModified) {
                saveLockFile();
            }
        } catch (error) {
            console.error('Error during cleanup of resolved incidents:', error.response?.data || error.message);
        }
    }

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

            const filteredIncidents = incidents.filter(incident => 
                incident.components.some(component => component.group_id === NOVADROPDOWN_ID)
            );

            return filteredIncidents.length ? filteredIncidents[0] : null;
        } catch (error) {
            console.error('Error fetching Statuspage data:', error.response?.data || error.message);
            return null;
        }
    }

    async function sendDiscordWebhook(incident, client) {
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
    
        const updateFields = incident.incident_updates.map(update => {
            let updateBody = update.body || 'Error';
            if (updateBody.length > 260) {
                updateBody = `${updateBody.slice(0, 257)}...`;
            }
            return {
                name: '\u200B',
                value: `**<t:${Math.floor(new Date(update.created_at).getTime() / 1000)}:R>** - ${updateBody}`
            };
        });
    
        const embed = {
            title: embedTitle,
            color: embedColours[incident.status] || 0xE74C3C,
            fields: [
                ...updateFields,
                { name: '**Status**', value: `**${incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}**` }
            ],
            footer: { text: 'Nova: Status Notifications' },
            timestamp: new Date(incident.created_at).toISOString(),
        };
    
        try {
            // Send the embed to the webhook
            const webhookMessage = await webhookClient.send({
                username: 'Nova://StatusUpdates',
                avatarURL: 'https://i.imgur.com/32dvTiW.png',
                embeds: [embed],
                });
            console.log('Sent new webhook message.');
    
            // Fetch the guild and channel using the bot client
            const guildId = '1225142849922928661'; // Replace with your guild ID
            const channelId = '1360019791322284232'; // Replace with your channel ID
            const guild = await client.guilds.fetch(guildId); // Use the bot's client instance
            const channel = await guild.channels.fetch(channelId); // Use the bot's client instance
    
            // Check if the channel is an announcement channel
            if (!channel || channel.type !== ChannelType.GuildAnnouncement) {
                console.error('The specified channel is not a valid announcement channel.');
                return;
            }
    
            // Fetch the message sent by the webhook
            const fetchedMessages = await channel.messages.fetch({ limit: 10 }); // Fetch recent messages
            const webhookSentMessage = fetchedMessages.find(msg => msg.author.id === webhookClient.id);
    
            if (webhookSentMessage) {
                // Publish the message in the announcement channel
                await webhookSentMessage.crosspost();
                console.log('Published the message to the announcement channel.');
            } else {
                console.error('Could not find the webhook message to publish.');
            }
        } catch (error) {
            console.error('Error sending or publishing webhook:', error.response?.data || error.message);
        }
    }

    async function updateStatusEmbed() {
        try {
            const response = await axios.get(STATUSPAGE_API, {
                headers: {
                    'Authorization': `OAuth ${STATUSPAGE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const incidents = response.data;

            // Get the current timestamp
            const now = Date.now();

            // Filter incidents related to the specified component group and exclude resolved incidents
            const filteredIncidents = incidents.filter(incident =>
                incident.components.some(component => component.group_id === NOVADROPDOWN_ID) &&
                incident.status !== 'resolved' && // Exclude resolved incidents
                new Date(incident.updated_at).getTime() > now - 24 * 60 * 60 * 1000 // Only process incidents updated in the last 24 hours
            );

            if (!filteredIncidents.length) {
                console.log('No new updates.');
                return;
            }

            let lockModified = false;

            // Process each incident
            for (const incident of filteredIncidents) {
                const incidentId = incident.id;
                const latestUpdateId = incident.incident_updates[0]?.id;

                // Check if the incident has already been processed
                if (lock[incidentId] === latestUpdateId) {
                    console.log(`Incident ${incidentId} already processed for the latest update.`);
                    continue; // Skip this incident
                }

                // Send a webhook for the latest incident update
                await sendDiscordWebhook(incident, client);

                // Update the lock file with the latest update ID
                lock[incidentId] = latestUpdateId;
                lockModified = true;
            }

            // Save the lock file if it was modified
            if (lockModified) {
                saveLockFile();
            }
        } catch (error) {
            console.error('Error updating status embed:', error.response?.data || error.message);
        }
    }

    cleanUpResolvedIncidents();
    setInterval(updateStatusEmbed, 15 * 60 * 1000);
    updateStatusEmbed();
} else {
    console.log('Status Manager is disabled. Status updates will not be displayed.');
}