const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionsBitField, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { setData, getData } = require('../../src/firebaseAdmin'); // Use Admin SDK

module.exports = {
    id: '2640130', // Unique 6-digit command ID
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

            // Add Roles/Channels Option (True/False)
            const addRolesChannelsInput = new TextInputBuilder()
                .setCustomId('addRolesChannels')
                .setLabel('Do you want to add roles/channels? (true/false)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            // Assemble form
            modal.addComponents(
                new ActionRowBuilder().addComponents(groupNameInput),
                new ActionRowBuilder().addComponents(groupIDInput),
                new ActionRowBuilder().addComponents(addRolesChannelsInput)
            );

            // Show the modal
            await interaction.showModal(modal);
        } catch (error) {
            console.error('Error in /setup:', error);
            await interaction.reply({ content: 'An error occurred while processing the setup.', flags: MessageFlags.Ephemeral });
        }
    },

    async handleModal(interaction) {
        if (interaction.customId !== 'setupModal') return;

        // Extract form inputs
        const groupName = interaction.fields.getTextInputValue('groupName');
        const robloxGroupID = interaction.fields.getTextInputValue('robloxGroupID');
        const addRolesChannels = interaction.fields.getTextInputValue('addRolesChannels').toLowerCase() === 'true';

        const guildID = interaction.guild.id;
        const configPath = path.join(__dirname, `../../guildsettings/${guildID}/config.json`);

        try {
            // Fetch existing config or create new one
            let config = await getData(`guildsettings/${guildID}/config`);
            if (!config) {
                config = {};
            }

            // Assign values
            config.GroupName = groupName;
            config.rbxgroup = robloxGroupID;
            config.substat = "free"; // Default to free
            config.NirminiID = generateNirminiID();
            config.colours = { custom: false };

            // Store in Firebase
            await setData(`guildsettings/${guildID}/config`, config);

            // Handle roles and channels if requested
            if (addRolesChannels) {
                await setupRoles(interaction);
                await setupChannels(interaction);
            }

            // Respond with confirmation
            const embed = new EmbedBuilder()
                .setTitle('Setup Complete')
                .setColor(0x00ff00)
                .setDescription('Your server setup has been successfully completed.')
                .addFields(
                    { name: 'Group Name', value: groupName, inline: true },
                    { name: 'Roblox Group ID', value: robloxGroupID, inline: true },
                    { name: 'Roles/Channels Added', value: addRolesChannels ? 'Yes' : 'No', inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

        } catch (error) {
            console.error('Error in handling setup modal:', error);
            await interaction.reply({ content: 'An error occurred while saving your setup.', flags: MessageFlags.Ephemeral });
        }
    },
};

// Function to generate NirminiID (incrementing number)
async function generateNirminiID() {
    const lastID = await getData('guildsettings/lastNirminiID') || 0;
    const newID = lastID + 1;
    await setData('guildsettings/lastNirminiID', newID);
    return newID.toString();
}

// Function to handle role setup
async function setupRoles(interaction) {
    const guild = interaction.guild;

    const rolesToCreate = [
        { name: 'Moderator', color: 0x0000FF, permissions: [PermissionsBitField.Flags.ModerateMembers] },
        { name: 'Admin', color: 0xFF0000, permissions: [PermissionsBitField.Flags.Administrator] },
        { name: 'Muted', color: 0x808080, permissions: [] }
    ];

    for (const roleData of rolesToCreate) {
        if (!guild.roles.cache.find(r => r.name === roleData.name)) {
            await guild.roles.create({
                name: roleData.name,
                color: roleData.color,
                permissions: roleData.permissions,
                reason: 'Setup command: creating necessary roles.',
            });
        }
    }
}

// Function to handle channel setup
async function setupChannels(interaction) {
    const guild = interaction.guild;

    const channelsToCreate = [
        { name: 'mod-logs', type: 0, reason: 'Setup command: creating moderation log channel.' },
        { name: 'general-chat', type: 0, reason: 'Setup command: creating general chat channel.' },
    ];

    for (const channelData of channelsToCreate) {
        if (!guild.channels.cache.find(c => c.name === channelData.name)) {
            await guild.channels.create({
                name: channelData.name,
                type: channelData.type,
                reason: channelData.reason,
            });
        }
    }
}
