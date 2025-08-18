const { EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '0000017', // Unique 6-digit command ID
    /**
     * Executes the uptime command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        try {
            const uptime = message.client.uptime; // Client uptime in milliseconds
            const formattedUptime = new Date(uptime).toISOString().substr(11, 8); // Format to HH:MM:SS
            const embed = new EmbedBuilder()
                .setTitle('Bot Uptime')
                .setDescription(`The bot has been running for \`${formattedUptime}\`.`)
                .setColor('GREEN')
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing uptime command:', error);
            message.reply({ content: 'An error occurred while processing the uptime command.', flags: MessageFlags.Ephemeral });
        }
    },
};
