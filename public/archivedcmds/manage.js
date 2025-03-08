const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const { getData, updateData } = require('../src/firebaseAdmin');

// Slash Command Setup for /manage
module.exports = {
    data: new SlashCommandBuilder()
    .setName('manage')
    .setDescription('Set a channel to follow the announcement channel from the source guild.'),
    async execute(interaction) {
async function handleManageInteraction(interaction) {
    const guildId = interaction.guildId;

    // If the interaction is a button click (Enable/Disable Command)
    if (interaction.isButton()) {
        const buttonId = interaction.customId;
        const action = buttonId === 'disable-command' ? 'Disable' : 'Enable';

        // Create a modal for the command name input
        const modal = new ModalBuilder()
            .setCustomId(`${buttonId}-modal`)
            .setTitle(`${action} Command`);

        const commandInput = new TextInputBuilder()
            .setCustomId('command-name')
            .setLabel('Command Name')
            .setPlaceholder('Enter the command name to be enabled/disabled')
            .setStyle(TextInputStyle.Short);

        const row = new ActionRowBuilder().addComponents(commandInput);
        modal.addComponents(row);

        // Show the modal to the user
        await interaction.showModal(modal);
        return;
    }

    // If the interaction is a modal submission
    if (interaction.isModalSubmit()) {
        const modalId = interaction.customId;
        const commandName = interaction.fields.getTextInputValue('command-name').toLowerCase();
        const isDisableAction = modalId === 'disable-command-modal';

        // Fetch the current blacklisted commands for the guild
        const path = `configs/${guildId}/Commands`;
        const currentConfig = (await getData(path)) || { blacklisted: [] };

        // Validate the command
        if (!interaction.client.commands.has(commandName)) {
            await interaction.reply({
                content: `Command "${commandName}" not found.`,
                ephemeral: true,
            });
            return;
        }

        // Handle enabling or disabling the command
        if (isDisableAction) {
            if (!currentConfig.blacklisted.includes(commandName)) {
                currentConfig.blacklisted.push(commandName);
                await updateData(path, { blacklisted: currentConfig.blacklisted });
                await interaction.reply({
                    content: `Command "${commandName}" has been disabled.`,
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: `Command "${commandName}" is already disabled.`,
                    ephemeral: true,
                });
            }
        } else {
            if (currentConfig.blacklisted.includes(commandName)) {
                currentConfig.blacklisted = currentConfig.blacklisted.filter(
                    (cmd) => cmd !== commandName
                );
                await updateData(path, { blacklisted: currentConfig.blacklisted });
                await interaction.reply({
                    content: `Command "${commandName}" has been enabled.`,
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: `Command "${commandName}" is not disabled.`,
                    ephemeral: true,
                });
            }
        }
    }
}
    },

    handleManageInteraction,
    manageCommand
};
