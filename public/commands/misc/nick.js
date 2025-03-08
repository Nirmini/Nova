const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

module.exports = {
    id: '5621784', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('nick')
        .setDescription('Set the bot\'s nickname in the guild')
        .addStringOption(option =>
            option.setName('nickname')
                .setDescription('The nickname for the bot')
                .setRequired(true)),
    async execute(interaction) {
        const nickname = interaction.options.getString('nickname');
        const member = interaction.guild.members.cache.get(interaction.client.user.id);

        // Check if the user has the required permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            await member.setNickname(nickname);
            await interaction.reply(`Bot's nickname has been changed to "${nickname}".`);
        } catch (error) {
            console.error('Error setting bot nickname:', error);
            await interaction.reply('There was an error setting the bot\'s nickname. Please try again later.');
        }
    },
};
