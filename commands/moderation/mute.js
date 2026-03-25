const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '6000012', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user for a specified duration.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to mute.')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('time')
                .setDescription('Duration of the mute (e.g., 10m, 1h, 1d).')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the mute.')
                .setRequired(false)),
    async execute(interaction) {
        try {
            const target = interaction.options.getUser('user');
            const time = interaction.options.getString('time');
            const reason = interaction.options.getString('reason') || 'No reason provided.';
            const member = interaction.guild.members.cache.get(target.id);

            // Check if the target is in the guild
            if (!member) {
                await interaction.reply({ content: 'The specified user is not in this server.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Check if the executor has permission to moderate members
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Check if the bot has permission to moderate members
            if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                await interaction.reply({ content: 'I do not have permission to mute members.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Check role hierarchy
            if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                await interaction.reply({ content: 'I cannot mute this user due to role hierarchy.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Check for valid duration
            const durationMs = parseDuration(time);
            if (!durationMs || durationMs > 28 * 24 * 60 * 60 * 1000) {
                await interaction.reply({ content: 'Invalid time duration. Ensure it is valid and less than 28 days.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Apply the timeout
            await member.timeout(durationMs, `${reason}, Moderator: ${interaction.user.tag}`);

            // Send confirmation message
            const embed = new EmbedBuilder()
                .setTitle('User Muted')
                .setColor(0xffa500)
                .setTimestamp()
                .addFields(
                    { name: 'User', value: `${target.tag}`, inline: true },
                    { name: 'Duration', value: time, inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                );

            await interaction.reply({ embeds: [embed] });

            // Attempt to notify the muted user via DM
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('You Have Been Muted')
                    .setColor(0xffa500)
                    .setTimestamp()
                    .addFields(
                        { name: 'Server', value: interaction.guild.name, inline: true },
                        { name: 'Duration', value: time, inline: true },
                        { name: 'Reason', value: reason }
                    );

                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.error('Failed to send DM:', error);
                await interaction.followUp({ content: 'The user was muted, but I was unable to DM them.', flags: MessageFlags.Ephemeral });
            }
        } catch (error) {
            console.error('Error muting user:', error);
            await interaction.reply({ content: 'An error occurred while trying to mute the user.', flags: MessageFlags.Ephemeral });
        }
    },
};

/**
 * Parse a time duration string (e.g., "10m", "1h", "1d") into milliseconds.
 * @param {string} durationStr The time duration string to parse.
 * @returns {number} The duration in milliseconds, or null if invalid.
 */
function parseDuration(durationStr) {
    const regex = /^(\d+)([smhd])$/; // Match numbers followed by s, m, h, or d
    const match = durationStr.match(regex);

    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000; // Seconds to milliseconds
        case 'm': return value * 60 * 1000; // Minutes to milliseconds
        case 'h': return value * 60 * 60 * 1000; // Hours to milliseconds
        case 'd': return value * 24 * 60 * 60 * 1000; // Days to milliseconds
        default: return null;
    }
}
