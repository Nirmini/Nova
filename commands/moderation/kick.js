const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '6105013', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)),
    async execute(interaction) {
        try {
            // Check if the member has the required permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers) ||
                !interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Get the user to be kicked and the optional reason
            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided.';
            const member = interaction.guild?.members.cache.get(user.id);

            if (!member) {
                await interaction.reply({ content: 'The specified user is not in the server.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Prepare the formatted reason for the audit log
            const modName = interaction.user.tag;
            const auditReason = `${reason}, Mod: ${modName}`;

            // Kick the user with the formatted reason
            await member.kick(auditReason);

            // Create embed response for public confirmation
            const embed = new EmbedBuilder()
                .setTitle('User Kicked')
                .setColor(0xff0000)
                .addFields(
                    { name: 'User', value: user.tag, inline: true },
                    { name: 'Action', value: 'Kicked', inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Optionally notify the user via DM
            const privateEmbed = new EmbedBuilder()
                .setTitle('You have been kicked')
                .setColor(0xff0000)
                .setDescription(`You were kicked from **${interaction.guild.name}** for the following reason:\n${reason}`)
                .setTimestamp();

            try {
                await user.send({ embeds: [privateEmbed] });
            } catch (error) {
                console.error('Error sending DM to user:', error);
                await interaction.followUp({ content: 'User kicked, but failed to DM the user.', flags: MessageFlags.Ephemeral });
            }

        } catch (error) {
            console.error('Error during command execution:', error.message);
            console.error('Error details:', error.stack);
            await interaction.reply({ content: 'An error occurred while processing the command.', flags: MessageFlags.Ephemeral });
        }
    },
};
