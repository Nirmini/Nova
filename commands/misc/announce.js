const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '5343884', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Send an announcement to a specific channel.')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to send the announcement to.')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The announcement message.')
                .setRequired(true)),
    async execute(interaction) {
        // Get the channel and message from the user input
        const targetChannel = interaction.options.getChannel('channel');
        const announcementMessage = interaction.options.getString('message');
        
        // Create the embed
        const announcementEmbed = {
            color: 0x0099ff,
            description: announcementMessage, // Main field (not inline)
            footer: {
                text: `Announcement by ${interaction.user.tag}`, // Shows who sent the announcement
            },
            timestamp: new Date(), // Current timestamp
        };

        // Send the embed to the specified channel
        try {
            await targetChannel.send({ embeds: [announcementEmbed] });
            await interaction.reply({ content: `Announcement sent to ${targetChannel}`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error sending the announcement.', flags: MessageFlags.Ephemeral });
        }
    },
};
