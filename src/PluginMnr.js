const fs = require('fs');
const path = require('path');

// Load premium guilds data
const { qhguilds, premiumguilds, partneredguilds } = require('../servicedata/premiumguilds');

// Path to the plugins directory
const pluginsPath = path.join(__dirname, '../core/plugins');
const enabledPluginsPath = path.join(__dirname, '../servicedata/guildPlugins.json');

// Load enabled plugins data
const loadEnabledPlugins = () => {
    if (!fs.existsSync(enabledPluginsPath)) {
        fs.writeFileSync(enabledPluginsPath, JSON.stringify({}, null, 4));
    }
    return JSON.parse(fs.readFileSync(enabledPluginsPath, 'utf8'));
};

// Get allowed plugin count for a guild
const getPluginLimit = (guildID, guildOwnerHasSubscription) => {
    if (premiumguilds.includes(guildID) || qhguilds.includes(guildID) || partneredguilds.includes(guildID)) {
        return 10;
    }
    return guildOwnerHasSubscription ? 5 : 2;
};

// Load and execute plugins
const executePlugins = async (guildID, guildOwnerHasSubscription, interaction) => {
    const enabledPlugins = loadEnabledPlugins();
    const allowedPlugins = getPluginLimit(guildID, guildOwnerHasSubscription);
    
    const guildPlugins = enabledPlugins[guildID] || [];
    if (guildPlugins.length === 0) return;

    // Prevent exceeding limits
    if (guildPlugins.length > allowedPlugins) {
        console.warn(`⚠️ Guild ${guildID} has exceeded the plugin limit. Some plugins won't be executed.`);
        guildPlugins.splice(allowedPlugins); // Trim excess plugins
    }

    for (const pluginName of guildPlugins) {
        const pluginPath = path.join(pluginsPath, `${pluginName}.js`);
        if (fs.existsSync(pluginPath)) {
            try {
                const plugin = require(pluginPath);
                if (typeof plugin.execute === 'function') {
                    await plugin.execute(interaction);
                    console.log(`✅ Executed plugin: ${pluginName} for guild ${guildID}`);
                }
            } catch (error) {
                console.error(`❌ Error executing plugin ${pluginName}:`, error);
            }
        } else {
            console.warn(`⚠️ Plugin ${pluginName} not found for guild ${guildID}.`);
        }
    }
};

module.exports = {
    executePlugins,
};
