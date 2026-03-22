const { SlashCommandBuilder, PermissionsBitField, MessageFlags, EmbedBuilder } = require('discord.js');

module.exports = {
    id: '6000001', // Unique 6-digit command ID
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

        const publicEmbeds = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle(`<:ShieldDenied:1329622917109252247> ***${user.tag} was banned.*** | ${providedReason}`)
        const publicEmbedf = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(`<:Failure:1329622862742421594> ***Failed to ban ${user.tag}.***`)
        const directEmbeds = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(`<:ShieldDenied:1329622917109252247> You were banned from ${interaction.guild.name} | ${providedReason}`)
            .setDescription(`You can submit an appeal in XX days.`)
        try {
            const banReason = `Permanent ban issued by ${moderator.tag} with the reason: ${providedReason}`;

            // Send DM to the user
            try {
                await user.send({ embeds: [directEmbeds] });
            } catch (err) {
                console.error('Error sending DM:', err);
            }

            // Ban the user
            await member.ban({ reason: banReason });

            await interaction.reply({ embeds: [publicEmbeds] });
        } catch (error) {
            console.error('Error banning user:', error);
            await interaction.reply({ embeds: [publicEmbedf] });
        }
    },
};
