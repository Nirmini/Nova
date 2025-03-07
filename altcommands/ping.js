module.exports = {
    id: '0647539', // Unique 6-digit command ID
    /**
     * Executes the ping command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        try {
            const startTime = Date.now();
            const reply = await message.reply('Pong!');
            const endTime = Date.now();
            const latency = endTime - startTime;

            await reply.edit(`Pong! \`${latency}ms\``);
        } catch (error) {
            console.error('Error executing ping command:', error);
            message.reply('An error occurred while processing the ping command.');
        }
    },
};
