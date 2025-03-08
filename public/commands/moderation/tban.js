const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const ms = require('ms');

module.exports = {
    id: '6013696', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('tban')
        .setDescription('Temporarily ban a user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('time')
                .setDescription('Ban duration (e.g., 1d, 2h, 30m)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const time = interaction.options.getString('time');
        const reason = interaction.options.getString('reason');
        const member = interaction.guild.members.cache.get(user.id);
        
        // Check if the duration is valid and within the limit
        const duration = ms(time);
        if (!duration || duration > ms('14d')) {
            await interaction.reply({ content: 'Invalid duration. Please specify a duration up to 14 days (e.g., 1d, 2h, 30m).', flags: MessageFlags.Ephemeral });
            return;
        }

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
            // Send DM to the user
            await user.send(`You have been temporarily banned from **${interaction.guild.name}** for **${time}**. Reason: ${reason}`);
        } catch (err) {
            console.error('Error sending DM:', err);
        }

        try {
            // Ban the user
            await member.ban({ days: Math.min(Math.floor(duration / (24 * 60 * 60 * 1000)), 7), reason });

            // Unban the user after the specified duration
            setTimeout(async () => {
                await interaction.guild.members.unban(user.id);
            }, duration);

            await interaction.reply(`Successfully banned ${user.tag} for ${time}.`);
        } catch (error) {
            console.error('Error banning user:', error);
            await interaction.reply('There was an error banning the user. Please try again later.');
        }
    },
};
