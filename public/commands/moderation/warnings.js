const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { getData } = require('../../src/firebaseAdmin'); // Use Admin SDK

module.exports = {
    id: '6374027', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Display all warnings for a user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User to display warnings for')
                .setRequired(true)),
    async execute(interaction) {
        try {
            console.log('Checking permissions...');
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }

            console.log('Fetching user...');
            const user = interaction.options.getUser('user');
            const userId = user.id;
            const guildId = interaction.guildId;

            console.log(`User: ${userId}, Guild: ${guildId}`);

            const path = `warnings/${guildId}/${userId}`;
            console.log(`Fetching warnings from path: ${path}`);
            const warnings = await getData(path);

            if (!warnings) {
                await interaction.reply({ content: 'This user has no warnings.', flags: MessageFlags.Ephemeral });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`Warnings for ${user.tag}`)
                .setColor(0xff0000)
                .setTimestamp()
                .setFooter({ text: 'Warnings' });

            Object.values(warnings).forEach((warning, index) => {
                embed.addFields([
                    { name: `Warning #${index + 1}`, value: `Reason: ${warning.reason}\nDate: ${warning.date}` }
                ]);
            });

            await interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error('Error fetching warnings:', error);
            await interaction.reply({ content: 'There was an error fetching the warnings. Please try again later.', flags: MessageFlags.Ephemeral });
        }
    },
};
