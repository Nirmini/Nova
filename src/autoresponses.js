const { Client, IntentsBitField, MessageFlags } = require('discord.js');
const client = require('../core/global/Client'); // Client is already initialized and logged in elsewhere.
const path = require('path');
require('dotenv').config();
const fs = require('fs');
// Import guild-specific responses
const guildResponses = {
    '<1225142849922928661>': { // Nirmini autoresponses as a demo.
        dev: 'You may join the QHDT by submitting an application here: <#1282118886850039859>',
        director: 'You may apply for a Directorate application when one is available. Please note all Directorates are hand-picked.',
        manager: 'You may apply for Manager(R2) or Corporate(R3) via an application here: <#1226316800388628551>',
        qcg: 'HSRF is a Reactor Core Game currently in development by Nirmini.',
        hrf: 'HSRF is a Reactor Core Game currently in development by Nirmini.',
        hsrf: 'HSRF is a Reactor Core Game currently in development by Nirmini.',
    },
    '<Your_Guild_ID>': {
        prompt1: 'Response1',
        prompt2: 'Response2', // These can also ping users and link to channels using Discord's Markdown format. <@<UID>>, <#<ChannelID>>, <@&<RoleID>>, etc.
    }
};

// Rate-limiting setup
const rateLimitMap = new Map();
const COMMAND_LIMIT = 10; // Max commands per minute
const TIME_WINDOW = 60 * 1000; // 1 minute in milliseconds

client.on('messageCreate', async (message) => {
    // Ignore messages from bots or without guild context
    if (message.author.bot || !message.guild) return;

    // Rate-limiting check
    const userID = message.author.id;
    const now = Date.now();

    if (!rateLimitMap.has(userID)) {
        rateLimitMap.set(userID, []);
    }

    const timestamps = rateLimitMap.get(userID);

    // Remove outdated timestamps
    while (timestamps.length > 0 && timestamps[0] < now - TIME_WINDOW) {
        timestamps.shift();
    }

    // Handle ?<cmd_name> commands
    if (!message.content.startsWith('?')) return;

    if (timestamps.length >= COMMAND_LIMIT) {
        message.reply('You are sending commands too quickly. Please wait before trying again.');
        return;
    }

    timestamps.push(now); // Record timestamp for the current message

    const args = message.content.slice(1).trim().split(/\s+/); // Split by spaces
    const commandName = args.shift().toLowerCase(); // Extract the command name

    // Validate command name (must be alphanumeric and not empty)
    if (!/^[a-zA-Z0-9]+$/.test(commandName)) return; 

    const commandPath = path.join(__dirname, `../altcommands/${commandName}.js`);

    try {
        if (fs.existsSync(commandPath)) {
            const command = require(commandPath);
            await command.execute(message, args); // Pass arguments to the command
        } else {
            await message.reply({ content:`Command \`${commandName}\` not found.`, flags: MessageFlags.Ephemeral});
        }
    } catch (error) {
        console.error(`Error executing alt command ${commandName}:`,  error);
        await message.reply({ content:`An error occurred while executing \`${commandName}\`.`,flags: MessageFlags.Ephemeral});
    }

    // Handle standard commands like '?ping'
    if (message.content.toLowerCase() === '?n.test') {
        message.reply('Hello! `?n.` is the prefix to use shorthand commands rather than the slash commands.');
        return;
    }

    // Handle guild-specific responses
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
        prompt1: ['testing1', 'testing 1'],
        prompt2: ['testing2', 'testing 2'],
    };

    for (const [key, phrases] of Object.entries(triggers)) {
        if (phrases.some(phrase => message.content.toLowerCase().includes(phrase))) {
            const replyText = guildResponsesForMessage[key];
            if (replyText) {
                message.reply(`${replyText}, ${message.author}!`);
                return;
            }
        }
    }
});
