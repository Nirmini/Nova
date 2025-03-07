const { PermissionsBitField } = require('discord.js');

module.exports = {
    id: '0539068', // Unique 6-digit command ID
    /**
     * Executes the purge command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        try {
            // Split the command into arguments
            const args = message.content.split(' ').slice(1);

            // Validate the number of messages to delete
            if (args.length === 0 || isNaN(args[0]) || args[0] < 1 || args[0] > 100) {
                return message.reply('Usage: `?purge <number>` (1-100)');
            }

            const numMessages = parseInt(args[0], 10);

            // Check if the user has the required permissions
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return message.reply('You do not have permission to use this command.');
            }

            // Check if the bot has the required permissions
            if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return message.reply('I am missing the required permissions to delete messages.');
            }

            // Fetch the messages
            const fetched = await message.channel.messages.fetch({ limit: numMessages });

            // Filter out messages older than 14 days
            const validMessages = fetched.filter(msg => (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);

            if (validMessages.size === 0) {
                return message.reply('No messages found that can be deleted (older than 14 days).');
            }

            // Bulk delete the valid messages
            await message.channel.bulkDelete(validMessages, true);

            await message.reply(`Successfully deleted ${validMessages.size} messages.`);
        } catch (error) {
            console.error('Error executing purge command:', error);
            message.reply('An error occurred while trying to purge messages.');
        }
    },
};
