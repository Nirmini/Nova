const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    id: '5000007', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('Get information about a role in the server.')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to get information about.')
                .setRequired(true)),
    async execute(interaction) {
        const role = interaction.options.getRole('role');

        // Calculate the number of members with this role
        const membersWithRole = interaction.guild.members.cache.filter(member => member.roles.cache.has(role.id)).size;

        // Create the embed with role information
        const embed = new EmbedBuilder()
            .setTitle(`Role Information: ${role.name}`)
            .setColor(role.color || 0x2f3136) // Default to a neutral color if no color is set
            .addFields(
                { name: 'Role ID', value: role.id, inline: true },
                { name: 'Color', value: `#${role.color.toString(16).padStart(6, '0').toUpperCase()}`, inline: true },
                { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
                { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
                { name: 'Position', value: role.position.toString(), inline: true },
                { name: 'Members with Role', value: membersWithRole.toString(), inline: true },
                { name: 'Created On', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:F>`, inline: false }
            )
            .setFooter({ text: 'Role Information' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
// Key Perms might be a good addition to this