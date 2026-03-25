// DEPREACTION WARNING!! : This command will have it's function duplicated and/or replaced by DevDash soon!
const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

const devPerms = require('../../devperms.json');

// Rate limiting map for security
const msgRateLimits = new Map();
const MSG_RATE_LIMIT_TIME = 60 * 1000; // 1 minute
const MSG_RATE_LIMIT_COUNT = 5; // Max 5 messages per minute

module.exports = {
    id: '1000006', 
    data: new SlashCommandBuilder()
        .setName('msg')
        .setDescription('[DEPRECATED] Allows a specific user to pass a string for the bot to say in the channel.')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message for the bot to say')
                .setRequired(true)),
    async execute(interaction) {
        const message = interaction.options.getString('message');
        const userId = interaction.user.id;

        const embed = new EmbedBuilder()
        
        // Permission check
        const userPerm = devPerms.usermap.find(u => u.userid === userId);
        if (!userPerm || userPerm.level <= 100) {
            embed.setColor(0xff0000);
            embed.setTitle('You do not have permission to use this command.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        if (require('../../settings.json').devcmdsenabled != true) {
            embed.setColor(0xff0000);
            embed.setTitle('Developer commands are disabled in `settings.json`.');
            return interaction.reply({ embeds: [embed] });
        }

        // SECURITY FIX: Rate limiting to prevent spam abuse
        if (!msgRateLimits.has(userId)) {
            msgRateLimits.set(userId, { count: 0, resetTime: Date.now() + MSG_RATE_LIMIT_TIME });
        }
        const rateLimitData = msgRateLimits.get(userId);
        if (Date.now() > rateLimitData.resetTime) {
            rateLimitData.count = 0;
            rateLimitData.resetTime = Date.now() + MSG_RATE_LIMIT_TIME;
        }
        if (rateLimitData.count >= MSG_RATE_LIMIT_COUNT) {
            return interaction.reply({ content: `Rate limit exceeded. Max ${MSG_RATE_LIMIT_COUNT} messages per minute.`, flags: MessageFlags.Ephemeral });
        }
        rateLimitData.count++;

        // Reply to the interaction to let the user know their message was sent
        await interaction.reply({ content: 'Message sent!', flags: MessageFlags.Ephemeral });

        // SECURITY FIX: Use allowedMentions to prevent mention spam/privilege escalation
        // Send the message to the channel, interpreting any newlines, markdown, etc.
        await interaction.channel.send({
            content: message, // Send the message as-is, allowing \n and markdown like ```codeblocks```
            allowedMentions: { parse: [] } // CRITICAL: Disallow any mentions to prevent role/user mention DoS
        });
        console.log(userId + " sent message :" + `"` + message + `"`);

    },
};
