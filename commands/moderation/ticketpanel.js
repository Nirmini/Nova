const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionsBitField,
    MessageFlags,
} = require('discord.js');
const { setData, getData } = require('../../src/Database');

module.exports = {
    id: '6000020', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Creates a ticket panel with an interactive button for users to open tickets.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),
    async execute(interaction) {
        // Ticket panel embed
        const panelEmbed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle('🎫 Open a Ticket')
            .setDescription('Click the button below to open a new ticket.\nProvide the required information, and our team will assist you.');

        // Ticket open button
        const openButton = new ButtonBuilder()
            .setCustomId('open_ticket')
            .setLabel('📩 Open Ticket')
            .setStyle(ButtonStyle.Success);

        const actionRow = new ActionRowBuilder().addComponents(openButton);

        // Send the panel in the current channel
        await interaction.channel.send({ embeds: [panelEmbed], components: [actionRow] });

        // Reply to the admin (ephemeral)
        await interaction.reply({ content: 'Ticket panel created successfully!', flags: MessageFlags.Ephemeral });
    },
};

// Button interaction handler
module.exports.handleButtonInteraction = async (interaction) => {
    if (interaction.customId === 'open_ticket') {
        // Open the modal for ticket creation
        const modal = new ModalBuilder()
            .setCustomId('ticket_modal')
            .setTitle('Open a Ticket');

        // Add inputs to the modal
        const discordUsernameInput = new TextInputBuilder()
            .setCustomId('discord_username')
            .setLabel('Your Discord Username')
            .setPlaceholder('e.g., User#1234')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const robloxUsernameInput = new TextInputBuilder()
            .setCustomId('roblox_username')
            .setLabel('Your Roblox Username')
            .setPlaceholder('e.g., RobloxUser123')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const purposeInput = new TextInputBuilder()
            .setCustomId('purpose')
            .setLabel('Purpose of Your Ticket')
            .setPlaceholder('Briefly describe the purpose of your ticket.')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(discordUsernameInput),
            new ActionRowBuilder().addComponents(robloxUsernameInput),
            new ActionRowBuilder().addComponents(purposeInput),
        );

        await interaction.showModal(modal);
    }
};

// Modal submission handler
module.exports.handleModalSubmit = async (interaction) => {
    if (interaction.customId === 'ticket_modal') {
        const discordUsername = interaction.fields.getTextInputValue('discord_username');
        const robloxUsername = interaction.fields.getTextInputValue('roblox_username');
        const purpose = interaction.fields.getTextInputValue('purpose');

        const guild = interaction.guild;
        const user = interaction.user;

        const ticketsPath = `tickets/${guild.id}`;
        const ticketsData = await getData(ticketsPath) || {};
        const ticketId = Object.keys(ticketsData).length + 1;

        const ticketCategory = guild.channels.cache.find(
            channel => channel.name.toLowerCase() === 'tickets' && channel.type === 4,
        ) || await guild.channels.create('Tickets', { type: 4 });

        const ticketChannel = await guild.channels.create(`ticket-${ticketId}`, {
            type: 0,
            parent: ticketCategory.id,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                },
            ],
        });

        const ticketData = {
            id: ticketId,
            userId: user.id,
            discordUsername,
            robloxUsername,
            purpose,
            channelId: ticketChannel.id,
            status: 'open',
            createdAt: new Date().toISOString(),
        };

        await setData(`${ticketsPath}/${ticketId}`, ticketData);

        await interaction.reply({ content: `Your ticket #${ticketId} has been created in ${ticketChannel}.`, flags: MessageFlags.Ephemeral });
    }
};
