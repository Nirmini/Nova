const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    id: '2413285', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('View the bot\'s latency'),
    async execute(interaction) {
        const latency = interaction.client.ws.ping;
        await interaction.reply(`Pong! \`${latency}ms\``);
    },
};
// Might have this not reply to the command?