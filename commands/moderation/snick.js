const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    id: '6000017', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('snick')
        .setDescription('Set a user\'s nickname.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to change the nickname for.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('nickname')
                .setDescription('The new nickname for the user.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const nickname = interaction.options.getString('nickname');

        if (nickname.length > 32) {
            return interaction.reply({
                content: 'The nickname must be 32 characters or less.',
                flags: MessageFlags.Ephemeral,
            });
        }

        try {
            const member = await interaction.guild.members.fetch(user.id);

            if (!member) {
                return interaction.reply({
                    content: 'User is not a member of this server.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            await member.setNickname(nickname);
            return interaction.reply({
                content: `Successfully changed ${user.tag}'s nickname to "${nickname}".`,
                flags: MessageFlags.Ephemeral,
            });
        } catch (error) {
            console.error('Error changing nickname:', error);
            return interaction.reply({
                content: 'Failed to change the nickname. Please check my permissions and try again.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
