const config = require('../settings.json');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const NAPIToken = process.env.NovaAPI_Key;
const { Client, EmbedBuilder } = require('discord.js');
const client = require('../core/global/Client');
require('../mainapp/sentry');

const headers = {
    'x-api-key': NAPIToken,
    'Content-Type': 'application/json',
};

const appdataPath = path.resolve(__dirname, '../appdata.json');

// Load last message ID from file
function loadLastMsgId() {
    try {
        if (!fs.existsSync(appdataPath)) {
            return null;
        }
        const raw = fs.readFileSync(appdataPath, 'utf-8');
        const data = JSON.parse(raw);
        return data.messages?.lastmid || null;
    } catch (err) {
        console.error("[SysMsgManager] Failed to load appdata.json:", err);
        return null;
    }
}

// Save last message ID to file
function saveLastMsgId(msgId) {
    try {
        const data = { messages: { lastmid: msgId } };
        fs.writeFileSync(appdataPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error("[SysMsgManager] Failed to write appdata.json:", err);
    }
}

let lastSentSysMsgId = loadLastMsgId();

async function fetchLatestSysMsg() {
    try {
        const response = await axios.get(config.sysmsgs.chkurl, { headers });
        if (!response.data || !response.data.system_title || !response.data.system_desc) {
            throw new Error("Invalid system message format from API.");
        }
        return response.data;
    } catch (err) {
        throw new Error("Failed to fetch system message: " + (err.response?.data || err.message));
    }
}

async function sendSysMsgToGuild(guild, sysmsg) {
    const channelId = guild.systemChannelId;
    if (!channelId) {
        console.warn(`[SysMsgManager] Guild ${guild.id} has no systemChannelId set.`);
        return;
    }
    const channel = guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
        console.warn(`[SysMsgManager] System channel not found or not text for guild ${guild.id}.`);
        return;
    }

    let sentMsg;
    if (config.sysmsgs.pformat === "embed") {
        const embed = new EmbedBuilder()
            .setTitle(sysmsg.system_title || "System Message")
            .setDescription(sysmsg.system_desc || "")
            .setColor(0x5865F2);

        if (sysmsg.system_fields && Array.isArray(sysmsg.system_fields)) {
            embed.addFields(...sysmsg.system_fields);
        }
        if (sysmsg.system_eauth) embed.setAuthor({ name: sysmsg.system_eauth });
        if (sysmsg.system_fttr) embed.setFooter({ text: sysmsg.system_fttr });
        if (sysmsg.system_ts) embed.setTimestamp(new Date(sysmsg.system_ptime || Date.now()));

        sentMsg = await channel.send({
            content: "This is a system message. To opt-out please contact [Nirmini Development](https://nirmini.dev/Discord).",
            embeds: [embed],
        });
    } else if (config.sysmsgs.pformat === "text") {
        sentMsg = await channel.send(`${sysmsg.system_title}\n${sysmsg.system_desc}`);
    } else {
        throw new Error("Unsupported system message format: " + config.sysmsgs.pformat);
    }

    const sysMsgId = sysmsg.system_id || sentMsg.id;
    lastSentSysMsgId = sysMsgId;
    saveLastMsgId(sysMsgId);
}

client.once('clientReady', async () => {
    try {
        await client.ready;
        const sysmsg = await fetchLatestSysMsg();

        const sysMsgId = sysmsg.system_id || (sysmsg.system_title + sysmsg.system_desc);

        if (lastSentSysMsgId === sysMsgId) {
            console.log(`[SysMsgManager] System message already sent (ID: ${sysMsgId}), skipping broadcast.`);
            return;
        }

        for (const guild of client.guilds.cache.values()) {
            try {
                await sendSysMsgToGuild(guild, sysmsg);
                console.log(`[SysMsgManager] Sent system message to guild ${guild.id}`);
            } catch (err) {
                console.warn(`[SysMsgManager] Failed to send system message to guild ${guild.id}: ${err.message}`);
            }
        }

        lastSentSysMsgId = sysMsgId;
        saveLastMsgId(sysMsgId);
    } catch (err) {
        console.error(`[SysMsgManager] Error during system message broadcast: ${err.message}`);
    }
});
