const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '2000011', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('members')
        .setDescription('Get information about server members'),
    async execute(interaction) {
        try {
            const guild = interaction.guild;

            // Ensure all members are fetched
            await guild.members.fetch();

            // Calculate member stats
            const totalMembers = guild.memberCount;
            const botMembers = guild.members.cache.filter(member => member.user.bot).size;
            const humanMembers = totalMembers - botMembers;

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('Server Members')
                .setColor(0x00ff00)
                .addFields(
                    { name: 'Total Members', value: `${totalMembers}`, inline: true },
                    { name: 'Human Members', value: `${humanMembers}`, inline: true },
                    { name: 'Bot Members', value: `${botMembers}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.tag}` });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing /members:', error);
            await interaction.reply({ content: 'An error occurred while fetching member information.', flags: MessageFlags.Ephemeral });
        }
    },
};
