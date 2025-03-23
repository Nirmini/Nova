const { Client, IntentsBitField, ActivityType, Collection, MessageFlags, EmbedBuilder } = require('discord.js');
const client = require('../core/global/Client'); // Client is already initialized and logged in elsewhere.
const path = require('path');
require('dotenv').config();
const fs = require('fs');
// Import guild-specific responses
const guildResponses = {
    '1225142849922928661': { // Nirmini
        dev: 'You may join the QHDT by submitting an application here: <#1282118886850039859>',
        director: 'You may apply for a Directorate application when one is available. Please note all Directorates are hand-picked.',
        manager: 'You may apply for Manager(R2) or Corporate(R3) via an application here: <#1226316800388628551>',
        qcg: 'HSRF is a Reactor Core Game currently in development by Nirmini.',
        hrf: 'HSRF is a Reactor Core Game currently in development by Nirmini.',
        hsrf: 'HSRF is a Reactor Core Game currently in development by Nirmini.',
    }
};

const adminUID = "600464355917692952";

// Rate-limiting setup
const rateLimitMap = new Map();
const COMMAND_LIMIT = 10; // Max commands per minute
const TIME_WINDOW = 60 * 1000; // 1 minute in milliseconds

client.on('messageCreate', async (message) => {
    // Ignore messages from bots or without guild context
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith('$') || message.content.startsWith('?')) {
        const isAdminCommand = message.content.startsWith('$');
        const commandPrefix = isAdminCommand ? '$' : '?';
        const commandDirectory = isAdminCommand ? '../admin' : '../altcommands';

        // Check if the user is authorized to run admin commands
        if (isAdminCommand && message.author.id !== adminUID) {
            message.reply({ content: "Unable to run Developer Shorthand commands. `[403:Unauthorized]`", flags: MessageFlags.Ephemeral });
            return;
        }

        // Rate-limiting check for non-admin commands
        if (!isAdminCommand) {
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

            if (timestamps.length >= COMMAND_LIMIT) {
                message.reply('You are sending commands too quickly. Please wait before trying again.');
                return;
            }

            timestamps.push(now); // Record timestamp for the current message
        }

        // Extract command name and arguments
        const args = message.content.slice(commandPrefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();

        // Validate command name (must be alphanumeric and not empty)
        if (!/^[a-zA-Z0-9]+$/.test(commandName)) return;

        const commandPath = path.join(__dirname, `${commandDirectory}/${commandName}.js`);

        try {
            if (fs.existsSync(commandPath)) {
                const command = require(commandPath);
                await command.execute(message, args); // Pass arguments to the command
            } else {
                await message.reply({ content: `Command \`${commandName}\` not found.`, flags: MessageFlags.Ephemeral });
            }
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            await message.reply({ content: `An error occurred while executing \`${commandName}\`.`, flags: MessageFlags.Ephemeral });
        }

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
        multi: ['what\'s multi', 'whats multi'],
        tester: ['how tester', 'how game tester'],
        nerf: ['what\'s nerf', 'whats nerf'],
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
