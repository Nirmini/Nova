const { ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Purge After')
        .setType(ApplicationCommandType.Message), // Message context menu command

    async execute(interaction) {
        try {
            const targetMessage = interaction.targetMessage;
            const channel = interaction.channel;
            const messagesToDelete = [];

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({
                    content: 'You do not have permission to use this command!',
                    ephemeral: true
                });
            }

            // Fetch messages from the channel
            const fetchedMessages = await channel.messages.fetch({ limit: 100 });

            let deleteMode = false;
            fetchedMessages.forEach((msg) => {
                if (deleteMode) messagesToDelete.push(msg);
                if (msg.id === targetMessage.id) deleteMode = true;
            });

            if (messagesToDelete.length === 0) {
                return interaction.reply({
                    content: 'No messages found after the selected message.',
                    ephemeral: true
                });
            }

            // Bulk delete messages (limit of 100 per request)
            await channel.bulkDelete(messagesToDelete, true);

            await interaction.reply({
                content: `Purged ${messagesToDelete.length} messages after the selected message.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in Purge After command:', error);
            await interaction.reply({
                content: 'An error occurred while trying to purge messages.',
                ephemeral: true
            });
        }
    }
};
