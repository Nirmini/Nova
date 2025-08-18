// TO BE OVERHAULED!! (Eventually)
const {
    Client,
    IntentsBitField,
    ActivityType,
    Collection,
    MessageFlags,
    EmbedBuilder,
    WebhookClient
} = require('discord.js');

const {getGuildConfig} = require('./Database')

const client = require('../core/global/Client'); 
const path = require('path');
require('dotenv').config();
const fs = require('fs');
const settings = require('../settings.json');
const webhookClient= new WebhookClient({ url: process.env.LOG_S_WEBHOOK});

const guildResponses = {
    '1225142849922928661': {
        dev: 'You may join the QHDT by submitting an application here: <#1282118886850039859>',
        director: 'You may apply for a Directorate application when one is available. Please note all Directorates are hand-picked.',
        manager: 'You may apply for Manager(R2) or Corporate(R3) via an application here: <#1226316800388628551>',
        qcg: 'HSRF is a Reactor Core Game currently in development by Nirmini.',
        hrf: 'HSRF is a Reactor Core Game currently in development by Nirmini.',
        hsrf: 'HSRF is a Reactor Core Game currently in development by Nirmini.',
    }
};

const adminUID = settings.operator.userId;
const rateLimitMap = new Map();
const COMMAND_LIMIT = 10;
const TIME_WINDOW = 60 * 1000;

client.on('messageCreate', async (message) => {
    const origin = message.guild ? `guild ${message.guild.name}` : 'DM';

    if (message.author.bot) {
        if (!message.guild) {
            console.warn(`[DM Handler] Ignored DM from bot user: ${message.author.tag}`);
        }
        return;
    }

    if (!message.guild) {
    const shardId = client.shard?.ids?.[0] ?? 0;
    if (shardId !== 0) {
        console.log(`[Shard ${shardId}] Skipping DM handler — only shard 0 processes DMs.`);
        return;
    }

        console.log('[DM Handler] Processing DM from:', message.author.tag);

        const avatarURL = message.author.displayAvatarURL({ size: 64 });
        const botAvatar = client.user?.displayAvatarURL();

        const embed = new EmbedBuilder()
            .setAuthor({
                name: `${message.author.tag} (DM)`,
                iconURL: avatarURL
            })
            .setDescription(message.content || '[No message content]')
            .setTimestamp()
            .setColor(0x7289da);

        if (message.attachments.size > 0) {
            const attachmentLinks = message.attachments.map(a => a.url).join('\n');
            console.log('[DM Handler] Attachments:', attachmentLinks);
            embed.addFields({ name: 'Attachments', value: attachmentLinks });
        } else {
            console.log('[DM Handler] No attachments found.');
        }

        if (!webhookClient) {
            console.warn('[DM Handler] WebhookClient is undefined. Cannot forward DM.');
        }

        try {
            await webhookClient.send({
                username: 'Nova - DM Logger',
                avatarURL: botAvatar,
                embeds: [embed]
            });

            console.log('[DM Handler] Successfully forwarded DM via webhook.');
        } catch (err) {
            console.error('[DM Forwarding] Webhook send failed:', err);
        }

        return;
    }

    if (message.content.startsWith('$') || message.content.startsWith('?')) {
        const isAdminCommand = message.content.startsWith('$');
        const commandPrefix = isAdminCommand ? '$' : '?';
        const commandDirectory = isAdminCommand ? '../altdevcommands' : '../altcommands';

        if (isAdminCommand && message.author.id !== adminUID) {
            await message.reply({
                content: "Unable to run Developer Shorthand commands. `[403:Unauthorized]`",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (!isAdminCommand) {
            const userID = message.author.id;
            const now = Date.now();

            if (!rateLimitMap.has(userID)) rateLimitMap.set(userID, []);
            const timestamps = rateLimitMap.get(userID);
            while (timestamps.length && timestamps[0] < now - TIME_WINDOW) timestamps.shift();

            if (timestamps.length >= COMMAND_LIMIT) {
                await message.reply('You are sending commands too quickly. Please wait before trying again.');
                return;
            }

            timestamps.push(now);
        }

        const args = message.content.slice(commandPrefix.length).trim().split(/\s+/);
        const commandName = args.shift()?.toLowerCase();

        if (!/^[a-zA-Z0-9]+$/.test(commandName)) return;

        const commandPath = path.join(__dirname, `${commandDirectory}/${commandName}.js`);

        try {
            if (fs.existsSync(commandPath)) {
                const command = require(commandPath);
                await command.execute(message, args);
            }
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            await message.reply({
                content: `An error occurred while executing \`${commandName}\`.`,
                flags: MessageFlags.Ephemeral
            });
        }

        return;
    }

    const guildResponsesForMessage = guildResponses[message.guild.id];
    if (!guildResponsesForMessage) return;

    const guildId = message.guild.id
    const guildTriggers = await getGuildConfig(guildId, 'autoreplies'); //Returns the JSON Table (Hopefully)

    if (Array.isArray(guildTriggers) && guildTriggers.length > 0) {
        for (const entry of guildTriggers) {
            // entry: { trigger: "<trigger>", type: "percise/wild", reply: "<reply text>" }
            if (!entry.trigger || !entry.type) continue;
            const trigger = entry.trigger.toLowerCase();
            const msgContent = message.content.toLowerCase();

            if (
                (entry.type === 'percise' && msgContent === trigger) ||
                (entry.type === 'wild' && msgContent.includes(trigger))
            ) {
                const replyText = entry.reply || (guildResponsesForMessage && guildResponsesForMessage[trigger]);
                if (replyText) {
                    await message.reply(`${replyText}, ${message.author}!`);
                    return;
                }
            }
        }
    }
});
