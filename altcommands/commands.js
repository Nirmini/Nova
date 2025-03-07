const { EmbedBuilder, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const NovaDevEmojiId = '1335094430339698750';

module.exports = {
    id: '0869825', // Unique 6-digit command ID
    /**
     * Executes the ?commands command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        const client = message.client; // Get the bot client
        const commandDir = path.join(__dirname, '../commands'); // Path to commands folder
        const commandCategories = new Collection();

        try {
            // Read all subdirectories in ../commands/
            const categories = fs.readdirSync(commandDir);

            for (const category of categories) {
                const categoryPath = path.join(commandDir, category);

                // Ensure it's a directory
                if (!fs.lstatSync(categoryPath).isDirectory()) continue;

                const commands = fs.readdirSync(categoryPath)
                    .filter(file => file.endsWith('.js'))
                    .map(file => {
                        const command = require(path.join(categoryPath, file));
                        return command.data ? `\`/${command.data.name}\`` : null;
                    })
                    .filter(Boolean);

                if (commands.length > 0) {
                    commandCategories.set(category, commands);
                }
            }

            // Construct the embed
            const commandsEmbed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(`<:NovaDev:${NovaDevEmojiId}> Available Commands`)
                .setDescription('Here are all available commands:')
                .setFooter({ text: 'Use \`/help <command>\` for more details.' })
                .setTimestamp();

            // Add each category to the embed
            commandCategories.forEach((commands, category) => {
                commandsEmbed.addFields({ name: `**${category}**`, value: commands.join('\n') });
            });

            await message.reply({ embeds: [commandsEmbed] });

        } catch (error) {
            console.error('Error fetching commands:', error);
            await message.reply('⚠️ Failed to load commands.');
        }
    },
};
