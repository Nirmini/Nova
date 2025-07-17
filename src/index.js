//Core Deps
const { Client, IntentsBitField, ActivityType, Collection, MessageFlags, WebhookClient, EmbedBuilder } = require('discord.js');
const client = require('../core/global/Client');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
const settings = require('../settings.json');
const express = require('express');
const statusApp = express();

//Info
const pkg = require('../package.json');
const workspkg = require('../Novaworks/novaworks.json');

//Op Modules
require('../core/global/statuspage');
require('../core/global/statusmngr');
require('./autoresponses');
require('./modules');
require('./interactionhandlr');
require('./services/index');
const {fetchAndPostStats} = require('../core/global/topgg');

//API Modules
require('../NovaAPI/common/APIApp');

//QoL Modules
const NovaStatusMsgs = require('./statusmsgs');
const {ndguilds, premiumguilds, partneredguilds } = require('../servicedata/premiumguilds');
const {blacklistedusers, bannedusers} = require("../servicedata/bannedusers");
const {getData, setData, updateData, removeData } = require('./firebaseAdmin');

//Debugging
const webhookURL = 'YOUR_LOGS_WEBHOOK_URL_HERE'
const webhookClient= new WebhookClient({ url: webhookURL});
require('../DevDash/manager');

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

const dns = require('dns');

function getInitialPing() {
    return new Promise((resolve) => {
        const start = Date.now();
        dns.lookup('google.com', (err) => {
            if (err) {
                resolve(999); // Return a high ping if DNS lookup fails
            } else {
                resolve(Date.now() - start);
            }
        });
    });
}

const SHARD_PORT_MIN = settings.ports.Shard.min;
const SHARD_PORT_MAX = settings.ports.Shard.max;
const shardId = client.shard?.ids?.[0] ?? 0;
const STATUS_PORT = SHARD_PORT_MIN + shardId;

if (STATUS_PORT > SHARD_PORT_MAX) {
    throw new Error(`Shard port ${STATUS_PORT} exceeds configured maximum (${SHARD_PORT_MAX})`);
}

// Main bot ready event
client.once('ready', async () => {
    console.log(`Shard ${client.shard.ids[0]} is ready!`);

    statusApp.get('/status', (req, res) => {
        res.json({
            shard: client.shard?.ids?.[0] ?? 0,
            ready: !!client.readyAt,
            guilds: client.guilds.cache.size,
            ping: client.ws.ping
        });
    });

    statusApp.listen(STATUS_PORT, () => {
        console.log(`[Shard ${client.shard?.ids?.[0] ?? 0}] Status API running on port ${STATUS_PORT}`);
    });

    fetchAndPostStats(client)
        .then(success => {
            if (success) {
                console.log('[Top.gg] Stats posted successfully!');
            } else {
                console.warn('[Top.gg] Failed to post stats.');
            }
        });

    const initialPing = await getInitialPing();

    if (process.send) {
        process.send({ type: 'shardReady', shardId: client.shard.ids[0] }); // Notify manager
    }

    setInterval(() => {
        process.send({
            type: 'statsUpdate',
            shardId: client.shard.ids[0],
            ping: client.ws.ping || initialPing, // Use WebSocket ping or initial ping
            guilds: client.guilds.cache.size, // Include guild count
        });
    }, 450000); // 7.5 min

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

});

client.on('messageCreate', async (message) => {
    // Ignore bot messages or messages not in DMs
    if (message.author.bot || message.guild) return;

    try {
        const isLong = message.content.length > 256;
        const embed = new EmbedBuilder()
            .setAuthor({
                name: `${message.author.tag} (${message.author.id})`,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
            })
            .setTitle(isLong ? 'Direct Message' : message.content || '[No content]')
            .setDescription(isLong ? message.content.slice(0, 4096) : '\u200B') // Embed description limit is 4096
            .setTimestamp()
            .setColor(0x5865F2); // Discord blurple

        await webhookClient.send({ embeds: [embed] });
        console.log(`[DM Logger] Logged DM from ${message.author.tag}`);
    } catch (err) {
        console.error(`[DM Logger] Failed to log DM:`, err);
    }
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
    if (settings.extendedlogs) {
    console.log(`Joined new guild: ${guild.name} (${guild.id})`);
    webhookClient.send(`Joined new guild: ${guild.name} (${guild.id})`);
    };

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
            if (settings.extendedlogs) console.log(`New guild config created for ${guild.name} (${guild.id}) with NirminiID ${newNirminiID}.`);
        } else {
            console.log(`Config already exists for ${guild.name}, skipping creation.`);
        }
    } catch (error) {
        console.error(`Error creating guild config for ${guild.name} (${guild.id}):`, error);
    }
});

client.login(process.env.DISCORD_TOKEN);

console.log(`
███████████████████████████████████████████████████████████████████████████████████████████████╗
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

███╗   ██╗ ██████╗ ██╗   ██╗ █████╗     ██████╗  ██████╗ ████████╗    ██╗   ██╗██████╗ ██╗  ██╗██████╗ 
████╗  ██║██╔═══██╗██║   ██║██╔══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝    ██║   ██║╚════██╗██║  ██║██╔══██╗
██╔██╗ ██║██║   ██║██║   ██║███████║    ██████╔╝██║   ██║   ██║       ██║   ██║ █████╔╝███████║██║  ██║
██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║    ██╔══██╗██║   ██║   ██║       ╚██╗ ██╔╝██╔═══╝ ╚════██║██║  ██║
██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║    ██████╔╝╚██████╔╝   ██║        ╚████╔╝ ███████╗     ██║██████╔╝
╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝    ╚═════╝  ╚═════╝    ╚═╝         ╚═══╝  ╚══════╝     ╚═╝╚═════╝ 
                                                                                                
                                                                                                
                                                                                                
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
webhookClient.send(`
**NovaBot Version:** ${pkg.version}
**Novaworks Version:** ${workspkg.version}
**Node.js Version:** ${process.version}
\`\`\`
\u200B
\`\`\`

\`\`\`
███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██████╗  ██████╗ ████████╗  ███╗██████╗ ███████╗██╗   ██╗███╗
████╗  ██║██╔═══██╗██║   ██║██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝  ██╔╝██╔══██╗██╔════╝██║   ██║╚██║
██╔██╗ ██║██║   ██║██║   ██║███████║██████╔╝██║   ██║   ██║     ██║ ██║  ██║█████╗  ██║   ██║ ██║
██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔══██╗██║   ██║   ██║     ██║ ██║  ██║██╔══╝  ╚██╗ ██╔╝ ██║
██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██████╔╝╚██████╔╝   ██║     ███╗██████╔╝███████╗ ╚████╔╝ ███║
╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═════╝  ╚═════╝    ╚═╝     ╚══╝╚═════╝ ╚══════╝  ╚═══╝  ╚══╝
                                                                                          
                                                                                          
█████████████████████████████████████████████████████████████████████████████████████████╗
╚════════════════════════════════════════════════════════════════════════════════════════╝
                                                                                          
                                                                                           
 ██╗ ██████╗██╗     ██╗    ██╗███████╗███████╗████████╗███████╗ ██████╗  ██╗██╗  ██╗
██╔╝██╔════╝╚██╗    ██║    ██║██╔════╝██╔════╝╚══██╔══╝╚════██║██╔═████╗███║██║  ██║
██║ ██║      ██║    ██║ █╗ ██║█████╗  ███████╗   ██║       ██╔╝██║██╔██║╚██║███████║
██║ ██║      ██║    ██║███╗██║██╔══╝  ╚════██║   ██║      ██╔╝ ████╔╝██║ ██║╚════██║
╚██╗╚██████╗██╔╝    ╚███╔███╔╝███████╗███████║   ██║      ██║  ╚██████╔╝ ██║     ██║
 ╚═╝ ╚═════╝╚═╝      ╚══╝╚══╝ ╚══════╝╚══════╝   ╚═╝      ╚═╝   ╚═════╝  ╚═╝     ╚═╝
\`\`\``);
