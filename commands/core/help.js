const { SlashCommandBuilder, EmbedBuilder,MessageFlags } = require('discord.js');

module.exports = {
    id: '2000009', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays a list of available commands or details about a specific command.')
        .addStringOption(option =>
            option
                .setName('command')
                .setDescription('Get detailed help for a specific command.')
                .setRequired(false)),
    async execute(interaction) {
        try {
            const commandName = interaction.options.getString('command');
            const commands = interaction.client.commands;

            if (commandName) {
                const command = commands.get(commandName);
                if (!command) {
                    await interaction.reply({ content: `Command \`${commandName}\` not found.`, flags: MessageFlags.Ephemeral });
                    return;
                }

                const embed = new EmbedBuilder()
                    .setTitle(`Help: ${command.data.name}`)
                    .setDescription(command.data.description)
                    .setColor(0x00ff00)
                    .addFields(
                        { name: 'Usage', value: `/${command.data.name}` },
                        { name: 'Options', value: command.data.options?.map(opt => `\`${opt.name}\`: ${opt.description}`).join('\n') || 'None' }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } else {
                const embed = new EmbedBuilder()
                    .setTitle('Available Commands')
                    .setColor(0x00ff00)
                    .setDescription('Here is a list of all available commands:')
                    .addFields(
                        commands.map(cmd => ({
                            name: `/${cmd.data.name}`,
                            value: cmd.data.description,
                        }))
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }
        } catch (error) {
            console.error('Error executing /help:', error);
            await interaction.reply({ content: 'An error occurred while executing the command.', flags: MessageFlags.Ephemeral });
        }
    },
};
