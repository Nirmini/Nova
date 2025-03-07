const { PermissionsBitField } = require('discord.js');

module.exports = {
    id: '0598818', // Unique 6-digit command ID
    /**
     * Executes the mute command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        try {
            // Split the message content into parts
            const args = message.content.split(' ').slice(1);

            // Validate arguments
            if (args.length < 3) {
                return message.reply('Usage: `?mute <@User> <Duration (in minutes)> <Reason>`');
            }

            // Extract user mention, duration, and reason
            const userMention = args[0];
            const duration = parseInt(args[1], 10);
            const reason = args.slice(2).join(' ');

            // Validate duration
            if (isNaN(duration) || duration <= 0) {
                return message.reply('Please provide a valid duration in minutes.');
            }

            // Get the user object from the mention
            const userId = userMention.replace(/[<@!>]/g, ''); // Extract ID from mention
            const member = await message.guild.members.fetch(userId).catch(() => null);

            if (!member) {
                return message.reply('Could not find the specified user.');
            }

            // Check if the message author has the required permissions
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return message.reply('You do not have permission to timeout members.');
            }

            // Check if the bot can timeout the user
            if (!member.moderatable) {
                return message.reply('I cannot timeout this user. They might have higher permissions or be the server owner.');
            }

            // Calculate timeout duration in milliseconds
            const timeoutDuration = duration * 60 * 1000;

            // Apply the timeout
            await member.timeout(timeoutDuration, `Timeout issued by ${message.author.tag}: ${reason}`);

            // Notify the member via DM
            try {
                await member.user.send(
                    `You have been timed out in **${message.guild.name}** for ${duration} minutes. Reason: ${reason}`
                );
            } catch (err) {
                console.error('Error sending DM:', err);
            }

            // Confirm mute to the moderator
            await message.reply(
                `Successfully muted ${member.user.tag} for ${duration} minutes. Reason: ${reason}`
            );
        } catch (error) {
            console.error('Error executing mute command:', error);
            message.reply('An error occurred while processing the mute command.');
        }
    },
};
