const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const service = require('./service');

/**
 * Handles button interactions and modal submissions for tickets.
 * Expected button customIds:
 *  - ticket:create:legacy
 *  - ticket:create:nextgen
 *  - ticket:addresponses:<ticketId>
 *
 * Modal customIds:
 *  - ticket:addresponses_modal:<ticketId>
 *
 * The modal will accept a JSON string representing responses (object).
 */

module.exports = async function handleInteraction(interaction) {
    try {
        if (interaction.isButton && interaction.isButton()) {
            const customId = interaction.customId || '';
            // create ticket buttons
            if (customId.startsWith('ticket:create:')) {
                const [, , type] = customId.split(':'); // legacy or nextgen
                await interaction.deferReply({ ephemeral: true });

                const res = await service.newticket({
                    guildId: interaction.guildId,
                    openerId: interaction.user.id,
                    ticket_title: `${interaction.user.username}'s Ticket`,
                    ticket_description: null,
                    type: type === 'nextgen' ? 'nextgen' : 'legacy'
                });

                if (res.status !== 'success') {
                    return interaction.editReply({ content: `Failed to create ticket: ${res.message || 'unknown error'}` });
                }

                const ticket = res.ticket;
                const embed = new EmbedBuilder()
                    .setTitle(`Ticket Created (#${ticket.ticketId})`)
                    .setDescription(`Type: ${ticket.ticketType}\nOpen by: <@${ticket.openedBy}>`)
                    .setTimestamp();

                // Add "Add Responses" button only for nextgen
                const components = [];
                if (ticket.ticketType === 'nextgen') {
                    const addBtn = new ButtonBuilder()
                        .setCustomId(`ticket:addresponses:${ticket.ticketId}`)
                        .setLabel('Add Responses')
                        .setStyle(ButtonStyle.Primary);
                    components.push({ type: 1, components: [addBtn] });
                }

                return interaction.editReply({ content: `Ticket #${ticket.ticketId} created.`, embeds: [embed], components });
            }

            // Add responses button - open modal
            if (customId.startsWith('ticket:addresponses:')) {
                const parts = customId.split(':');
                const ticketId = parts[2];
                const modalId = `ticket:addresponses_modal:${ticketId}`;

                const input = new TextInputBuilder()
                    .setCustomId('responses')
                    .setLabel('Responses (JSON object)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('{"q1":"answer1","q2":"answer2"}')
                    .setRequired(true);

                const row = new ActionRowBuilder().addComponents(input);
                const modal = new ModalBuilder()
                    .setCustomId(modalId)
                    .setTitle(`Add Responses — #${ticketId}`)
                    .addComponents(row);

                return interaction.showModal(modal);
            }
        }

        // Modal submit handling
        if (interaction.isModalSubmit && interaction.isModalSubmit()) {
            const customId = interaction.customId || '';
            if (customId.startsWith('ticket:addresponses_modal:')) {
                await interaction.deferReply({ ephemeral: true });
                const ticketId = customId.split(':')[1];
                const raw = interaction.fields.getTextInputValue('responses');

                let parsed;
                try {
                    parsed = JSON.parse(raw);
                    if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Responses must be an object');
                } catch (err) {
                    return interaction.editReply({ content: `Invalid JSON provided: ${err.message}` });
                }

                const res = await service.addResponses(interaction.guildId, ticketId, parsed);
                if (res.status !== 'success') {
                    return interaction.editReply({ content: `Failed to add responses: ${res.message || 'unknown error'}` });
                }

                return interaction.editReply({ content: `Responses saved for ticket #${ticketId}.` });
            }
        }
    } catch (err) {
        console.error('[ticket:buttonhandler] Error handling interaction:', err);
        try { if (interaction.deferred || interaction.replied) await interaction.editReply({ content: 'An error occurred processing the ticket interaction.' }).catch(()=>{}); else await interaction.reply({ content: 'An error occurred processing the ticket interaction.', ephemeral: true }).catch(()=>{}); } catch {}
    }
};