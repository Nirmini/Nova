const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { getData } = require('../../src/firebaseAdmin');
require('dotenv').config();

// Load package.json for Nova version
const packagePath = path.join(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Load standards.json
const standardsPath = path.join(__dirname, '../../standards.json'); 
const standards = JSON.parse(fs.readFileSync(standardsPath, 'utf8'));
const embedColours = standards.EmbedColours || {}; 

// Function to safely convert colour strings to an RGB array
const parseColour = (key) => {
  if (!embedColours[key] || typeof embedColours[key] !== 'string') return [255, 255, 255]; // Default to white
  const rgb = embedColours[key].split(',').map(num => Number(num.trim()));
  return rgb.length === 3 && rgb.every(n => !isNaN(n) && n >= 0 && n <= 255) ? rgb : [255, 255, 255]; // Validate range
};

const rgbToHexInt = ([r, g, b]) => (r << 16) | (g << 8) | b; // Correct function

const embedColors = {
    Main: rgbToHexInt(parseColour('Main')),  // Fix here
    Red: rgbToHexInt(parseColour('Red')),
    Green: rgbToHexInt(parseColour('Green')),
    Yellow: rgbToHexInt(parseColour('Yellow')),
    Blue: rgbToHexInt(parseColour('Blue')),
};

// Function to get the latest Git commit ID and date
const getGitCommit = () => {
    try {
        return {
            id: execSync('git rev-parse HEAD').toString().trim(),
            date: execSync('git show -s --format=%ci HEAD').toString().trim(),
        };
    } catch {
        return { id: 'Unknown', date: 'Unknown' };
    }
};

// Function to format uptime
const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60); 
    return `${days} Days ・ ${hours} Hours ・ ${minutes} Mins ・ ${secs} Secs`;
};

// Function to get system uptime
const getSystemUptime = () => formatUptime(os.uptime());

// Function to get bot uptime
const getBotUptime = () => formatUptime(Math.floor(process.uptime()));

// Function to get memory usage
const getMemoryUsage = () => (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

// Get Git commit info
const gitCommit = getGitCommit();

module.exports = {
    id: '2025486',
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Get the status of Nirmini Nova'),

    async execute(interaction) {
        const botUser = interaction.client.user;
        const guild = interaction.guild;

        // Fetch guild-specific data from Firebase
        let guildConfig;
        try {
            guildConfig = await getData(`guildsettings/${guild.id}/config`);
        } catch (error) {
            console.error('Error fetching guild config:', error);
            guildConfig = null;
        }

        const disabledCommands = guildConfig?.disabledcommands || [];
        const disabledCommandsList = disabledCommands.length > 0
            ? disabledCommands.map(id => `- ${id}`).join('\n')
            : 'None';

        const embed = new EmbedBuilder()
            .setTitle('**Nirmini Nova Info**')
            .setDescription(
                'This bot is provided by the Novabot Team @ Nirmini Development. ' +
                'If you have any questions or concerns, please contact us at our ' +
                '[website](https://thatwest7014.pages.dev/Nova) or [support server](https://discord.gg/9Y7aZejzUH).'
            )
            .addFields(
                {
                    name: '**General Stats**',
                    value: `\`\`\`yaml
Name: ${botUser.username}#${botUser.discriminator}
ID: ${botUser.id}
\`\`\``,
                    inline: true,
                },
                {
                    name: '**Bot Stats**',
                    value: `\`\`\`yaml
Guilds: ${interaction.client.guilds.cache.size}
Bot Uptime: ${getBotUptime()}
NodeJS: ${process.version}
Memory Usage: ${getMemoryUsage()} MB
\`\`\``,
                    inline: true,
                },
                {
                    name: '**System Stats**',
                    value: `\`\`\`yaml
OS: ${os.platform()} ${os.release()}
Arch: ${os.arch()}
SysUptime: ${getSystemUptime()}
\`\`\``,
                },
                {
                    name: '**Build Stats**',
                    value: `\`\`\`yaml
Nova: ${packageJson.version}
Build: ${gitCommit.id}
Date: ${gitCommit.date}
\`\`\``,
                },
                {
                    name: '**Guild Stats**',
                    value: `\`\`\`yaml
Disabled Commands:
${disabledCommandsList}
Members: ${guild.memberCount}
Roles: ${guild.roles.cache.size}
\`\`\``,
                },
                {
                    name: '**Group Stats**',
                    value: `\`\`\`yaml
ROBLOX Group ID: ${guildConfig?.rbxgroup || 'Not Implemented'}
Nova Group ID: ${guildConfig?.NirminiID || 'Not Implemented'}
ROBLOX Group Name: ${guildConfig?.rbxgroupname || 'Not Implemented'}
Nova Group Name: ${guildConfig?.GroupName || 'Not Implemented'}
\`\`\``,
                }
            )
            .setFooter({ text: 'Nova Statuses :3' })
            .setTimestamp()
            .setColor(embedColors.Main); // Uses the parsed color from EmbedColours

        return interaction.reply({ embeds: [embed] });
    },
};
