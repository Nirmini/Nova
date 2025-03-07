const { EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '0717849', // Unique 6-digit command ID
    data: {
        name: 'debug',
        description: 'Checks if a command exists and displays its arguments.',
        args: ['<commandName>'], // Documenting arguments for the debug command
    },
    /**
     * Executes the debug command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     * @param {string[]} args - The arguments passed to the command.
     */
    execute: async (message, args) => {
        try {
            if (!args.length) {
                return message.reply({
                    content: 'Please specify a command to debug. Usage: `?debug <commandName>`',
                    flags: MessageFlags.Ephemeral,
                });
            }

            const commandName = args[0].toLowerCase();
            const command = message.client.commands.get(commandName);

            if (!command) {
                return message.reply({
                    content: `The command \`${commandName}\` does not exist.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(`Command Debug: \`${commandName}\``)
                .setColor(0x7430A1)
                .addFields(
                    { name: 'Name', value: commandName, inline: true },
                    { name: 'Description', value: command.data.description || 'No description provided.', inline: true },
                    { 
                        name: 'Arguments', 
                        value: command.data.args?.join(' ') || 'No arguments defined.', 
                        inline: false 
                    },
                )
                .setFooter({ text: 'Command Debug Tool' })
                .setTimestamp();

            await message.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error executing debug command:', error);
            message.reply('An error occurred while processing the debug command.');
        }
    },
};
