const { Client, IntentsBitField, ActivityType, Collection, MessageFlags, WebhookClient, EmbedBuilder } = require('discord.js');
const client = require('../../core/global/Client');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
const settings = require('../../settings.json');
const express = require('express');
const router = express.Router();
const devPerms = require('../../devperms.json');

// THIS IS FOR USE WITH DEVDASH TO SEND MESSAGES IN CHANNELS USING TXT, EMBEDS, AND COMPONENTS V2 AND SEND DMs

// Helper: check if bot shares a guild with user
async function hasMutualGuild(userId) {
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) return false;
    for (const guild of client.guilds.cache.values()) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (member) return true;
    }

    return false;
}

router.use((req, res, next) => {
    console.log(`[UMS] Router received: ${req.method} ${req.originalUrl}`);
    next();
});

// POST /api/sendmsg
router.post('/api/sendmsg', async (req, res) => {
    const { type, userId, guildId, channelId, messageType, content, embed, components, devUserId } = req.body;

    console.log("[UMS]: devUserId =", devUserId, typeof devUserId);
    const userPerm = devPerms.usermap.find(u => u.userid === devUserId);
    if (!userPerm || userPerm.level <= 100) {
        console.log("[UMS]: Invalid Permissions");
        return res.status(403).json({ error: 'No permission' });
    }

    try {
        if (type === 'dm') {
            console.log("[UMS]: Requested DM");
            if (!userId) return res.status(400).json({ error: 'Missing userId' });
            if (!(await hasMutualGuild(userId))) return res.status(400).json({ error: 'No mutual guild' });
            const user = await client.users.fetch(userId);
            if (!user) return res.status(404).json({ error: 'User not found' });

            const dmPayload = {};
            if (content) dmPayload.content = content;
            if (embed) dmPayload.embeds = [new EmbedBuilder(embed)];

            if (!dmPayload.content && !dmPayload.embeds) {
                return res.status(400).json({ error: 'No content or embed provided for DM' });
            }

            await user.send(dmPayload);
            console.log("[UMS]: Sent DM");
            return res.json({ status: 'DM sent' });
        } else if (type === 'channel') {
            if (!guildId || !channelId) return res.status(400).json({ error: 'Missing guildId or channelId' });
            const guild = await client.guilds.fetch(guildId).catch(() => null);
            if (!guild) return res.status(404).json({ error: 'Guild not found' });
            const channel = await guild.channels.fetch(channelId).catch(() => null);
            if (!channel || !channel.isTextBased()) return res.status(404).json({ error: 'Channel not found or not text' });

            if (messageType === 'text') {
                if (!content) return res.status(400).json({ error: 'Content required for text message' });
                await channel.send({ content });
            } else if (messageType === 'embed') {
                const embedPayload = { embeds: [new EmbedBuilder(embed || {})] };
                if (content) embedPayload.content = content;
                await channel.send(embedPayload);
            } else if (messageType === 'componentsv2') {
                const compPayload = { ...components, flags: MessageFlags.IsComponentsV2 };
                if (content) compPayload.content = content;
                await channel.send(compPayload);
            } else {
                return res.status(400).json({ error: 'Invalid messageType' });
            }
            return res.json({ status: 'Message sent' });
        } else {
            return res.status(400).json({ error: 'Invalid type' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
