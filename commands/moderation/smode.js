const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

module.exports = {
    id: '6235902', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('smode')
        .setDescription('Set slowmode for a channel.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to set the slowmode on.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('slowmode')
                .setDescription('The slowmode duration in seconds (0 to 21600).')
                .setRequired(true)),
    async execute(interaction) {
        // Check if the user has the Manage Channels permission
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: 'You lack the permissions to use this command.', flags: MessageFlags.Ephemeral });
        }

        const channel = interaction.options.getChannel('channel');
        const slowmode = interaction.options.getInteger('slowmode');

        // Validate slowmode duration
        if (slowmode < 0 || slowmode > 21600) {
            return interaction.reply({ content: 'Slowmode duration must be between 0 and 21600 seconds.', flags: MessageFlags.Ephemeral });
        }

        // Set slowmode
        try {
            await channel.setRateLimitPerUser(slowmode);
            await interaction.reply({ content: `✅ Slowmode for ${channel} has been set to **${slowmode} seconds**.`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error setting slowmode:', error);
            await interaction.reply({ content: 'Failed to set slowmode. Ensure I have the correct permissions.', flags: MessageFlags.Ephemeral });
        }
    },
};
