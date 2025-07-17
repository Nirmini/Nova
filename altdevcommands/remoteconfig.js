const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const settingsPath = path.join(__dirname, '../settings.json'); // Path to settings.json
const settings = require(settingsPath); // Load the settings.json file

const devPerms = require('../devperms.json');

module.exports = {
    id: '0264795', // Unique 6-digit command ID
    /**
     * Executes the remoteconfig command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        try {
            const embed = new EmbedBuilder()

            // Permission check
            const userPerm = devPerms.usermap.find(u => u.userid === message.author.id);
            if (!userPerm || userPerm.level <= 300) {
                embed.setColor(0xff0000);
                embed.setTitle('You do not have permission to use this command.');
                return message.reply({ embeds: [embed] });
            }
            if (require('../../settings.json').devcmdsenabled != true) {
                embed.setColor(0xff0000);
                embed.setTitle('Developer commands are disabled in `settings.json`.');
                return message.reply({ embeds: [embed] });
            }

            // Check if remote configuration is allowed
            if (!settings.allowremoteconfig) {
                embed.setColor(0xff0000);
                embed.setTitle('Remote configuration is disabled. If you run this instance check \`root/settings.json\`')
                return message.reply({ embeds: [embed] });
            }

            // Parse the command arguments
            const args = message.content.split(' ').slice(1); // Remove the command prefix
            if (args.length < 3) {
                embed.setColor(0xaaaaff)
                embed.setTitle('Usage: `$remoteconfig <root/branch> <key> <value>`')
                return message.reply({ embeds: [embed] });
            }

            const [branch, key, ...valueParts] = args;
            const value = valueParts.join(' '); // Combine the remaining parts of the value

            // Handle updates to the root object
            if (branch === 'root') {
                if (!settings.hasOwnProperty(key)) {
                    embed.setColor(0xff0000);
                    embed.setTitle(`The key \`${key}\` does not exist in the root of \`root/settings.json\`.`)
                    return message.reply({ embeds: [embed] });
                }

                // Update the key in the root object
                settings[key] = parseValue(value);
            } else {
                // Check if the branch exists in the settings
                if (!settings[branch]) {
                    embed.setColor(0xff0000);
                    embed.setTitle(`The branch \`${branch}\` wasn't found in the root of \`root/settings.json\`.`)
                    return message.reply({ embeds: [embed] });
                }

                // Update the key in the specified branch
                settings[branch][key] = parseValue(value);
            }

            // Save the updated settings.json file
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), 'utf-8');

            // Reply with success message
            embed.setColor(0x00ff00);
            embed.setTitle(`Successfully updated \`${branch}/${key}\` to \`${value}\` in \`root/settings.json\`.`)
            await message.reply({ embeds: [embed]});
        } catch (error) {
            console.error('Error executing remoteconfig command:', error);
            embed.setColor(0xff0000);
            embed.setTitle('An error occurred while processing the remoteconfig command. Please check the console for details.')
            embed.setDescription(`Error: \`${error.message}\``);
            message.reply({ embeds: [embed] });
        }
    },
};

/**
 * Parses a value to determine its type (e.g., boolean, number, or string).
 * @param {string} value - The value to parse.
 * @returns {any} - The parsed value.
 */
function parseValue(value) {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    if (!isNaN(value)) return Number(value); // Convert to number if it's numeric
    return value; // Return as string if no other type matches
}