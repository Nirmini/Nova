const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '6000015', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('sban')
        .setDescription('Softban a user (ban and unban to remove their messages)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to softban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the softban')
                .setRequired(true)),
    async execute(interaction) {
        try {
            // Check if the member has the BanMembers permission
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Get the user to be softbanned and the reason
            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');
            const member = interaction.guild?.members.cache.get(user.id);

            // Ensure the user is in the guild
            if (!member) {
                await interaction.reply({ content: 'The specified user is not in the server.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Construct the audit log reason
            const logReason = `${reason}, issued by ${interaction.user.tag}`;

            // Ban the user, specifying 7 days of message deletion
            await interaction.guild.members.ban(user.id, { deleteMessageSeconds: 7 * 24 * 60 * 60, reason: logReason });
            
            // Unban the user immediately after banning
            await interaction.guild.members.unban(user.id, logReason);

            // Confirmation embed
            const embed = new EmbedBuilder()
                .setTitle('User Softbanned')
                .setColor(0xff0000)
                .addFields(
                    { name: 'User', value: user.tag, inline: true },
                    { name: 'Action', value: 'Softbanned (Banned and Unbanned to remove messages)', inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Notify the user via DM
            const privateEmbed = new EmbedBuilder()
                .setTitle('You have been softbanned')
                .setColor(0xff0000)
                .setDescription(`You were softbanned from **${interaction.guild.name}**. Your messages were removed.`)
                .setTimestamp();

            try {
                await user.send({ embeds: [privateEmbed] });
            } catch (error) {
                console.error('Error sending DM to user:', error);
                await interaction.followUp({ content: 'User softbanned, but failed to DM the user.', flags: MessageFlags.Ephemeral });
            }

        } catch (error) {
            console.error('Error during command execution:', error.message);
            console.error('Error details:', error.stack);
            await interaction.reply({ content: 'An error occurred while processing the command.', flags: MessageFlags.Ephemeral });
        }
    },
};
