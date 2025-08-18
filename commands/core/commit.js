const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { execSync } = require('child_process');

module.exports = {
    id: '2000006', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('commit')
        .setDescription('Display the current Git commit ID.'),
    async execute(interaction) {
        try {
            // Get the latest Git commit ID (shortened to 7 characters)
            const commitID = execSync('git rev-parse --short HEAD').toString().trim();

            // Create the embed
            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Nova: XDebug' })
                .setTitle('Current Git Commit')
                .setDescription(`Currently running on Git Commit \`${commitID}\`.`)
                .setTimestamp(new Date())
                .setColor(0x7289da); // Discord's blue color

            // Reply with the embed, set as ephemeral
            await interaction.reply({ embeds: [embed]});
        } catch (error) {
            console.error('Error retrieving Git commit ID:', error);
            await interaction.reply({
                content: 'An error occurred while retrieving the Git commit ID.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
