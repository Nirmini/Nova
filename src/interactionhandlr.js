//Core Deps
const { Client, IntentsBitField, ActivityType, Collection, MessageFlags, WebhookClient, EmbedBuilder } = require('discord.js');
const client = require('../core/global/Client');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
const settings = require('../settings.json');
const { getUserData, setUserData, getGuildConfig } = require('./Database');

//Info
const pkg = require('../package.json');

//Op Modules
require('../core/global/statuspage');
require('../core/global/statusmngr');
require('../src/autoresponses');
const {fetchAndPostStats} = require('../core/global/topgg');

//QoL Modules
const NovaStatusMsgs = require('./statusmsgs');
const {ndguilds, premiumguilds, partneredguilds } = require('../servicedata/premiumguilds');
const {blacklistedusers, bannedusers} = require("../servicedata/bannedusers");
const {getData, setData, updateData, removeData } = require('./Database');

//Debugging
const webhookClient= new WebhookClient({ url: process.env.LOG_S_WEBHOOK});

// Create a rate limit map
const rateLimitMap = new Map();
const COMMAND_LIMIT = 4; // Maximum commands per minute
const TIME_WINDOW = 10 * 1000; // 10 seconds in milliseconds

// Client Event Execution Handler
client.on('interactionCreate', async (interaction) => {
    try {
        const userId = interaction.user?.id || interaction.member?.id;
        let userData = await getUserData(userId);
        if (!userData) {
            const userdataPath = path.join(__dirname, '../NovaAppData/userdata.json');
            let userCount = 0;
            try {
                const rawUserdata = fs.readFileSync(userdataPath, 'utf8');
                const allUserData = JSON.parse(rawUserdata);
                userCount = Object.keys(allUserData).length;
            } catch (err) {
                console.warn(`[UserData] Could not read userdata.json: ${err.message}`);
            }
            const newNovaUID = userCount + 1;
            userData = {
                NovaUID: newNovaUID,
                Roblox: {},
                Discord: {},
                Nirmini: {}
            };
            await setUserData(userId, userData);
            if (settings.extendedlogs) console.log(`[UserData] Created new user entry for ${userId} with NovaUID ${newNovaUID}`);
        }

        // Log the interaction type and IDs for debugging
        if (settings.commands.log_executions) {
            if (settings.extendedlogs) console.log(`Interaction Type: ${interaction.type}`);
            if (interaction.isCommand()) {
                if (settings.extendedlogs) console.log(`Command Name: ${interaction.commandName}`);
            } else if (interaction.isModalSubmit()) {
                if (settings.extendedlogs) console.log(`Modal Custom ID: ${interaction.customId}`);
            } else if (interaction.isButton()) {
                if (settings.extendedlogs) console.log(`Button Custom ID: ${interaction.customId}`);
            } else if (interaction.isStringSelectMenu()) {
                if (settings.extendedlogs) console.log(`Select Menu Custom ID: ${interaction.customId}`);
            }
        }

        // Handle Slash Commands
        if (interaction.isCommand()) {
            const commandName = interaction.commandName;
            const guildId = interaction.guildId;
            const guildConfig = await getGuildConfig(guildId);
            const overrideEnabled = settings.commands?.override_enabled === true;
            const overrideSet = settings.commands?.override_set === true;

            let commandCategory = null;
            let commandIsEnabled = false;

            if (overrideEnabled) {
                commandIsEnabled = overrideSet;
                if (settings.extended_logs) console.log(`[Override] Command "${commandName}" enabled state set to ${commandIsEnabled} via override.`);
            } else {
                for (const cat of Object.keys(guildConfig.commands || {})) {
                    const commandsArr = guildConfig.commands[cat]?.commands || [];
                    if (commandsArr.some(cmd => cmd.CommandName === commandName && cmd.CommandEnabled)) {
                        commandCategory = cat;
                        commandIsEnabled = true;
                        break;
                    }
                }
            }

            if (!commandIsEnabled) {
                await interaction.reply({
                    content: `This command is not enabled or not found in any category.`,
                    flags: MessageFlags.Ephemeral
                });
                if (settings.extended_logs) console.log(`[CommandCheck] Command "${commandName}" not enabled for user ${userId}`);
                return;
            }

            if (!settings.slash_commands_enabled) {
                const cmddisabledembed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle("Slash Commands Disabled by Bot Operator!")
                    .setDescription("BOT OPERATOR: Run `$remoteconfig root slashcommandsenabled false` to resume user's access to command execution.")
                interaction.reply({ embeds: [cmddisabledembed] });
                return;
            }

            const command = client.commands.get(commandName);
            if (!command) {
                await interaction.reply({
                    content: 'Command not found!',
                    flags: MessageFlags.Ephemeral,
                });
                console.warn(`Command not found: ${commandName}`);
                return;
            }
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing command ${commandName}:`, error);
                await interaction.reply({
                    content: 'There was an error executing this command!',
                    flags: MessageFlags.Ephemeral,
                });
            }
        }

        // Handle Modal Submissions (Dynamic Handling)
        else if (interaction.isModalSubmit()) {
            // Dynamically find the command based on the modal's customId
            const modalHandlerCommand = client.commands.find(cmd => cmd.modalHandler && interaction.customId.startsWith(cmd.data.name));
            if (modalHandlerCommand?.modalHandler) {
                try {
                    await modalHandlerCommand.modalHandler(interaction);
                } catch (error) {
                    console.error(`Error handling modal interaction for ${modalHandlerCommand.data.name}:`, error);
                    await interaction.reply({
                        content: 'There was an error while processing the modal!',
                        ephemeral: true,
                    });
                }
            } else {
                console.warn(`Unhandled modal interaction: ${interaction.customId}`);
                await interaction.reply({
                    content: 'The requested modal wasn\'t handled. Please try again and file a bug report if it continues.',
                    ephemeral: true,
                });
            }
        }

        // Handle Button Interactions
        else if (interaction.isButton()) {
            const buttonHandlerCommand = client.commands.find(cmd => cmd.buttonHandler && interaction.customId.startsWith(cmd.data.name));
            if (buttonHandlerCommand?.buttonHandler) {
                try {
                    await buttonHandlerCommand.buttonHandler(interaction);
                } catch (error) {
                    console.error(`Error handling button interaction for ${buttonHandlerCommand.data.name}:`, error);
                    await interaction.reply({
                        content: 'There was an error processing this button interaction!',
                        flags: MessageFlags.Ephemeral,
                    });
                }
            } else {
                console.warn(`Unhandled button interaction: ${interaction.customId}`);
                await interaction.reply({
                    content: 'The requested button wasn\'t handled. Please try again and file a bug report if it continues.',
                    ephemeral: true,
                });
            }
        }

        // Handle Context Menu Commands
        else if (interaction.isUserContextMenuCommand()) {
            const ctxtCommand = client.commands.get(interaction.commandName);
            if (!ctxtCommand) {
                await interaction.reply({
                    content: 'Context menu command not found!',
                    flags: MessageFlags.Ephemeral,
                });
                console.warn(`Context menu command not found: ${interaction.commandName}`);
                return;
            }

            try {
                await ctxtCommand.execute(interaction);
            } catch (error) {
                console.error(`Error executing context menu command ${interaction.commandName}:`, error);
                await interaction.reply({
                    content: 'There was an error executing this context menu command!',
                    flags: MessageFlags.Ephemeral,
                });
            }
        }

        // Handle Dropdown Menu (Select Menu) Interactions
        else if (interaction.isStringSelectMenu()) {
            const selectMenuCommand = client.commands.find(cmd => cmd.selectMenuHandler && interaction.customId.startsWith(cmd.data.name));
            if (selectMenuCommand?.selectMenuHandler) {
                try {
                    await selectMenuCommand.selectMenuHandler(interaction);
                } catch (error) {
                    console.error(`Error handling select menu interaction for ${selectMenuCommand.data.name}:`, error);
                    await interaction.reply({
                        content: 'There was an error processing this select menu!',
                        flags: MessageFlags.Ephemeral,
                    });
                }
            } else {
                console.warn(`Unhandled select menu interaction: ${interaction.customId}`);
                await interaction.reply({
                    content: 'The requested dropdown wasn\'t handled. Please try again and file a bug report if it continues.',
                    ephemeral: true,
                });
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        if (interaction.isRepliable()) {
            await interaction.reply({
                content: 'An unexpected error occurred!',
                flags: MessageFlags.Ephemeral,
            });
        }
    }
});