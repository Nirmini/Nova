const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionsBitField, EmbedBuilder, MessageFlags } = require('discord.js');
const { setGuildConfig, getGuildConfig } = require('../../src/Database'); // Use Admin SDK

module.exports = {
    id: '2000018', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Initial bot setup for the server.'),
    
    async execute(interaction) {
        try {
            // Ensure the user has Manage Guild permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Create modal
            const modal = new ModalBuilder()
                .setCustomId('setupModal')
                .setTitle('Server Setup');

            // Group Name Input
            const groupNameInput = new TextInputBuilder()
                .setCustomId('groupName')
                .setLabel('Enter your Group Name:')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            // Roblox Group ID Input
            const groupIDInput = new TextInputBuilder()
            .setCustomId('robloxGroupID')
            .setLabel('Enter your Roblox Group ID:')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
                    
            // Assemble form
            modal.addComponents(
            new ActionRowBuilder().addComponents(groupNameInput),
            new ActionRowBuilder().addComponents(groupIDInput)
            );

            // Show the modal
            await interaction.showModal(modal);
        } catch (error) {
            console.error('Error in /setup:', error);
            await interaction.reply({ content: 'An error occurred while processing the setup.', flags: MessageFlags.Ephemeral });
        }
    },

    async modalHandler(interaction) {
        if (interaction.customId !== 'setupModal') return;

        // Extract form inputs
        const groupName = interaction.fields.getTextInputValue('groupName');
        const robloxGroupID = interaction.fields.getTextInputValue('robloxGroupID');

        const guildID = interaction.guild.id;

        try {
            // Fetch existing config (should have been created by CreateNewGD.js on guild join)
            let config = await getGuildConfig(guildID);
            if (!config || Object.keys(config).length === 0) {
                await interaction.reply({ 
                    content: 'Guild configuration not found. Please ensure the bot has properly initialized the server.', 
                    flags: MessageFlags.Ephemeral 
                });
                return;
            }

            // Only update user-provided fields; DO NOT overwrite NirminiID, NovaworksId, or other system fields
            // These are managed by CreateNewGD.js and should never be regenerated
            config.GroupName = groupName;
            config.rbxgroup = robloxGroupID;

            // Store updated config back (preserves all fields managed by CreateNewGD.js)
            await setGuildConfig(guildID, config);

            // Respond with confirmation
            const embed = new EmbedBuilder()
                .setTitle('Setup Complete')
                .setColor(0x00ff00)
                .setDescription('Your server configuration has been updated.')
                .addFields(
                    { name: 'Group Name', value: groupName, inline: true },
                    { name: 'Roblox Group ID', value: robloxGroupID, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

        } catch (error) {
            console.error('Error in handling setup modal:', error);
            await interaction.reply({ content: 'An error occurred while saving your setup.', flags: MessageFlags.Ephemeral });
        }
    },
};