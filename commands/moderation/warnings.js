const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { getGuildData } = require('../../src/Database'); // GuildData accessor
const { caseTypeToString } = require('../../src/NovaCases'); // helper if exported

module.exports = {
    id: '6000024', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Display all warnings for a user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User to display warnings for')
                .setRequired(true)),
    async execute(interaction) {
        try {
            // Permission check
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
            }

            const user = interaction.options.getUser('user');
            const userId = user.id;
            const guildId = interaction.guildId;

            // Pull all cases from DB
            let guildcases = await getGuildData(guildId, 'cases');
            if (!Array.isArray(guildcases)) guildcases = [];

            // Filter warnings only (type === 1, Warning)
            const warnings = guildcases.filter(c => c.target === userId && c.type === 1);

            if (warnings.length === 0) {
                return interaction.reply({ content: 'This user has no warnings.', flags: MessageFlags.Ephemeral });
            }

            const totalWarnings = warnings.length;
            const limitedWarnings = warnings.slice(-25); // last 25

            const embed = new EmbedBuilder()
                .setTitle(`Warnings for ${user.tag}`)
                .setColor(0xff0000)
                .setTimestamp()
                .setFooter({ text: `Showing last ${limitedWarnings.length} out of ${totalWarnings} warnings.` });

            limitedWarnings.forEach((warning, index) => {
                embed.addFields([{
                    name: `Warning #${totalWarnings - limitedWarnings.length + index + 1} (Case #${warning.id})`,
                    value: `**Reason:** ${warning.description || 'No reason provided'}
\n**Date:** ${warning.timestamp ? `<t:${Math.floor(new Date(warning.timestamp).getTime() / 1000)}:F>` : 'Unknown'}
\n**Expiration:** ${warning.expires ? `<t:${Math.floor(new Date(warning.expires).getTime() / 1000)}:F>` : 'Unknown'}
\n**Issuer:** <@${warning.issuer}>`
                }]);
            });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching warnings:', error);
            await interaction.reply({ content: 'There was an error fetching the warnings. Please try again later.', flags: MessageFlags.Ephemeral });
        }
    },
};
