//Core Deps
const { Client, IntentsBitField, ActivityType, Collection, MessageFlags, WebhookClient } = require('discord.js');
const client = require('../core/global/Client');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

//Op Modules
require('../core/global/statuspage');
require('../core/global/statusmngr');
require('../src/autoresponses');
require('../src/modules');

//QoL Modules
const NovaStatusMsgs = require('./statusmsgs');
const { ndguilds, premiumguilds, partneredguilds } = require('../servicedata/premiumguilds');
const {blacklistedusers, bannedusers} = require("../servicedata/bannedusers");
const {getData, setData, updateData, removeData } = require('./firebaseAdmin');

//Debugging
const webhookURL = 'YOUR_START_LOGS_WEBHOOK'
const webhookClient= new WebhookClient({ url: webhookURL});


async function waitForShardsReady() {
    console.log("Waiting for all shards to be ready...");

    let allShardsReady = false;
    let attempt = 0;
    const maxAttempts = 50; // Increased attempts to handle slower initialization
    const delay = 5000; // 5 seconds between checks

    while (!allShardsReady && attempt < maxAttempts) {
        try {
            const results = await client.shard.broadcastEval(c => Boolean(c.readyAt));
            console.log(`Shard ready check: ${results}`);

            allShardsReady = results.length === client.shard.count && results.every(ready => ready);

            if (!allShardsReady) {
                console.log(`Attempt ${attempt + 1}: Waiting for all shards to be ready...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
            }
        } catch (error) {
            console.error("Error with shard readiness state: ", error);
        }
    }

    if (!allShardsReady) {
        console.error("Shards failed to become ready within the set time.");
        process.exit(1);
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

    // Set initial status
    const setRandomStatus = () => {
        const randomStatus = NovaStatusMsgs[Math.floor(Math.random() * NovaStatusMsgs.length)];
        if (randomStatus) {
            const message = typeof randomStatus.msg === 'function' ? randomStatus.msg() : randomStatus.msg; // Handle dynamic messages
            if (message && message.trim() !== "") {
                client.user.setPresence({
                    activities: [{
                        name: message,
                        type: randomStatus.type === 1 ? ActivityType.Listening :
                              randomStatus.type === 2 ? ActivityType.Watching :
                              randomStatus.type === 3 ? ActivityType.Playing :
                              ActivityType.Streaming,
                        url: randomStatus.type === 4 ? 'https://www.twitch.tv/notwest7014' : undefined
                    }],
                    status: 'online'
                });
            } else {
                console.error('Invalid or empty status message:', randomStatus);
            }
        }
    };

    setTimeout(() => {
        setRandomStatus(); // Set initial status after 15 seconds
        setInterval(setRandomStatus, 5 * 60 * 1000); // Change status every 5 minutes
    }, 15 * 1000);
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
            name: `Starting..`,
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
        const existingConfig = await getData(`guildsettings/${guild.id}/config`);

        if (!existingConfig) {
            console.log(`No config found for ${guild.name}. Creating a new one...`);

            // Get the current highest NirminiID from Firebase
            const allGuilds = await getData(`/guildsettings/`);
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
                "disabledcommands": [], // Initialize as an empty array
                "rbxgroup": "<GID>",
                "substat": "L0/L1/L2"
            };

            // Store the config in Firebase
            await setData(`guildsettings/${guild.id}/config`, newGuildConfig);
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
        // Log the interaction type and IDs for debugging
        console.log(`Interaction Type: ${interaction.type}`);
        if (interaction.isCommand()) {
            console.log(`Command Name: ${interaction.commandName}`);
        } else if (interaction.isModalSubmit()) {
            console.log(`Modal Custom ID: ${interaction.customId}`);
        } else if (interaction.isButton()) {
            console.log(`Button Custom ID: ${interaction.customId}`);
        } else if (interaction.isStringSelectMenu()) {
            console.log(`Select Menu Custom ID: ${interaction.customId}`);
        }

        // Handle Slash Commands
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                await interaction.reply({
                    content: 'Command not found!',
                    flags: MessageFlags.Ephemeral,
                });
                console.warn(`Command not found: ${interaction.commandName}`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing command ${interaction.commandName}:`, error);
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

███╗   ██╗ ██████╗ ██╗   ██╗ █████╗     ██████╗  ██████╗ ████████╗    ██╗   ██╗██████╗ ██████╗   ███╗██████╗ ███████╗██╗   ██╗███╗
████╗  ██║██╔═══██╗██║   ██║██╔══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝    ██║   ██║╚════██╗╚════██╗  ██╔╝██╔══██╗██╔════╝██║   ██║╚██║
██╔██╗ ██║██║   ██║██║   ██║███████║    ██████╔╝██║   ██║   ██║       ██║   ██║ █████╔╝ █████╔╝  ██║ ██║  ██║█████╗  ██║   ██║ ██║
██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║    ██╔══██╗██║   ██║   ██║       ╚██╗ ██╔╝██╔═══╝  ╚═══██╗  ██║ ██║  ██║██╔══╝  ╚██╗ ██╔╝ ██║
██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║    ██████╔╝╚██████╔╝   ██║        ╚████╔╝ ███████╗██████╔╝  ███╗██████╔╝███████╗ ╚████╔╝ ███║
╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝    ╚═════╝  ╚═════╝    ╚═╝         ╚═══╝  ╚══════╝╚═════╝   ╚══╝╚═════╝ ╚══════╝  ╚═══╝  ╚══╝
                                                                                                
                                                                                                
                                                                                                
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
