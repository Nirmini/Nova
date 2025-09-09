const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, MessageFlags } = require('discord.js');
const { createUserCase } = require('../../src/NovaCases'); // central case manager
const cfg = require('../../settings.json')

module.exports = {
    id: '6000023', // Unique 6-digit command ID
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
            // Permission check
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
            }
            if (!interaction.guild) {
                return interaction.reply({ content: 'This command cannot be used outside of servers.', flags: MessageFlags.Ephemeral });
            }

            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');
            const expiresInput = interaction.options.getString('expires');
            const guildId = interaction.guildId;
            const issuerId = interaction.user.id;
            const userId = user.id;
            

            if (user.id === interaction.user.id && !cfg.allow_users_selfwarn) {
                return interaction.reply({ content: 'You cannot warn yourself.', flags: MessageFlags.Ephemeral });
            }

            // ---- Expiration Parsing ----
            const now = new Date();
            const maxExpiration = new Date();
            maxExpiration.setFullYear(now.getFullYear() + 1);

            let expirationDate;
            if (expiresInput) {
                const durationMatch = expiresInput.match(/^(\d+)([dmy])$/);
                if (!durationMatch) {
                    return interaction.reply({ content: 'Invalid expiration format. Use "Xd", "Xm", or "Xy" (e.g., "30d").', flags: MessageFlags.Ephemeral });
                }
                const [_, amount, unit] = durationMatch;
                const duration = parseInt(amount, 10);
                expirationDate = new Date(now);

                if (unit === 'd') expirationDate.setDate(now.getDate() + duration);
                else if (unit === 'm') expirationDate.setMonth(now.getMonth() + duration);
                else if (unit === 'y') expirationDate.setFullYear(now.getFullYear() + duration);

                if (expirationDate > maxExpiration) expirationDate = maxExpiration;
            } else {
                expirationDate = new Date(now);
                expirationDate.setDate(now.getDate() + 30);
            }

            const expirationISO = expirationDate.toISOString();

            // ---- Create Case in System ----
            const caseData = await createUserCase(
                guildId,
                userId,
                1, // type = Warning
                issuerId,
                `Warning issued`,
                reason,
                expirationISO
            );

            // ---- Public Embed ----
            const publicEmbed = new EmbedBuilder()
                .setTitle(`Case #${caseData?.id || '?'} — User Warned`)
                .setColor(0xff0000)
                .setTimestamp()
                .setFooter({ text: 'Warnings' })
                .addFields(
                    { name: 'User', value: `${user.tag} (${userId})`, inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Expires', value: `<t:${Math.floor(expirationDate.getTime() / 1000)}:F>`, inline: true }
                );

            await interaction.reply({ embeds: [publicEmbed] });

            // ---- Private DM Embed ----
            const privateEmbed = new EmbedBuilder()
                .setTitle(`You have been warned in [${interaction.guild.name}]`)
                .setColor(0xff0000)
                .setTimestamp()
                .setFooter({ text: 'Warning' })
                .addFields(
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Expires', value: `<t:${Math.floor(expirationDate.getTime() / 1000)}:F>`, inline: false }
                );

            try {
                await user.send({ embeds: [privateEmbed] });
            } catch (error) {
                console.error('Error sending DM to user:', error);
                await interaction.followUp({ content: 'Warning logged, but failed to DM the user.', flags: MessageFlags.Ephemeral });
            }
        } catch (error) {
            console.error('Error during /warn execution:', error);
            await interaction.reply({ content: 'An error occurred while processing the command.', flags: MessageFlags.Ephemeral });
        }
    },
};
