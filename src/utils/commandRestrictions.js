const { getData } = require('../firebaseAdmin'); // Import getData from firebaseAdmin.js

/**
 * Checks if a command is blacklisted for a guild.
 * @param {string} guildId - The ID of the guild.
 * @param {string} commandName - The name of the command.
 * @returns {Promise<boolean>} - Whether the command is blacklisted.
 */
async function isCommandBlacklisted(guildId, commandName) {
    try {
        const path = `configs/${guildId}/Commands`;
        const config = await getData(path);

        // Check if a blacklist exists and if the command is blacklisted
        return config?.blacklisted?.includes(commandName) ?? false;
    } catch (error) {
        console.error('Error checking if command is blacklisted:', error.message);
        return false; // Default to allowing the command if there's an error
    }
}

module.exports = { isCommandBlacklisted };
