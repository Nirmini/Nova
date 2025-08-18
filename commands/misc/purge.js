const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

module.exports = {
    id: '5000006', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete the last specified number of messages')
        .addIntegerOption(option =>
            option.setName('num')
                .setDescription('Number of messages to delete')
                .setRequired(true)),
    async execute(interaction) {
        const numMessages = interaction.options.getInteger('num');

        // Check if the user has the required permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
            return;
        }

        // Check if the number of messages to delete is valid
        if (numMessages < 1 || numMessages > 100) {
            await interaction.reply({ content: 'Please specify a number between 1 and 100.', flags: MessageFlags.Ephemeral });
            return;
        }

        // Check if the bot has the required permissions
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            await interaction.reply({ content: 'I am missing the required permissions to delete messages.', flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            // Fetch the messages
            const fetched = await interaction.channel.messages.fetch({ limit: numMessages });

            // Filter out messages older than 14 days
            const validMessages = fetched.filter(message => (Date.now() - message.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);

            if (validMessages.size === 0) {
                await interaction.reply({ content: 'No messages found that can be deleted (older than 14 days).', flags: MessageFlags.Ephemeral });
                return;
            }

            // Bulk delete the valid messages
            await interaction.channel.bulkDelete(validMessages, true);

            await interaction.reply({ content: `Successfully deleted ${validMessages.size} messages.`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error deleting messages:', error);
            await interaction.reply({ content: 'There was an error deleting the messages. Please try again later.', flags: MessageFlags.Ephemeral });
        }
    },
};
