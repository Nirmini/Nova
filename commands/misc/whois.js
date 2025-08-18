const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '5000012', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('whois')
        .setDescription('Get public information about a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get information about')
                .setRequired(true)),
    async execute(interaction) {
        try {
            // Get the target user
            const targetUser = interaction.options.getUser('user');
            const targetMember = interaction.guild?.members.cache.get(targetUser.id);

            // Define key permissions to display
            const keyPermissions = [
                'Administrator',
                'Manage Messages',
                'Kick Members',
                'Ban Members',
                'Manage Channels',
                'Manage Guild',
                'Manage Roles',
                'Manage Webhooks',
                'View Audit Log',
            ];

            // Create embed with user information
            const whoisEmbed = new EmbedBuilder()
                .setColor(0x2f3136)
                .setTitle(`Whois ${targetUser.tag}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
                .addFields(
                    { name: 'Username', value: `${targetUser.username}`, inline: true },
                    { name: 'Discriminator', value: `#${targetUser.discriminator}`, inline: true },
                    { name: 'User ID', value: targetUser.id, inline: true },
                    { name: 'Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`, inline: false },
                )
                .setTimestamp(); // Add timestamp to the embed footer

            // Add server-specific information if the user is in the server
            if (targetMember) {
                // Sort roles by position (highest first)
                const sortedRoles = targetMember.roles.cache
                    .sort((a, b) => b.position - a.position)
                    .map(role => role.toString());

                // Get user permissions and filter key permissions
                let userPermissions = targetMember.permissions.toArray();
                const filteredPermissions = keyPermissions.filter(perm => userPermissions.includes(perm.toUpperCase()));

                // Check if the user is the server owner
                if (interaction.guild.ownerId === targetUser.id) {
                    filteredPermissions.unshift('Administrator (Server Owner)');
                }

                whoisEmbed.addFields(
                    { name: 'Server Nickname', value: targetMember.nickname || 'None', inline: true },
                    { name: 'Joined Server', value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:F>`, inline: false },
                    { name: 'Roles', value: sortedRoles.join(', ') || 'None', inline: false },
                    { name: 'Key Permissions', value: filteredPermissions.length > 0 ? filteredPermissions.join(', ') : 'None', inline: false }
                );
            }

            // Send the embed as a reply
            await interaction.reply({ embeds: [whoisEmbed] });
        } catch (error) {
            console.error('Error fetching user info:', error);
            await interaction.reply({ content: 'There was an error fetching the user information.', flags: MessageFlags.Ephemeral });
        }
    },
};
