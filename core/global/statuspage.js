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

// Module must be explicitly true — no fail-open
const ModuleEnabled = settings.modules?.status_updates === true;

// Provider: 'statuspage' | 'betterstack' | 'custom:<url>'
const statusProvider = (settings.status_provider || 'statuspage').toLowerCase().trim();

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

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

const lockFilePath = path.join(__dirname, 'incidentLock.json');

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

function saveLockFile() {
    try {
        fs.writeFileSync(lockFilePath, JSON.stringify(lock, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving lock file:', error.message);
    }
}

let lock = loadLockFile();

// ---------------------------------------------------------------------------
// Statuspage provider
// ---------------------------------------------------------------------------

function initStatuspage() {
    const STATUSPAGE_API_KEY  = process.env.STATUSPAGEAPIKEY;
    const STATUSPAGE_PAGE_ID  = process.env.PAGEID;
    const NOVADROPDOWN_ID     = process.env.NOVADROPDOWN_ID;
    const webhookURL          = process.env.Status_Webhook;
    const STATUSPAGE_API      = `https://api.statuspage.io/v1/pages/${STATUSPAGE_PAGE_ID}/incidents`;

    if (!STATUSPAGE_API_KEY || !STATUSPAGE_PAGE_ID || !NOVADROPDOWN_ID || !webhookURL) {
        log('ERR', '[Statuspage] Missing required env vars: STATUSPAGEAPIKEY, PAGEID, NOVADROPDOWN_ID, Status_Webhook. Status Updates will not start.');
        return;
    }

    const webhookClient = new WebhookClient({ url: webhookURL });

    async function listIncidents() {
        try {
            const response = await axios.get(STATUSPAGE_API, {
                headers: { 'Authorization': `OAuth ${STATUSPAGE_API_KEY}`, 'Content-Type': 'application/json' }
            });
            const incidents = response.data || [];
            if (!incidents.length) { log('INF', '[Statuspage] No incidents found.'); return; }
            log('INF', `[Statuspage] Found ${incidents.length} incident(s).`);
            incidents.forEach(inc => {
                log('INF', `Incident ${inc.id} — ${inc.name || '<no-name>'} — status=${inc.status} impact=${inc.impact} created=${inc.created_at}`);
            });
        } catch (err) {
            log('ERR', `[Statuspage] Failed to list incidents: ${err.response?.data || err.message}`);
        }
    }

    async function cleanUpResolvedIncidents() {
        try {
            const response = await axios.get(STATUSPAGE_API, {
                headers: { 'Authorization': `OAuth ${STATUSPAGE_API_KEY}`, 'Content-Type': 'application/json' }
            });
            const resolvedIds = response.data
                .filter(i => i.status === 'resolved')
                .map(i => i.id);

            let lockModified = false;
            for (const id of resolvedIds) {
                if (lock[id]) {
                    log('INF', `[Statuspage] Cleaning up resolved incident ${id} from lock file.`);
                    delete lock[id];
                    lockModified = true;
                }
            }
            if (lockModified) saveLockFile();
        } catch (error) {
            log('ERR', `[Statuspage] Error during cleanup: ${error.response?.data || error.message}`);
        }
    }

    async function sendDiscordWebhook(incident) {
        const statusEmojis = {
            investigating: '<:Investigating:1343438333145124966>',
            identified:    '<:Identified:1343438330435731457>',
            monitoring:    '<:Monitoring:1343438334734635100>',
            resolved:      '<:Operational:1343438331723251823>'
        };
        const embedColours = {
            investigating: 0xBD6A6A,
            identified:    0xBA6ABD,
            monitoring:    0x6ABD74,
            resolved:      0x6ABDB1,
            scheduled:     0x4287f5,
            in_progress:   0x4287f6,
            completed:     0x30d140
        };

        const statusEmoji = statusEmojis[incident.status] || '<:NovaRed:1322771825087873147>';
        const embedTitle  = `${statusEmoji} ${incident.name} - ${incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}`;

        const updateFields = incident.incident_updates.map(update => {
            let updateBody = update.body || 'Error';
            if (updateBody.length > 260) updateBody = `${updateBody.slice(0, 257)}...`;
            return {
                name:  '\u200B',
                value: `**<t:${Math.floor(new Date(update.created_at).getTime() / 1000)}:R>** - ${updateBody}`
            };
        });

        const embed = {
            title:     embedTitle,
            color:     embedColours[incident.status] || 0xFFFFFF,
            fields:    [...updateFields, { name: '**Status**', value: `**${incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}**` }],
            footer:    { text: 'Nova: Status Notifications' },
            timestamp: new Date(incident.created_at).toISOString(),
        };

        try {
            const webhookMessage = await webhookClient.send({
                username:  'Nova://StatusUpdates',
                avatarURL: 'https://i.imgur.com/32dvTiW.png',
                embeds:    [embed],
            });
            log('INF', '[Statuspage] Sent new webhook message.');

            const guildId   = '1225142849922928661';
            const channelId = '1360019791322284232';
            const guild     = await client.guilds.fetch(guildId);
            const channel   = await guild.channels.fetch(channelId);

            if (!channel || channel.type !== ChannelType.GuildAnnouncement) {
                log('ERR', '[Statuspage] The specified channel is not a valid announcement channel.');
                return;
            }

            const fetchedMessages    = await channel.messages.fetch({ limit: 10 });
            const webhookSentMessage = fetchedMessages.find(msg => msg.author.id === webhookClient.id);

            if (webhookSentMessage) {
                await webhookSentMessage.crosspost();
                log('INF', '[Statuspage] Published the message to the announcement channel.');
            } else {
                log('ERR', '[Statuspage] Could not find the webhook message to publish.');
            }
        } catch (error) {
            log('ERR', `[Statuspage] Error sending or publishing webhook: ${error.response?.data || error.message}`);
        }
    }

    async function updateStatusEmbed() {
        try {
            const response = await axios.get(STATUSPAGE_API, {
                headers: { 'Authorization': `OAuth ${STATUSPAGE_API_KEY}`, 'Content-Type': 'application/json' }
            });

            const now = Date.now();
            const filteredIncidents = response.data.filter(incident =>
                incident.components.some(c => c.group_id === NOVADROPDOWN_ID) &&
                incident.status !== 'resolved' &&
                new Date(incident.updated_at).getTime() > now - 24 * 60 * 60 * 1000
            );

            if (!filteredIncidents.length) { log('INF', '[Statuspage] No new updates.'); return; }

            let lockModified = false;
            for (const incident of filteredIncidents) {
                const latestUpdateId = incident.incident_updates[0]?.id;
                if (lock[incident.id] === latestUpdateId) {
                    log('DBG', `[Statuspage] Incident ${incident.id} already processed.`);
                    continue;
                }
                await sendDiscordWebhook(incident);
                lock[incident.id] = latestUpdateId;
                lockModified = true;
            }

            if (lockModified) saveLockFile();
        } catch (error) {
            log('ERR', `[Statuspage] Error updating status embed: ${error.response?.data || error.message}`);
        }
    }

    cleanUpResolvedIncidents();
    listIncidents();
    setInterval(updateStatusEmbed, 15 * 60 * 1000);
    updateStatusEmbed();
}

// ---------------------------------------------------------------------------
// BetterStack provider
// ---------------------------------------------------------------------------

function initBetterStack() {
    const BETTERSTACK_TOKEN  = process.env.BETTERSTACK_TOKEN;
    const webhookURL         = process.env.Status_Webhook;
    const BS_API             = 'https://uptime.betterstack.com/api/v3/incidents';

    if (!BETTERSTACK_TOKEN || !webhookURL) {
        log('ERR', '[BetterStack] Missing required env vars: BETTERSTACK_TOKEN, Status_Webhook. Status Updates will not start.');
        return;
    }

    const webhookClient = new WebhookClient({ url: webhookURL });

    // BetterStack incident statuses: Started, Acknowledged, Resolved
    const embedColours = {
        started:      0xBD6A6A,
        acknowledged: 0xBA6ABD,
        resolved:     0x6ABDB1,
    };

    const statusEmojis = {
        started:      '<:Investigating:1343438333145124966>',
        acknowledged: '<:Identified:1343438330435731457>',
        resolved:     '<:Operational:1343438331723251823>',
    };

    async function fetchActiveIncidents() {
        try {
            const response = await axios.get(BS_API, {
                params:  { resolved: false },
                headers: { 'Authorization': `Bearer ${BETTERSTACK_TOKEN}` }
            });
            return response.data?.data || [];
        } catch (err) {
            log('ERR', `[BetterStack] Failed to fetch incidents: ${err.response?.data || err.message}`);
            return [];
        }
    }

    async function cleanUpResolvedIncidents() {
        try {
            // Fetch only resolved incidents to prune the lock file
            const response = await axios.get(BS_API, {
                params:  { resolved: true },
                headers: { 'Authorization': `Bearer ${BETTERSTACK_TOKEN}` }
            });
            const resolvedIds = (response.data?.data || []).map(i => i.id);

            let lockModified = false;
            for (const id of resolvedIds) {
                if (lock[id]) {
                    log('INF', `[BetterStack] Cleaning up resolved incident ${id} from lock file.`);
                    delete lock[id];
                    lockModified = true;
                }
            }
            if (lockModified) saveLockFile();
        } catch (err) {
            log('ERR', `[BetterStack] Error during cleanup: ${err.response?.data || err.message}`);
        }
    }

    async function sendDiscordWebhook(incident) {
        const attrs  = incident.attributes;
        const status = (attrs.status || 'started').toLowerCase();

        const embedTitle = `${statusEmojis[status] || '<:NovaRed:1322771825087873147>'} ${attrs.name} - ${status.charAt(0).toUpperCase() + status.slice(1)}`;

        let cause = attrs.cause || 'Unknown cause';
        if (cause.length > 260) cause = `${cause.slice(0, 257)}...`;

        const startedTs = attrs.started_at ? Math.floor(new Date(attrs.started_at).getTime() / 1000) : null;

        const fields = [
            { name: '\u200B', value: cause },
            ...(startedTs ? [{ name: '**Started**', value: `<t:${startedTs}:R>`, inline: true }] : []),
            { name: '**Status**', value: `**${status.charAt(0).toUpperCase() + status.slice(1)}**`, inline: true }
        ];

        const embed = {
            title:     embedTitle,
            color:     embedColours[status] || 0xFFFFFF,
            fields,
            footer:    { text: 'Nova: Status Notifications' },
            timestamp: new Date(attrs.started_at || Date.now()).toISOString(),
        };

        try {
            await webhookClient.send({
                username:  'Nova://StatusUpdates',
                avatarURL: 'https://i.imgur.com/32dvTiW.png',
                embeds:    [embed],
            });
            log('INF', `[BetterStack] Sent webhook for incident ${incident.id}.`);

            const guildId   = '1225142849922928661';
            const channelId = '1360019791322284232';
            const guild     = await client.guilds.fetch(guildId);
            const channel   = await guild.channels.fetch(channelId);

            if (!channel || channel.type !== ChannelType.GuildAnnouncement) {
                log('ERR', '[BetterStack] The specified channel is not a valid announcement channel.');
                return;
            }

            const fetchedMessages    = await channel.messages.fetch({ limit: 10 });
            const webhookSentMessage = fetchedMessages.find(msg => msg.author.id === webhookClient.id);

            if (webhookSentMessage) {
                await webhookSentMessage.crosspost();
                log('INF', '[BetterStack] Published the message to the announcement channel.');
            } else {
                log('ERR', '[BetterStack] Could not find the webhook message to publish.');
            }
        } catch (error) {
            log('ERR', `[BetterStack] Error sending or publishing webhook: ${error.response?.data || error.message}`);
        }
    }

    async function updateStatusEmbed() {
        const incidents = await fetchActiveIncidents();

        if (!incidents.length) { log('INF', '[BetterStack] No active incidents.'); return; }

        let lockModified = false;
        for (const incident of incidents) {
            const updatedAt = incident.attributes.acknowledged_at || incident.attributes.started_at;
            if (lock[incident.id] === updatedAt) {
                log('DBG', `[BetterStack] Incident ${incident.id} already processed.`);
                continue;
            }
            await sendDiscordWebhook(incident);
            lock[incident.id] = updatedAt;
            lockModified = true;
        }

        if (lockModified) saveLockFile();
    }

    cleanUpResolvedIncidents();
    setInterval(updateStatusEmbed, 15 * 60 * 1000);
    updateStatusEmbed();
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

if (!ModuleEnabled) {
    log('INF', 'Status Updates module is disabled (settings.modules.status_updates is not true). No env vars required.');
} else if (statusProvider === 'statuspage') {
    initStatuspage();
} else if (statusProvider === 'betterstack') {
    initBetterStack();
} else if (statusProvider.startsWith('custom:')) {
    log('INF', `[Custom] Provider detected (${statusProvider}). Custom status updates are not yet implemented.`);
} else {
    log('ERR', `Unknown status_provider "${statusProvider}". Valid options: statuspage, betterstack, custom:<url>.`);
}