const { SlashCommandBuilder, MessageFlags } = require('discord.js');

// Rate limiting map for security
const announceRateLimits = new Map();
const ANNOUNCE_RATE_LIMIT_TIME = 60 * 1000; // 1 minute
const ANNOUNCE_RATE_LIMIT_COUNT = 3; // Max 3 announcements per minute

module.exports = {
    id: '5000002', // Unique 6-digit command ID
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
        const userId = interaction.user.id;
        
        // SECURITY FIX: Rate limiting to prevent spam abuse
        if (!announceRateLimits.has(userId)) {
            announceRateLimits.set(userId, { count: 0, resetTime: Date.now() + ANNOUNCE_RATE_LIMIT_TIME });
        }
        const rateLimitData = announceRateLimits.get(userId);
        if (Date.now() > rateLimitData.resetTime) {
            rateLimitData.count = 0;
            rateLimitData.resetTime = Date.now() + ANNOUNCE_RATE_LIMIT_TIME;
        }
        if (rateLimitData.count >= ANNOUNCE_RATE_LIMIT_COUNT) {
            return interaction.reply({ content: `Rate limit exceeded. Max ${ANNOUNCE_RATE_LIMIT_COUNT} announcements per minute.`, flags: MessageFlags.Ephemeral });
        }
        rateLimitData.count++;
        
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
            // SECURITY FIX: Disallow mentions to prevent malicious role/user ping attacks
            await targetChannel.send({ embeds: [announcementEmbed], allowedMentions: { parse: [] } });
            await interaction.reply({ content: `Announcement sent to ${targetChannel}`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error sending the announcement.', flags: MessageFlags.Ephemeral });
        }
    },
};
