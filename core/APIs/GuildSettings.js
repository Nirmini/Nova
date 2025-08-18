const settings = require('../../settings.json');
const { setData, getData, removeData, updateData } = require('../../src/Database'); // Firebase RTDB Admin SDK

/**
 * Get a specific setting for a guild.
 * @param {string} guildId - The ID of the guild.
 * @param {string} key - The key of the setting to retrieve.
 * @returns {Promise<any>} - The value of the setting, or null if not found.
 */
async function getGuildSetting(guildId, key) {
    try {
        const path = `root/guildsettings/${guildId}/${key}`;
        const value = await getData(path);
        return value;
    } catch (error) {
        console.error(`Error retrieving guild setting for guildId: ${guildId}, key: ${key}`, error);
        return null;
    }
}

/**
 * Set a specific setting for a guild.
 * @param {string} guildId - The ID of the guild.
 * @param {string} key - The key of the setting to set.
 * @param {any} value - The value to set for the key.
 * @returns {Promise<void>}
 */
async function setGuildSetting(guildId, key, value) {
    try {
        const path = `root/guildsettings/${guildId}/${key}`;
        await setData(path, value);
    } catch (error) {
        console.error(`Error setting guild setting for guildId: ${guildId}, key: ${key}`, error);
    }
}

/**
 * Remove a specific setting for a guild.
 * @param {string} guildId - The ID of the guild.
 * @param {string} key - The key of the setting to remove.
 * @returns {Promise<void>}
 */
async function removeGuildSetting(guildId, key) {
    try {
        const path = `root/guildsettings/${guildId}/${key}`;
        await removeData(path);
    } catch (error) {
        console.error(`Error removing guild setting for guildId: ${guildId}, key: ${key}`, error);
    }
}

/**
 * Update multiple settings for a guild.
 * @param {string} guildId - The ID of the guild.
 * @param {object} updates - An object containing key-value pairs to update.
 * @returns {Promise<void>}
 */
async function updateGuildSettings(guildId, updates) {
    try {
        const path = `root/guildsettings/${guildId}`;
        await updateData(path, updates);
    } catch (error) {
        console.error(`Error updating guild settings for guildId: ${guildId}`, error);
    }
}

module.exports = {
    getGuildSetting,
    setGuildSetting,
    removeGuildSetting,
    updateGuildSettings,
};
