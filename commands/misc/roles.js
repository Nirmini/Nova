const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '5387489', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('roles')
        .setDescription('Lists all roles in the server.'),
    async execute(interaction) {
        try {
            const guild = interaction.guild;

            if (!guild) {
                return interaction.reply({
                    content: 'This command can only be used in a server.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            const roles = guild.roles.cache
                .sort((a, b) => b.position - a.position) // Sort roles by position
                .map(role => `${role} - ${role.members.size} members`); // Format roles with member counts

            // Split roles into chunks to handle Discord's embed field limits
            const chunkSize = 1024; // Embed field value limit
            const roleChunks = [];
            let currentChunk = '';
            roles.forEach(role => {
                if (currentChunk.length + role.length > chunkSize) {
                    roleChunks.push(currentChunk);
                    currentChunk = '';
                }
                currentChunk += `${role}\n`;
            });
            if (currentChunk) roleChunks.push(currentChunk); // Add remaining roles

            const embed = new EmbedBuilder()
                .setTitle('Server Roles')
                .setColor(0x3498db)
                .setDescription(
                    `This server has ${guild.roles.cache.size} roles. Here is the list of roles along with their member counts.`
                )
                .setFooter({ text: `Requested by ${interaction.user.tag}` })
                .setTimestamp();

            // Add each chunk as a separate field in the embed
            roleChunks.forEach((chunk, index) => {
                embed.addFields({ name: `Roles (${index + 1})`, value: chunk });
            });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing /roles command:', error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'An error occurred while fetching roles.',
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                await interaction.reply({
                    content: 'An error occurred while fetching roles.',
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    },
};
