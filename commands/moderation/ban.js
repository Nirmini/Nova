const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

module.exports = {
    id: '6975089', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Permanently ban a user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>  // Make sure the option is a string for the reason
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);
        const moderator = interaction.user;
        const providedReason = interaction.options.getString('reason'); // Use getString to get the reason

        // Check if the user has the required permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
            return;
        }

        if (!member.bannable) {
            await interaction.reply({ content: 'I cannot ban this user. They might have higher permissions or be the server owner.', flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            const banReason = `Permanent ban issued by ${moderator.tag} with the reason: ${providedReason}`;

            // Send DM to the user
            try {
                await user.send(`You have been permanently banned from **${interaction.guild.name}**. Reason: ${banReason}`);
            } catch (err) {
                console.error('Error sending DM:', err);
            }

            // Ban the user
            await member.ban({ reason: banReason });

            await interaction.reply(`Successfully banned ${user.tag} permanently. Reason: ${banReason}`);
        } catch (error) {
            console.error('Error banning user:', error);
            await interaction.reply('There was an error banning the user. Please try again later.');
        }
    },
};
