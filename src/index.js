//Core Deps
const { Client, IntentsBitField, ActivityType, Collection, MessageFlags, WebhookClient, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const client = require('../core/global/Client');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
const settings = require('../settings.json');
const express = require('express');
const statusApp = express();
require('../mainapp/sentry');
require('../mainapp/errorhandling');
const { getPort } = require('../mainappmodules/ports');
const { execSync } = require('child_process');

//Info
const pkg = require('../package.json');
const workspkg = require('../Novaworks/novaworks.json');

//AppModules
const { log } = require('../mainappmodules/logs');

//Op Modules
require('./ipcmodule');
require('./sysmsgmanager');
require('../core/global/statuspage');// TODO: Make this respect /settings.json.
require('../core/global/statusmngr');// TODO: Make this respect /settings.json.
require('./autoresponses');
require('./interactionhandlr');
require('./services/index');
const {fetchAndPostStats} = require('../core/global/topgg');

require('../modules/novamodules'); //Init modules in the shard process(es)

const NovaStatusMsgs = require('./statusmsgs');
const { removeGuildConfig, removeGuildData } = require('./Database');
const { initGuild } = require('./CreateNewGD');

// Debugging
const webhookClient= new WebhookClient({ url: process.env.LOG_S_WEBHOOK});
require('../DevDash/manager');

// Counting
// add near the top with other imports
const appDataPath = path.join(__dirname, '../appdata.json');

// Helper function to get git information
function getGitInfo() {
    try {
        const commitHash = execSync('git rev-parse HEAD').toString().trim();
        const commitShort = execSync('git rev-parse --short HEAD').toString().trim();
        const commitName = execSync('git log -1 --pretty=%s').toString().trim();
        const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
        const remoteBranch = execSync('git rev-parse --abbrev-ref --symbolic-full-name @{u}').toString().trim();
        
        return {
            commitName,
            commitShort,
            commitHash,
            branch,
            remoteBranch
        };
    } catch (error) {
        console.error('Error getting git info:', error);
        return {
            commitName: 'Unknown',
            commitShort: 'Unknown',
            commitHash: 'Unknown',
            branch: 'Unknown',
            remoteBranch: 'Unknown'
        };
    }
}

// Helper function to format NPM modules
function formatNPMModules() {
    const dependencies = pkg.dependencies || {};
    const devDependencies = pkg.devDependencies || {};
    
    let moduleList = '';
    const maxLength = 1024; // Discord embed field value limit
    
    // Add regular dependencies
    for (const [name, version] of Object.entries(dependencies)) {
        const line = `- **${name}**: \`${version}\`\n`;
        if ((moduleList + line).length > maxLength - 50) {
            moduleList += '... (truncated)\n';
            break;
        }
        moduleList += line;
    }
    
    // Add dev dependencies
    for (const [name, version] of Object.entries(devDependencies)) {
        const line = `- **${name}**: \`${version}\` **[DEV]**\n`;
        if ((moduleList + line).length > maxLength - 50) {
            moduleList += '... (truncated)\n';
            break;
        }
        moduleList += line;
    }
    
    return moduleList || 'No modules found';
}

async function waitForShardsReady() { // We don't use this anymore? (See /mainapp/shardstarter.js)
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
const birthdayModule = require('../modules/birthday');
birthdayModule.initializeCron(client);

const dns = require('dns');
const userVerification = require('./services/userverification');

function getInitialPing() {
    return new Promise((resolve) => {
        const start = Date.now();
        dns.lookup('google.com', (err) => {
            if (err) {
                resolve(Infinity); // Return a high ping if DNS lookup fails
            } else {
                resolve(Date.now() - start);
            }
        });
    });
}
const shardPortDat = getPort('shard');
const SHARD_PORT_MIN = shardPortDat.min;
const SHARD_PORT_MAX = shardPortDat.max;
const shardId = client.shard?.ids?.[0] ?? 0;
const STATUS_PORT = SHARD_PORT_MIN + shardId;

if (STATUS_PORT > SHARD_PORT_MAX) {
    throw new Error(`Shard port ${STATUS_PORT} exceeds configured maximum (${SHARD_PORT_MAX})`);
}

// Start bot only after all shards are ready
waitForShardsReady().then(() => {    
    client.user.setPresence({
        activities: [{
            name: `Starting..`,
            type: ActivityType.Streaming,
            url: 'https://www.twitch.tv/CosmosRolling'
        }],
        status: 'online'
    });

});

// Main bot ready event
client.once('clientReady', async () => {
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

    // Make the Discord API not ghost people
    const userIDsToCache = ['600464355917692952'];           
    
    for (const userId of userIDsToCache) {
        client.users.fetch(userId).then(async user => {
            const dm = await user.createDM();
            console.log(`[DEBUG] Fetched and cached DM channel with user ${user.tag} (${user.id}): ${dm.id}`);
        }).catch(err => {
            console.error(`[ERROR] Failed to cache DM for ${userId}:`, err);
        });
    }

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
                        url: randomStatus.type === 4 ? 'https://www.twitch.tv/CosmosRolling' : undefined
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

client.on('messageCreate', (message) => {
    if (!message.guild) {
        console.log(`[DEBUG] Detected a DM message from ${message.author.tag}`);
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
    }

    try {
        await initGuild(guild);

        if (settings.extendedlogs) {
            console.log(`Initialized guild config for ${guild.name} (${guild.id}).`);
        }
    } catch (error) {
        console.error(`Error initializing guild config for ${guild.name} (${guild.id}):`, error);
    }
});

client.on('guildDelete', async (guild) => {
    if (settings.extendedlogs) {
        console.log(`Removed from guild: ${guild.name} (${guild.id})`);
        webhookClient.send(`Removed from guild: ${guild.name} (${guild.id})`);
    }

    try {
        await removeGuildData(guild.id);
        await removeGuildConfig(guild.id);

        if (settings.extendedlogs) {
            console.log(`Removed data + config for ${guild.name} (${guild.id}).`);
        }
    } catch (error) {
        console.error(`Error removing guild data/config for ${guild.name} (${guild.id}):`, error);
    }
});

// Automatic verification: when a member joins, run the user verification service
client.on('guildMemberAdd', async (member) => {
    try {
        await userVerification.handleGuildMemberAdd(member);
    } catch (err) {
        console.error('Error in user verification service on guildMemberAdd:', err);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    // Pre-cache user's DM channel to prepare for possible replies
    try {
        const dmChannel = await interaction.user.createDM();
        console.log(`[Cache] Preloaded DM channel for ${interaction.user.tag}: ${dmChannel.id}`);
    } catch (err) {
        console.warn(`[Cache] Failed to preload DM channel for ${interaction.user.tag}:`, err.message);
    }
});

client.on('entitlementCreate', (entitlement) => {
  const subs = require('./subscriptions');
  subs.handleEntitlement(entitlement);
});

client.on('entitlementDelete', (entitlement) => {
  const subs = require('./subscriptions');
  subs.handleEntitlement(entitlement); // will mark as expired
});

// React to purchases
const subs = require('./subscriptions');
subs.onSubscriptionPurchase((data) => {
  console.log(`[SUBSCRIPTION] ${data.type} ${data.id} purchased plan ${data.plan}`);
});

const resolvedIntents = new IntentsBitField(client.options.intents).toArray();
console.log('[DEBUG] Intents:', resolvedIntents);
console.log('[DEBUG] Partials:', client.options.partials);

client.login(process.env.DISCORD_TOKEN);

console.log(`
████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████╗
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝

███╗   ██╗██╗██████╗ ███╗   ███╗██╗███╗   ██╗██╗    ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗     ██████╗  ██████╗ 
████╗  ██║██║██╔══██╗████╗ ████║██║████╗  ██║██║    ████╗  ██║██╔═══██╗██║   ██║██╔══██╗    ╚════██╗██╔════╝ 
██╔██╗ ██║██║██████╔╝██╔████╔██║██║██╔██╗ ██║██║    ██╔██╗ ██║██║   ██║██║   ██║███████║     █████╔╝███████╗ 
██║╚██╗██║██║██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██║    ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║    ██╔═══╝ ██╔═══██╗
██║ ╚████║██║██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║    ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║    ███████╗╚██████╔╝
╚═╝  ╚═══╝╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝    ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝    ╚══════╝ ╚═════╝ 

██████╗ ██╗   ██╗            ███████╗██╗███╗   ███╗██████╗ ██╗  ██╗   ██╗██╗  ██╗ █████╗ ████████╗████████╗
██╔══██╗╚██╗ ██╔╝            ██╔════╝██║████╗ ████║██╔══██╗██║  ╚██╗ ██╔╝██║ ██╔╝██╔══██╗╚══██╔══╝╚══██╔══╝
██████╔╝ ╚████╔╝             ███████╗██║██╔████╔██║██████╔╝██║   ╚████╔╝ █████╔╝ ███████║   ██║      ██║   
██╔══██╗  ╚██╔╝              ╚════██║██║██║╚██╔╝██║██╔═══╝ ██║    ╚██╔╝  ██╔═██╗ ██╔══██║   ██║      ██║   
██████╔╝   ██║       ███████╗███████║██║██║ ╚═╝ ██║██║     ███████╗██║   ██║  ██╗██║  ██║   ██║      ██║   
╚═════╝    ╚═╝       ╚══════╝╚══════╝╚═╝╚═╝     ╚═╝╚═╝     ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝      ╚═╝   

████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████╗
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
`);

let novaStartImage

if (settings.novaBranchVersion == "dev") {
    console.log(`Nova Branch Version is Dev`);
    novaStartImage = new AttachmentBuilder('./Icos/banners/startbanners/NSI_Dev.png').setName('novaStartImage.png');
} else if (settings.novaBranchVersion == "prod") {
    if (process.env.NODE_ENV == 'development') console.warn(`Nova is configured to prod, yet Node.js is in development.`)
    console.log(`Nova Branch Version is Prod`);
    novaStartImage = new AttachmentBuilder('./Icos/banners/startbanners/NSI_Prod.png').setName('novaStartImage.png');
} else {
    throw new Error(`settings.novaBranchVersion MUST be set to \`dev\` or \`prod\`.`);
}

console.log(novaStartImage);

const gitInfo = getGitInfo();
const npmModules = formatNPMModules();

const startEmbed = new EmbedBuilder()
    .setColor(0xbb22ff)
    .setAuthor({ name: `Nirmini Nova Version ${pkg.version}` })
    .setTitle(`Nirmini Nova: Startup Details`)
    .setDescription(`
**Nova Version:** ${pkg.version}
**Novaworks Version:** ${workspkg.version}
`)
.addFields(
    { name: `__**Node.js Data**__`, value: `
**Node.js Version:** ${process.version}
**Node.js Environment:** ${process.env.NODE_ENV || 'production'}
`, inline: true},
    { name: `__**Git Data**__`, value: `
**Latest Git Commit:** ${gitInfo.commitName} (${gitInfo.commitShort})
**Git Branch:** ${gitInfo.branch} (@${gitInfo.remoteBranch})
`, inline: true},
    { name: `__**NPM Modules**__`, value: npmModules, inline: false}
)
.setImage('attachment://novaStartImage.png');


webhookClient.send({
    embeds: [startEmbed],
    files: [novaStartImage]
});