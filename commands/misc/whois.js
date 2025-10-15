const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to the UserData.json file for Roblox lookups
const userDataPath = path.join(__dirname, '../../NovaAppData/UserData.json');

module.exports = {
    id: '5000012', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('whois')
        .setDescription('Get user information')
        .addSubcommand(sub =>
            sub.setName('discord')
                .setDescription('Get information about a Discord user in this server')
                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('The Discord username to look up')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('roblox')
                .setDescription('Get information about a linked Roblox user in this server')
                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('The Roblox username to look up')
                        .setRequired(true))),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'discord') {
                // Sanitize username input by trimming <, >, @
                let input = interaction.options.getString('username');
                input = input.replace(/[<@>]/g, '').trim();

                // Try to resolve by mention, ID, or username
                let targetMember = interaction.guild.members.cache.get(input) ||
                    interaction.guild.members.cache.find(m => m.user.username.toLowerCase() === input.toLowerCase());

                if (!targetMember) {
                    return await interaction.reply({
                        content: 'Could not find that user in this server.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                const targetUser = targetMember.user;

                // Define key permissions
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

                // Create embed
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
                    .setTimestamp();

                // Add server info
                if (targetMember) {
                    const sortedRoles = targetMember.roles.cache
                        .sort((a, b) => b.position - a.position)
                        .map(role => role.toString());

                    let userPermissions = targetMember.permissions.toArray();
                    const filteredPermissions = keyPermissions.filter(perm => userPermissions.includes(perm.toUpperCase()));

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

                return await interaction.reply({ embeds: [whoisEmbed] });
            }

            if (subcommand === 'roblox') {
                const robloxUsername = interaction.options.getString('username');

                // Load UserData.json
                let userData = {};
                try {
                    userData = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
                } catch (err) {
                    console.error('Error reading UserData.json:', err);
                    return await interaction.reply({
                        content: 'Could not read user database.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                // Find a user with this Roblox username linked
                const linkedUserId = Object.keys(userData).find(uid => {
                    const rbInfo = userData[uid]?.roblox;
                    return rbInfo && rbInfo.username?.toLowerCase() === robloxUsername.toLowerCase();
                });

                if (!linkedUserId) {
                    return await interaction.reply({
                        content: 'No linked Roblox account found with that username.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                // Check if the linked Discord user is in the server
                const linkedMember = interaction.guild.members.cache.get(linkedUserId);
                if (!linkedMember) {
                    return await interaction.reply({
                        content: 'That Roblox user is not linked to anyone in this server.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                const rbData = userData[linkedUserId].roblox;

                // Build embed for Roblox
                const robloxEmbed = new EmbedBuilder()
                    .setColor(0x2f3136)
                    .setTitle(`Whois Roblox: ${rbData.username}`)
                    .addFields(
                        { name: 'Linked Discord', value: `${linkedMember.user.tag} (${linkedMember.id})`, inline: false },
                        { name: 'Roblox Username', value: rbData.username, inline: true },
                        { name: 'Roblox ID', value: rbData.id ? rbData.id.toString() : 'Unknown', inline: true },
                    )
                    .setTimestamp();

                return await interaction.reply({ embeds: [robloxEmbed] });
            }

        } catch (error) {
            console.error('Error in /whois command:', error);
            await interaction.reply({ content: 'There was an error fetching the user information.', flags: MessageFlags.Ephemeral });
        }
    },
};
