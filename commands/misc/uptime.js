const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    id: '5000010', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Displays the bot\'s uptime.'),
    async execute(interaction) {
        // Calculate uptime
        const totalSeconds = Math.floor(interaction.client.uptime / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        // Create the embed
        const embed = new EmbedBuilder()
            .setTitle('Bot Uptime')
            .setDescription(`The bot has been online for:\n**${uptimeString}**`)
            .setColor('Blue')
            .setTimestamp();

        // Send the embed
        await interaction.reply({ embeds: [embed] });
    },
};
// Possibly import the ms package into this