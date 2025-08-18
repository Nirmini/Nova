const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { getData, updateData } = require('../../src/Database');
const { convertCommandIdToName, convertCommandNameToId } = require('../../src/CommandIDs');

module.exports = {
    id: '2000005', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('commands')
        .setDescription('View or toggle slash commands in your guild.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all active and disabled commands in the guild.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Enable or disable a specific slash command.')
                .addStringOption(option =>
                    option
                        .setName('command_name')
                        .setDescription('The name of the command to toggle (e.g., "ban").')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        try {
            // Fetch the guild's command configuration
            let guildConfig = await getData(`guildsettings/${guildId}/config`);
            if (!guildConfig) {
                guildConfig = { disabledcommands: [] }; // Fallback if guildConfig is null
            }

            // Ensure disabledcommands is an array
            if (!Array.isArray(guildConfig.disabledcommands)) {
                guildConfig.disabledcommands = []; // Fallback if disabledcommands is not an array
            }

            if (subcommand === 'list') {
                // List active and disabled commands
                const disabledCommands = guildConfig.disabledcommands;
                const disabledCommandNames = disabledCommands
                    .map(id => convertCommandIdToName(id));
                const enabledCommandNames = commands
                    .filter(cmd => !disabledCommands.includes(cmd.id))
                    .map(cmd => cmd.name);

                const embed = new EmbedBuilder()
                    .setTitle('Guild Command Status')
                    .setColor(0x00ff00)
                    .setDescription('Here is the list of commands and their statuses:')
                    .addFields(
                        { name: 'Disabled Commands', value: disabledCommandNames.length > 0 ? disabledCommandNames.join('\n') : 'None' },
                        { name: 'Enabled Commands', value: enabledCommandNames.length > 0 ? enabledCommandNames.join('\n') : 'None' }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } else if (subcommand === 'toggle') {
                // Toggle a specific command
                const commandName = interaction.options.getString('command_name');
                const commandId = convertCommandNameToId(`/${commandName}`);

                if (commandId.startsWith('Unknown Command')) {
                    await interaction.reply({ content: `❌ Command \`${commandName}\` not found.`, flags: MessageFlags.Ephemeral });
                    return;
                }

                const disabledCommands = guildConfig.disabledcommands;

                if (disabledCommands.includes(commandId)) {
                    // Enable the command
                    guildConfig.disabledcommands = disabledCommands.filter(id => id !== commandId);
                    await updateData(`guildsettings/${guildId}/config`, { disabledcommands: guildConfig.disabledcommands });
                    await interaction.reply({ content: `✅ Command \`${commandName}\` has been enabled.`, flags: MessageFlags.Ephemeral });
                } else {
                    // Disable the command
                    guildConfig.disabledcommands.push(commandId);
                    await updateData(`guildsettings/${guildId}/config`, { disabledcommands: guildConfig.disabledcommands });
                    await interaction.reply({ content: `❌ Command \`${commandName}\` has been disabled.`, flags: MessageFlags.Ephemeral });
                }
            }
        } catch (error) {
            console.error('Error handling /commands command:', error);
            await interaction.reply({ content: 'An error occurred while processing your request.', flags: MessageFlags.Ephemeral });
        }
    },
};