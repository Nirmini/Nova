const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { getData } = require('../../src/Database'); // Use Admin SDK

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
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }
            const user = interaction.options.getUser('user');
            const userId = user.id;
            const guildId = interaction.guildId;
            const path = `warnings/${guildId}/${userId}`;
            const warnings = await getData(path);

            if (!warnings || Object.keys(warnings).length === 0) {
                await interaction.reply({ content: 'This user has no warnings.', flags: MessageFlags.Ephemeral });
                return;
            }

            const warningEntries = Object.entries(warnings);
            const totalWarnings = warningEntries.length;

            // Limit to latest 25 warnings
            const limitedWarnings = warningEntries.slice(-25);

            const embed = new EmbedBuilder()
                .setTitle(`Warnings for ${user.tag}`)
                .setColor(0xff0000)
                .setTimestamp()
                .setFooter({ text: `Showing last ${limitedWarnings.length} out of ${totalWarnings} warnings.` });

            limitedWarnings.forEach(([warningId, warning], index) => {
                embed.addFields([
                    { 
                        name: `Warning #${totalWarnings - limitedWarnings.length + index + 1}`, 
                        value: `**Reason:** ${warning.reason || 'No reason provided'}
                        \n**Date:** ${warning.date || 'Unknown'}
                        \n**Expiration:** ${warning.expires || 'Unknown'}`
                    }
                ]);
            });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching warnings:', error);
            await interaction.reply({ content: 'There was an error fetching the warnings. Please try again later.', flags: MessageFlags.Ephemeral });
        }
    },
};
