const packageJson = require('../package.json'); // Import the package.json file
const version = packageJson.version; // Access the 'version' property

module.exports = {
    /**
     * Executes the version command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        try {
            await message.reply(`Current version: \`${version}\``);
        } catch (error) {
            console.error('Error executing version command:', error);
            message.reply('An error occurred while processing the version command.');
        }
    },
};
