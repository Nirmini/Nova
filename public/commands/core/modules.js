const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Helper function to check module existence
function checkModuleStatus(filePath) {
    const fullPath = path.resolve(__dirname, filePath);
    try {
        require(fullPath);
        return 'Operational 💚';
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            return 'Missing 🟥';
        }
        return 'Error 🟡';
    }
}

// Helper function to check for files in directories
function checkDirectoryStatus(directoryPath) {
    const fullPath = path.resolve(__dirname, directoryPath);
    try {
        const files = fs.readdirSync(fullPath);
        return files.length > 0 ? 'Operational 💚' : 'Empty ⬜';
    } catch (error) {
        return 'Missing 🟥';
    }
}

module.exports = {
    id: '2881307', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('modules')
        .setDescription('Module Status.'),
    async execute(interaction) {
        const creditsEmbed = new EmbedBuilder()
            .setColor(0xac00ff)
            .setTitle('Nova Modules Status')
            .setAuthor({ name: 'Nova: XDebug' })
            .setThumbnail('https://i.imgur.com/nhqjXCq.png')
            .addFields(
                { name: '> **Core Module Files**', value: 'Core files required for normal operations' },
                { name: 'BotCore File:', value: 'BotCore File:' + checkModuleStatus('../../src/index.js') },
                { name: 'Sharding Mngr:', value: 'Sharding Manager:' + checkModuleStatus('../../src/shard-monitor.js') },
                { name: 'Database Mngr:', value: 'Database Manager:' + checkModuleStatus('../../src/firebaseAdmin.js') },
                { name: '> **Global Modules**', value: 'Modules that are globally used in Nova.' },
                { name: 'ClientModule:', value: 'Client Module:' + checkModuleStatus('../../core/global/Client.js') },
                { name: 'Statuspage:', value: 'Statuspage:' + checkModuleStatus('../../core/global/statuspage.js') },
                { name: 'Nova Atlas:', value: 'Atlas Module:' + checkModuleStatus('../../core/AtlasEngine.cpp') },
                { name: '> **Command Modules**', value: 'Modules responsible for command management.' },
                { name: 'Admin:', value: 'Admin Cmds:' + checkDirectoryStatus('../admin') },
                { name: 'Core:', value: 'Core Cmds:' + checkDirectoryStatus('../core') },
                { name: 'Events:', value: 'Event Cmds:' + checkDirectoryStatus('../event') },
                { name: 'Fun:', value: 'Fun Cmds:' + checkDirectoryStatus('../fun') },
                { name: 'Misc:', value: 'Misc Cmds:' + checkDirectoryStatus('../misc') },
                { name: 'Moderation:', value: 'Moderation Cmds:' + checkDirectoryStatus('../moderation') },
                { name: 'ROBLOX:', value: 'ROBLOX Cmds:' + checkDirectoryStatus('../roblox') },
                { name: 'UserMngmnt:', value: 'User Mgmnt Cmds:' + checkDirectoryStatus('../usermgmnt') },
            )
            .setTimestamp()
            .setFooter({ text: 'Have an amazing rest of your day! *mewo* - Frost' });

        await interaction.reply({ embeds: [creditsEmbed] });
    },
};
