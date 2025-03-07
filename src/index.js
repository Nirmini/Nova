const { Client, IntentsBitField, ActivityType, Collection, MessageFlags, WebhookClient } = require('discord.js');
const client = require('../core/global/Client');
require('../core/global/statuspage');
require('../core/global/statusmngr');
require('../src/autoresponses');
require('../src/modules');
const { qhguilds, premiumguilds, partneredguilds } = require('../servicedata/premiumguilds');
const {blacklistedusers, bannedusers} = require("../servicedata/bannedusers");
const {getData, setData, updateData, removeData } = require('./firebaseAdmin');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { env } = require('process');
require('dotenv').config();
const webhookURL = '<Your Log Webhook URL>';
const webhookClient= new WebhookClient({ url: webhookURL});

// Function to wait until all shards are ready
async function waitForShardsReady() {
    console.log("Waiting for all shards to be ready...");

    let allShardsReady = false;
    let attempt = 0;
    const maxAttempts = 30; // Avoid infinite loops

    while (!allShardsReady && attempt < maxAttempts) {
        try {
            const results = await client.shard.broadcastEval(c => Boolean(c.readyAt));
            console.log(`Shard readiness check: ${results}`);

            allShardsReady = results.length === client.shard.count && results.every(ready => ready);

            if (!allShardsReady) {
                console.log(`Attempt ${attempt + 1}: Waiting for all shards to be ready...`);
                await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retrying
                attempt++;
            }
        } catch (error) {
            console.error("Error while checking shard readiness:", error);
        }
    }

    if (!allShardsReady) {
        console.error("Some shards failed to become ready within the allowed time.");
        process.exit(1); // Stop the bot if shards fail
    }

    console.log("✅ All shards are ready!");
}

// Initialize birthday module
const birthdayModule = require('../core/modules/birthday');
birthdayModule.initializeCron(client);

// Main bot ready event
client.once('ready', async () => {
    console.log(`Shard ${client.shard.ids[0]} is ready!`);
    
    if (process.send) {
        process.send({ type: 'shardReady', shardId: client.shard.ids[0] }); // Notify manager
    }
});

// Shard events
client.on('shardDisconnect', () => {
    if (process.send) {
        process.send({ type: 'shardDisconnect', shardId: client.shard.ids[0] });
    }
});

client.on('shardReconnecting', () => {
    if (process.send) {
        process.send({ type: 'shardReconnecting', shardId: client.shard.ids[0] });
    }
});

// Start bot only after all shards are ready
waitForShardsReady().then(() => {
    console.log("Starting main bot process...");
    
    client.user.setPresence({
        activities: [{
            name: `/info on ${client.shard.ids[0]}`,
            type: ActivityType.Streaming,
            url: 'https://www.twitch.tv/notwest7014'
        }],
        status: 'online'
    });

    // Start main bot logic
    require('../src/index');
});

// Define the commands path
const commandsPath = path.join(__dirname, '..', 'commands'); 
const ctxtmenuPath = path.join(__dirname, '..', 'ctxtmenu'); 
console.log('Commands directory path:', commandsPath);

// Recursive function to get all .js files from a directory and its subdirectories
function getCommandFiles(dir) {
    let files = [];
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            files = files.concat(getCommandFiles(filePath)); // Recurse into subdirectories
        } else if (file.endsWith('.js')) {
            files.push(filePath); // Collect .js files
        }
    });
    return files;
}

try {
    const commandFiles = getCommandFiles(commandsPath);

    // Log the files found for verification
    console.log('Command files found:', commandFiles);

    for (const file of commandFiles) {
        const command = require(file);
        if (command?.data?.name) {
            client.commands.set(command.data.name, command);
        } else {
            console.warn(`Invalid command file: ${file}`);
        }
    }
} catch (err) {
    console.error('Error reading commands directory:', err);
}

try {
    // Get all command files from the ctxtmenu directory
    const ctxtmenuFiles = fs.readdirSync(ctxtmenuPath).filter(file => file.endsWith('.js'));

    // Log the files found for verification
    console.log('Context Menu Command files found:', ctxtmenuFiles);

    for (const file of ctxtmenuFiles) {
        const filePath = path.join(ctxtmenuPath, file);
        const ctxtcommand = require(filePath);

        if (ctxtcommand?.data?.name) {
            client.commands.set(ctxtcommand.data.name, ctxtcommand);
            console.log(`Loaded context menu command: ${ctxtcommand.data.name}`);
        } else {
            console.warn(`Invalid command file: ${file}`);
        }
    }
} catch (err) {
    console.error('Error reading context menu commands directory:', err);
}

client.on('guildCreate', async (guild) => {
    console.log(`Joined new guild: ${guild.name} (${guild.id})`);

    try {
        // Check if the guild already has a config in Firebase
        const existingConfig = await getData(`/${guild.id}/config`);

        if (!existingConfig) {
            console.log(`No config found for ${guild.name}. Creating a new one...`);

            // Get the current highest NirminiID from Firebase
            const allGuilds = await getData(`/`);
            let highestID = 0;

            if (allGuilds) {
                Object.values(allGuilds).forEach(g => {
                    if (g.config && g.config.NirminiID) {
                        const id = parseInt(Buffer.from(g.config.NirminiID, 'base64').toString());
                        if (!isNaN(id) && id > highestID) {
                            highestID = id;
                        }
                    }
                });
            }

            // Increment NirminiID
            const newNirminiID = highestID + 1;
            const encodedID = Buffer.from(newNirminiID.toString()).toString('base64');

            // Default GuildConfig structure
            const newGuildConfig = {
                "GroupName": guild.name, // Default to Guild Name
                "NirminiID": encodedID,
                "RBXBinds": {
                    "1-1": "<RoleIdHere>",
                    "2-2": "<RoleIdHere>"
                },
                "colours": {
                    "custom": false
                },
                "commandconfigs": {
                    "verifiedrole": "<VerifiedRoleId>"
                },
                "disabledcommands": [
                    "00000",
                    "00001"
                ],
                "rbxgroup": "<GID>",
                "substat": "L0/L1/L2"
            };

            // Store the config in Firebase
            await setData(`/${guild.id}/config`, newGuildConfig);
            console.log(`New guild config created for ${guild.name} (${guild.id}) with NirminiID ${newNirminiID}.`);
        } else {
            console.log(`Config already exists for ${guild.name}, skipping creation.`);
        }
    } catch (error) {
        console.error(`Error creating guild config for ${guild.name} (${guild.id}):`, error);
    }
});

// Create a rate limit map
const rateLimitMap = new Map();
const COMMAND_LIMIT = 4; // Maximum commands per minute
const TIME_WINDOW = 10 * 1000; // 10 seconds in milliseconds

// Client Event Execution Handler
client.on('interactionCreate', async (interaction) => {
    try {
        /// Command Executor
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                await interaction.reply({
                    content: 'Command not found!',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            // Check if the user is blacklisted or banned
            const { blacklistedusers, bannedusers } = require('../servicedata/bannedusers');
            const userID = interaction.user.id;

            if (blacklistedusers.includes(userID)) {
                await interaction.reply({
                    content: 'You are blacklisted and cannot use Nova.',
                    flags: MessageFlags.Ephemeral,
                });
                console.log(`Blacklisted user ${interaction.user.username}@${userID} attempted to run a command.`);
                return;
            }

            if (bannedusers.includes(userID)) {
                await interaction.reply({
                    content: 'You are banned from using Nova.',
                    flags: MessageFlags.Ephemeral,
                });
                console.log(`Banned user ${interaction.user.username}@${userID} attempted to run a command.`);
                return;
            }

            // Rate-limit handling
            const now = Date.now();
            if (!rateLimitMap.has(userID)) {
                rateLimitMap.set(userID, []);
            }

            const timestamps = rateLimitMap.get(userID);

            // Remove timestamps older than the time window
            while (timestamps.length > 0 && timestamps[0] < now - TIME_WINDOW) {
                timestamps.shift();
            }

            if (timestamps.length >= COMMAND_LIMIT) {
                await interaction.reply({
                    content: `Slow down <@${interaction.user.id}>! You're sending commands too quickly.`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            // Record this command's timestamp
            timestamps.push(now);

            // Premium command check
            const isPremiumCommand = command.filePath?.includes('/premium/') ?? false;
            if (isPremiumCommand) {
                const guildID = interaction.guild?.id;
                if (!guildID || (!qhguilds.includes(guildID) && !premiumguilds.includes(guildID) && !partneredguilds.includes(guildID))) {
                    await interaction.reply({
                        content: 'Failed to execute this command. This command is limited to Nirmini Partnered Guilds only.',
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }
            }

            // Log the command usage
            const username = interaction.user.username;
            const commandName = interaction.commandName;
            const args = interaction.options.data
                .map((option) => `${option.name}: ${option.value}`)
                .join(', ');
            console.log(`${username}@${userID} Ran /${commandName}${args ? ` ${args}` : ''}`);

            try {
                await command.execute(interaction); // Execute the command
            } catch (error) {
                console.error(`Error executing command ${interaction.commandName}:`, error);
                await interaction.reply({
                    content: 'There was an error executing this command!',
                    flags: MessageFlags.Ephemeral,
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
                return;
            }

            try {
                await ctxtCommand.execute(interaction); // Execute the context menu command
                console.log(`${interaction.user.username}@${interaction.user.id} executed context menu command: ${interaction.commandName}`);
            } catch (error) {
                console.error(`Error executing context menu command ${interaction.commandName}:`, error);
                await interaction.reply({
                    content: 'There was an error executing this context menu command!',
                    flags: MessageFlags.Ephemeral,
                });
            }
        }

        // Handle modal submissions
        else if (interaction.isModalSubmit()) {
            const modalHandlerCommand = client.commands.get(interaction.customId);
            if (modalHandlerCommand?.modalHandler) {
                try {
                    await modalHandlerCommand.modalHandler(interaction);
                } catch (error) {
                    console.error('Error handling modal interaction:', error);
                    await interaction.reply({
                        content: 'There was an error processing this modal!',
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
        }

        // Handle button interactions
        else if (interaction.isButton()) {
            const buttonHandlerCommand = client.commands.get(interaction.customId);
            if (buttonHandlerCommand?.buttonHandler) {
                try {
                    await buttonHandlerCommand.buttonHandler(interaction);
                } catch (error) {
                    console.error('Error handling button interaction:', error);
                    await interaction.reply({
                        content: 'There was an error processing this button interaction!',
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
        }

        // Handle dropdown menu (Select Menu) interactions
        else if (interaction.isStringSelectMenu()) {
            const selectMenuCommand = client.commands.get(interaction.customId);
            if (selectMenuCommand?.selectMenuHandler) {
                try {
                    await selectMenuCommand.selectMenuHandler(interaction);
                } catch (error) {
                    console.error('Error handling select menu interaction:', error);
                    await interaction.reply({
                        content: 'There was an error processing this select menu!',
                        flags: MessageFlags.Ephemeral,
                    });
                }
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
client.login(process.env.DISCORD_TOKEN);
console.log(`
███████████████████████████████████████████████████████████████████████████████████████████████╗
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

███╗   ██╗ ██████╗ ██╗   ██╗ █████╗     ██████╗  ██████╗ ████████╗    ██╗   ██╗██████╗ ██████╗   ███╗ ██████╗ ███████╗███╗
████╗  ██║██╔═══██╗██║   ██║██╔══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝    ██║   ██║╚════██╗╚════██╗  ██╔╝██╔═══██╗██╔════╝╚██║
██╔██╗ ██║██║   ██║██║   ██║███████║    ██████╔╝██║   ██║   ██║       ██║   ██║ █████╔╝ █████╔╝  ██║ ██║   ██║███████╗ ██║
██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║    ██╔══██╗██║   ██║   ██║       ╚██╗ ██╔╝██╔═══╝  ╚═══██╗  ██║ ██║   ██║╚════██║ ██║
██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║    ██████╔╝╚██████╔╝   ██║        ╚████╔╝ ███████╗██████╔╝  ███╗╚██████╔╝███████║███║
╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝    ╚═════╝  ╚═════╝    ╚═╝         ╚═══╝  ╚══════╝╚═════╝   ╚══╝ ╚═════╝ ╚══════╝╚══╝
                                                                                                
                                                                                                
                                                                                                
█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗
╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝
███████████████████████████████████████████████████████████████████████████████████████████████╗
╚══════════════════════════════════════════════════════════════════════════════════════════════╝
█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗
╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝
                                                                                                
██╗    ██╗██████╗ ██╗████████╗████████╗███████╗███╗   ██╗    ██╗███╗   ██╗         ██╗███████╗  
██║    ██║██╔══██╗██║╚══██╔══╝╚══██╔══╝██╔════╝████╗  ██║    ██║████╗  ██║         ██║██╔════╝  
██║ █╗ ██║██████╔╝██║   ██║      ██║   █████╗  ██╔██╗ ██║    ██║██╔██╗ ██║         ██║███████╗  
██║███╗██║██╔══██╗██║   ██║      ██║   ██╔══╝  ██║╚██╗██║    ██║██║╚██╗██║    ██   ██║╚════██║  
╚███╔███╔╝██║  ██║██║   ██║      ██║   ███████╗██║ ╚████║    ██║██║ ╚████║    ╚█████╔╝███████║  
 ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═══╝    ╚═╝╚═╝  ╚═══╝     ╚════╝ ╚══════╝  
                                                                                                
██████╗ ██╗   ██╗    ██╗    ██╗███████╗███████╗████████╗███████╗ ██████╗  ██╗██╗  ██╗           
██╔══██╗╚██╗ ██╔╝    ██║    ██║██╔════╝██╔════╝╚══██╔══╝╚════██║██╔═████╗███║██║  ██║           
██████╔╝ ╚████╔╝     ██║ █╗ ██║█████╗  ███████╗   ██║       ██╔╝██║██╔██║╚██║███████║           
██╔══██╗  ╚██╔╝      ██║███╗██║██╔══╝  ╚════██║   ██║      ██╔╝ ████╔╝██║ ██║╚════██║           
██████╔╝   ██║       ╚███╔███╔╝███████╗███████║   ██║      ██║  ╚██████╔╝ ██║     ██║           
╚═════╝    ╚═╝        ╚══╝╚══╝ ╚══════╝╚══════╝   ╚═╝      ╚═╝   ╚═════╝  ╚═╝     ╚═╝           

 ██╗ ██████╗██╗     ██╗    ██╗███████╗███████╗████████╗███████╗ ██████╗  ██╗██╗  ██╗     ██████╗  ██████╗ ██████╗ ███████╗ 
██╔╝██╔════╝╚██╗    ██║    ██║██╔════╝██╔════╝╚══██╔══╝╚════██║██╔═████╗███║██║  ██║     ╚════██╗██╔═████╗╚════██╗██╔════╝ 
██║ ██║      ██║    ██║ █╗ ██║█████╗  ███████╗   ██║       ██╔╝██║██╔██║╚██║███████║      █████╔╝██║██╔██║ █████╔╝███████╗ 
██║ ██║      ██║    ██║███╗██║██╔══╝  ╚════██║   ██║      ██╔╝ ████╔╝██║ ██║╚════██║     ██╔═══╝ ████╔╝██║██╔═══╝ ╚════██║ 
╚██╗╚██████╗██╔╝    ╚███╔███╔╝███████╗███████║   ██║      ██║  ╚██████╔╝ ██║     ██║     ███████╗╚██████╔╝███████╗███████║ 
 ╚═╝ ╚═════╝╚═╝      ╚══╝╚══╝ ╚══════╝╚══════╝   ╚═╝      ╚═╝   ╚═════╝  ╚═╝     ╚═╝     ╚══════╝ ╚═════╝ ╚══════╝╚══════╝ 

███████████████████████████████████████████████████████████████████████████████████████████████╗
╚══════════════════════════════════════════════════════════════════════════════════════════════╝
`);
webhookClient.send(`Starting Nova!`);
                                                                                          