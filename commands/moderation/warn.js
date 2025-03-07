const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, MessageFlags } = require('discord.js');
const { setData, getData } = require('../../src/firebaseAdmin'); // Admin SDK functions

module.exports = {
    id: '6161901', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('expires')
                .setDescription('When does the warning expire? (e.g., "30d", "1y")')
                .setRequired(false)),
    async execute(interaction) {
        try {
            // Check for necessary permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }

            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');
            const expiresInput = interaction.options.getString('expires');
            const userId = user.id;
            const guildId = interaction.guildId;

            // Default expiration and max expiration
            const now = new Date();
            const maxExpiration = new Date();
            maxExpiration.setFullYear(now.getFullYear() + 1);

            let expirationDate;

            if (expiresInput) {
                // Parse expiration input
                const durationMatch = expiresInput.match(/^(\d+)([dmy])$/); // Matches "30d", "1y", etc.
                if (!durationMatch) {
                    await interaction.reply({ content: 'Invalid expiration format. Use "Xd", "Xm", or "Xy" (e.g., "30d").', flags: MessageFlags.Ephemeral });
                    return;
                }

                const [_, amount, unit] = durationMatch;
                const duration = parseInt(amount, 10);

                expirationDate = new Date(now);

                if (unit === 'd') {
                    expirationDate.setDate(now.getDate() + duration);
                } else if (unit === 'm') {
                    expirationDate.setMonth(now.getMonth() + duration);
                } else if (unit === 'y') {
                    expirationDate.setFullYear(now.getFullYear() + duration);
                }

                // Cap the expiration to one year from now
                if (expirationDate > maxExpiration) {
                    expirationDate = maxExpiration;
                }
            } else {
                // Default to 30 days if no expiration is provided
                expirationDate = new Date(now);
                expirationDate.setDate(now.getDate() + 30);
            }

            const expirationISO = expirationDate.toISOString();

            // Path to warnings in the database
            const userWarningsPath = `warnings/${guildId}/${userId}`;

            // Retrieve current warnings
            const snapshot = await getData(userWarningsPath);
            let warnings = snapshot || []; // Fallback to an empty array if no warnings exist

            // Add the new warning
            warnings.push({ reason, date: now.toISOString(), expires: expirationISO });

            // Save the updated warnings to the database
            await setData(userWarningsPath, warnings);

            // Create a public embed
            const publicEmbed = new EmbedBuilder()
                .setTitle('User Warned')
                .setColor(0xff0000)
                .setTimestamp()
                .setFooter({ text: 'Warnings' })
                .addFields(
                    { name: 'User', value: `${user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Expires', value: `<t:${Math.floor(expirationDate.getTime() / 1000)}:F>`, inline: true }
                );

            await interaction.reply({ embeds: [publicEmbed], ephemeral: false });

            // Create a private embed for the user
            const privateEmbed = new EmbedBuilder()
                .setTitle('You have been warned')
                .setColor(0xff0000)
                .setTimestamp()
                .setFooter({ text: 'Warning' })
                .addFields(
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Expires', value: `<t:${Math.floor(expirationDate.getTime() / 1000)}:F>`, inline: false }
                );

            // Notify the user via DM
            try {
                await user.send({ embeds: [privateEmbed] });
            } catch (error) {
                console.error('Error sending DM to user:', error);
                await interaction.followUp({ content: 'Warning sent, but failed to DM the user.', flags: MessageFlags.Ephemeral });
            }
        } catch (error) {
            console.error('Error during command execution:', error.message);
            console.error('Error details:', error.stack);
            await interaction.reply({ content: 'An error occurred while processing the command.', flags: MessageFlags.Ephemeral });
        }
    },
};
