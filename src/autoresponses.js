// TO BE OVERHAULED!!
/**
 * Guildsettings will allow for 10 automatic responses, 20 for Nova+ guilds.
 */
const {
    Client,
    IntentsBitField,
    ActivityType,
    Collection,
    MessageFlags,
    EmbedBuilder,
    WebhookClient
} = require('discord.js');

const client = require('../core/global/Client'); // Already initialized client
const path = require('path');
require('dotenv').config();
const fs = require('fs');
const settings = require('../settings.json');
const webhookURL = 'YOUR_DEBUG_LOGS_WEBHOOK_URL';
const webhookClient= new WebhookClient({ url: webhookURL});

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
    console.log(`[AutoResponse] Got message from ${message.author.tag} in ${message.guild?.name ?? 'DMs'}: ${message.content}`);
    
    // --- Universal Log ---
    console.log(`[AutoResponse] Got message from ${message.author.tag} in ${message.guild ? `guild ${message.guild.name}` : 'DM'}: ${message.content}`);

    // --- Handle Direct Messages (no guild) ---
    if (!message.guild && !message.author.bot) {
        console.log('[DM Handler] Received a DM from:', message.author.tag);

        const avatarURL = message.author.displayAvatarURL({ size: 64 });
        console.log('[DM Handler] Avatar URL resolved as:', avatarURL);

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
            console.log('[DM Handler] Attachments detected:', attachmentLinks);
            embed.addFields({ name: 'Attachments', value: attachmentLinks });
        } else {
            console.log('[DM Handler] No attachments present.');
        }

        try {
            if (!webhookClient) {
                console.warn('[DM Handler] WebhookClient is undefined or not configured.');
            }

            const botAvatar = client.user?.displayAvatarURL();
            console.log('[DM Handler] Bot avatar resolved as:', botAvatar);

            await webhookClient.send({
                username: 'Nova - DM Logger',
                avatarURL: botAvatar,
                embeds: [embed]
            });

            console.log('[DM Handler] DM forwarded successfully via webhook.');
        } catch (err) {
            console.error('[DM Forwarding] Failed to send message via webhook:', err);
        }

        return;
    } else if (!message.guild) {
        console.warn('[DM Handler] Ignored DM from bot user:', message.author.tag);
    }

    // --- Ignore bot or system messages ---
    if (message.author.bot) return;

    // --- Command Handling ($ or ?) ---
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

    // --- Guild-specific auto replies ---
    const guildResponsesForMessage = guildResponses[message.guild.id];
    if (!guildResponsesForMessage) return;

    const triggers = {
        secops: ['how secops', 'how qhsd', 'how security'],
        dev: ['how developer', 'how dev', 'how qhdt'],
        director: ['how director', 'how directorate'],
        manager: ['how manager', 'how corporate', 'how corp'],
        qcg: ['what\'s qcg', 'whats qcg'],
        hrf: ['what\'s hrf', 'whats hrf'],
        hsrf: ['what\'s hsrf', 'whats hsrf'],
        multi: ['what\'s multi', 'whats multi'],
        tester: ['how tester', 'how game tester'],
        nerf: ['what\'s nerf', 'whats nerf'],
    };

    for (const [key, phrases] of Object.entries(triggers)) {
        if (phrases.some(phrase => message.content.toLowerCase().includes(phrase))) {
            const replyText = guildResponsesForMessage[key];
            if (replyText) {
                await message.reply(`${replyText}, ${message.author}!`);
                return;
            }
        }
    }
});
