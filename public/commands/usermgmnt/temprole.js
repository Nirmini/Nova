const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '9509674', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('temprole')
        .setDescription('Assign a role to a user temporarily.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to assign the role to.')
                .setRequired(true))
        .addRoleOption(option =>
            option
                .setName('role')
                .setDescription('The role to assign temporarily.')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('time')
                .setDescription('The duration to assign the role for (e.g., 10m, 2h, 1d).')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const user = interaction.options.getUser('user');
            const role = interaction.options.getRole('role');
            const time = interaction.options.getString('time');

            // Check if the user running the command has Manage Roles permission
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                await interaction.reply({ content: 'You do not have permission to assign roles.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Check if the bot has Manage Roles permission
            if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                await interaction.reply({ content: 'I do not have permission to manage roles.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Ensure the role is lower in the hierarchy than the bot's top role
            const botHighestRole = interaction.guild.members.me.roles.highest.position;
            if (role.position >= botHighestRole) {
                await interaction.reply({ content: 'I cannot assign this role because it is higher than or equal to my highest role.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Convert the time string to milliseconds
            const timeRegex = /^(\d+)([smhd])$/; // Matches numbers followed by s, m, h, or d
            const match = time.match(timeRegex);
            if (!match) {
                await interaction.reply({ content: 'Invalid time format. Use a number followed by s (seconds), m (minutes), h (hours), or d (days).', flags: MessageFlags.Ephemeral });
                return;
            }

            const [_, amount, unit] = match; // Destructure matched groups
            const durationInMs = {
                s: 1000,
                m: 60 * 1000,
                h: 60 * 60 * 1000,
                d: 24 * 60 * 60 * 1000,
            }[unit] * parseInt(amount);

            // Add the role to the user
            const member = interaction.guild.members.cache.get(user.id);
            if (!member) {
                await interaction.reply({ content: 'User not found in the server.', flags: MessageFlags.Ephemeral });
                return;
            }

            await member.roles.add(role);
            await interaction.reply({
                content: `${role} has been assigned to ${user} for ${time}.`,
                flags: MessageFlags.Ephemeral,
            });

            const embed = new EmbedBuilder()
                .setTitle('Temporary Role Assigned')
                .setColor(0x00ff00)
                .addFields(
                    { name: 'User', value: `${user.tag}`, inline: true },
                    { name: 'Role', value: `${role.name}`, inline: true },
                    { name: 'Duration', value: time, inline: true }
                )
                .setTimestamp();

            await interaction.channel.send({ embeds: [embed] });

            // Remove the role after the specified duration
            setTimeout(async () => {
                try {
                    if (member.roles.cache.has(role.id)) {
                        await member.roles.remove(role);
                        const removalEmbed = new EmbedBuilder()
                            .setTitle('Temporary Role Removed')
                            .setColor(0xff0000)
                            .addFields(
                                { name: 'User', value: `${user.tag}`, inline: true },
                                { name: 'Role', value: `${role.name}`, inline: true }
                            )
                            .setTimestamp();

                        await interaction.channel.send({ embeds: [removalEmbed] });
                    }
                } catch (error) {
                    console.error(`Failed to remove role: ${error.message}`);
                }
            }, durationInMs);

        } catch (error) {
            console.error('Error executing /temprole command:', error);
            await interaction.reply({ content: 'An error occurred while processing the command.', flags: MessageFlags.Ephemeral });
        }
    },
};
