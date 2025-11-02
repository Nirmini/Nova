const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, MessageFlags, ChannelType } = require('discord.js');
const service = require('./service');
const { getGuildConfig, getGuildData } = require('../src/Database');

function buildModalForForm(categoryName, ticketId, nextgenForm) {
    const modalId = `ticket:formmodal:${ticketId}:${encodeURIComponent(categoryName || '')}`;
    const modal = new ModalBuilder().setCustomId(modalId).setTitle(`Ticket Form — ${categoryName || 'Form'}`);

    const keys = Object.keys(nextgenForm || {});
    if (keys.length <= 5) {
        const rows = keys.map(k => {
            const q = nextgenForm[k];
            const input = new TextInputBuilder()
                .setCustomId(`q:${k}`)
                .setLabel(q.question || k)
                .setRequired(Boolean(q.requried))
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder(q.placeholder || '');
            return new ActionRowBuilder().addComponents(input);
        });
        modal.addComponents(...rows);
        return { modal, needsJsonFallback: false };
    } else {
        // single textarea for JSON fallback
        const input = new TextInputBuilder()
            .setCustomId('responses_json')
            .setLabel('Responses (JSON object)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('{"q1":"answer1","q2":"answer2"}')
            .setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return { modal, needsJsonFallback: true };
    }
}

async function getTicketConfigForCategory(guildId, categoryName) {
    const tcfgs = await getGuildData(guildId, 'ticketdata.ticket_configs');
    if (!Array.isArray(tcfgs)) return null;
    return tcfgs.find(t => String(t.name) === String(categoryName)) || null;
}

module.exports = async function handleInteraction(interaction) {
    try {
        // STRING SELECT (dropdown) from panel
        if (typeof interaction.isStringSelectMenu === 'function' && interaction.isStringSelectMenu()) {
            if (interaction.customId === 'ticket:select') {
                const category = interaction.values[0];

                // check if category has nextgen form
                const cfg = await getTicketConfigForCategory(interaction.guildId, category);
                if (cfg && cfg.type === 'nextgen' && cfg.nextgen_form) {
                    // show modal for form
                    const ticketStubId = `new-${Date.now()}`; // temporary id for modal correlation
                    const { modal } = buildModalForForm(category, ticketStubId, cfg.nextgen_form);
                    // encode category into modal customId already via buildModalForForm
                    await interaction.showModal(modal);
                    return true;
                }

                // otherwise create ticket immediately (nextgen without form or legacy)
                await interaction.deferReply();
                const res = await service.newticket({
                    guildId: interaction.guildId,
                    openerId: interaction.user.id,
                    ticket_title: `${interaction.user.username}'s Ticket`,
                    ticket_description: category ? `Category: ${category}` : null,
                    type: (cfg && cfg.type === 'nextgen') ? 'nextgen' : 'legacy',
                    ticket_json: { category }
                });

                if (res.status !== 'success') {
                    await interaction.followUp({ content: `Failed to create ticket: ${res.message || 'unknown'}`, flags: MessageFlags.Ephemeral });
                    return true;
                }

                // If service asked for thread creation, create a private thread here
                if (res.createThread) {
                    try {
                        const ticket = res.ticket;
                        const thr = await interaction.channel.threads.create({
                            name: `ticket-${ticket.ticketId}`,
                            autoArchiveDuration: 60,
                            type: ChannelType.PrivateThread,
                            reason: `Ticket ${ticket.ticketId} created`
                        });

                        // build embed and post
                        const actionRow = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId(`ticket:close:${ticket.ticketId}`).setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji({ name: "⛔" }),
                            new ButtonBuilder().setCustomId(`ticket:lock:${ticket.ticketId}`).setLabel('Lock').setStyle(ButtonStyle.Secondary).setEmoji({ name: "🔒" }),
                            new ButtonBuilder().setCustomId(`ticket:assign:${ticket.ticketId}`).setLabel('Assign').setStyle(ButtonStyle.Primary).setEmoji({ name: "📥" })
                        );

                        const embed = new EmbedBuilder()
                            .setTitle(`Ticket #${ticket.ticketId}`)
                            .setDescription(category ? `Category: ${category}` : '')
                            .setTimestamp();

                        const msg = await thr.send({ embeds: [embed], components: [actionRow] });
                        await service.updticket(interaction.guildId, ticket.ticketId, { channelId: thr.id, messageId: msg.id });
                        await interaction.followUp({ content: `Ticket #${ticket.ticketId} created as a private thread: <#${thr.id}> Opened.`, flags: MessageFlags.Ephemeral });
                        return true;
                    } catch (err) {
                        await interaction.followUp({ content: `Ticket created but failed to create thread: ${err?.message}`, flags: MessageFlags.Ephemeral });
                        return true;
                    }
                }

                // otherwise channel created by service; report success
                const ticket = res.ticket;
                if (res.created && res.created.channelId) {
                    await interaction.followUp({ content: `Ticket #${ticket.ticketId} created: <#${res.created.channelId}>`, flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.followUp({ content: `Ticket #${ticket.ticketId} created.`, flags: MessageFlags.Ephemeral });
                }
                return true;
            }
        }

        // BUTTON interactions
        if (typeof interaction.isButton === 'function' && interaction.isButton()) {
            const customId = interaction.customId || '';

            // ticket:create:<type>[:<category>]
            if (customId.startsWith('ticket:create:')) {
                const parts = customId.split(':');
                const type = parts[2] || 'legacy';
                const category = parts.length > 3 ? decodeURIComponent(parts.slice(3).join(':')) : null;

                // check ticket config for this category
                const cfg = await getTicketConfigForCategory(interaction.guildId, category);

                if (cfg && cfg.type === 'nextgen' && cfg.nextgen_form) {
                    // present modal form
                    const ticketStubId = `new-${Date.now()}`;
                    const { modal } = buildModalForForm(category, ticketStubId, cfg.nextgen_form);
                    await interaction.showModal(modal);
                    return true;
                }

                // otherwise create immediately
                await interaction.deferReply();
                const res = await service.newticket({
                    guildId: interaction.guildId,
                    openerId: interaction.user.id,
                    ticket_title: `${interaction.user.username}'s Ticket`,
                    ticket_description: category ? `Category: ${category}` : null,
                    type: (cfg && cfg.type === 'nextgen') ? 'nextgen' : (type === 'nextgen' ? 'nextgen' : 'legacy'),
                    ticket_json: category ? { category } : {}
                });

                if (res.status !== 'success') {
                    await interaction.followUp({ content: `Failed to create ticket: ${res.message || 'unknown error'}`, flags: MessageFlags.Ephemeral });
                    return true;
                }

                if (res.createThread) {
                    try {
                        const ticket = res.ticket;
                        const thr = await interaction.channel.threads.create({
                            name: `ticket-${ticket.ticketId}`,
                            autoArchiveDuration: 60,
                            type: ChannelType.PrivateThread,
                            reason: `Ticket ${ticket.ticketId} created`
                        });
                        const actionRow = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId(`ticket:close:${ticket.ticketId}`).setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji({ name: "⛔" }),
                            new ButtonBuilder().setCustomId(`ticket:lock:${ticket.ticketId}`).setLabel('Lock').setStyle(ButtonStyle.Secondar).setEmoji({ name: "🔒" }),
                            new ButtonBuilder().setCustomId(`ticket:assign:${ticket.ticketId}`).setLabel('Assign').setStyle(ButtonStyle.Primry).setEmoji({ name: "📥" })
                        );

                        const embed = new EmbedBuilder()
                            .setTitle(`Ticket #${ticket.ticketId}`)
                            .setDescription(category ? `Category: ${category}` : '')
                            .setTimestamp();
                        const msg = await thr.send({ embeds: [embed], components: [actionRow] });
                        await service.updticket(interaction.guildId, ticket.ticketId, { channelId: thr.id, messageId: msg.id });
                        await interaction.followUp({ content: `Ticket #${ticket.ticketId} created as a private thread: <#${thr.id}> Opened.`, flags: MessageFlags.Ephemeral });
                        return true;
                    } catch (err) {
                        await interaction.followUp({ content: `Ticket created but failed to create thread: ${err?.message}`, flags: MessageFlags.Ephemeral });
                        return true;
                    }
                }

                const ticket = res.ticket;
                if (res.created && res.created.channelId) {
                    await interaction.followUp({ content: `Ticket #${ticket.ticketId} created: <#${res.created.channelId}>`, flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.followUp({ content: `Ticket #${ticket.ticketId} created.`, flags: MessageFlags.Ephemeral });
                }
                return true;
            }

            // Add responses button - open modal (existing behavior)
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

                await interaction.showModal(modal);
                return true;
            }
        }

        // Modal submit handling
        if (typeof interaction.isModalSubmit === 'function' && interaction.isModalSubmit()) {
            const customId = interaction.customId || '';

            // handle form modal created by buildModalForForm
            if (customId.startsWith('ticket:formmodal:')) {
                // customId format: ticket:formmodal:new-<ts>:<encodedCategory>
                const parts = customId.split(':');
                const ticketStub = parts[2];
                const encodedCategory = parts.slice(3).join(':') || '';
                const category = decodeURIComponent(encodedCategory);

                // Collect responses from fields
                const fields = interaction.fields.fields; // Collection
                let responses = {};

                // If modal used JSON textarea id 'responses_json' or single field, parse it
                if (fields.has('responses_json')) {
                    const raw = interaction.fields.getTextInputValue('responses_json');
                    try {
                        const parsed = JSON.parse(raw);
                        if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected an object');
                        responses = parsed;
                    } catch (err) {
                        await interaction.reply({ content: `Invalid JSON: ${err.message}`, flags: MessageFlags.Ephemeral });
                        return true;
                    }
                } else {
                    // collect q: keys
                    for (const [id, field] of fields) {
                        if (id.startsWith('q:')) {
                            const key = id.slice(2);
                            responses[key] = interaction.fields.getTextInputValue(id);
                        }
                    }
                }

                // create ticket with formresponse
                await interaction.deferReply();
                const res = await service.newticket({
                    guildId: interaction.guildId,
                    openerId: interaction.user.id,
                    ticket_title: `${interaction.user.username}'s Ticket`,
                    ticket_description: category ? `Category: ${category}` : null,
                    type: 'nextgen',
                    ticket_json: { category },
                    formresponse: responses
                });

                if (res.status !== 'success') {
                    await interaction.followUp({ content: `Failed to create ticket: ${res.message || 'unknown'}`, flags: MessageFlags.Ephemeral });
                    return true;
                }

                const ticket = res.ticket;

                // If service created a channel and sent embed, try to ensure buttons exist and notify
                const createdChannelId = (res.created && res.created.channelId) ? res.created.channelId : (ticket && ticket.channelId) ? ticket.channelId : null;
                if (createdChannelId) {
                    try {
                        const createdCh = await interaction.guild.channels.fetch(createdChannelId).catch(() => null);
                        if (createdCh) {
                            const msgId = (res.created && res.created.messageId) || ticket.messageId || null;
                            // build action row
                            const actionRow = new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId(`ticket:close:${ticket.ticketId}`).setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji({ name: "⛔" }),
                                new ButtonBuilder().setCustomId(`ticket:lock:${ticket.ticketId}`).setLabel('Lock').setStyle(ButtonStyle.Secondar).setEmoji({ name: "🔒" }),
                                new ButtonBuilder().setCustomId(`ticket:assign:${ticket.ticketId}`).setLabel('Assign').setStyle(ButtonStyle.Primry).setEmoji({ name: "📥" })
                            );
                            if (msgId) {
                                const msg = await createdCh.messages.fetch(msgId).catch(() => null);
                                if (msg) {
                                    // edit message to include buttons if none
                                    if (!msg.components || msg.components.length === 0) {
                                        await msg.edit({ components: [actionRow] }).catch(() => {});
                                    }
                                }
                            }

                            // notify guild log channel if configured
                            const guildConfig = await getGuildConfig(interaction.guildId) || {};
                            const logChId = guildConfig.ticketconfig?.logchannel || null;
                            if (logChId) {
                                const logCh = await interaction.guild.channels.fetch(logChId).catch(() => null);
                                    if (logCh) {
                                    await logCh.send({ embeds: [new EmbedBuilder().setTitle(`New ticket opened — #${ticket.ticketId}`).setDescription(`Opened by <@${interaction.user.id}> in <#${createdChannelId}>\nCategory: ${ticket.ticketType === 'nextgen' ? (ticket.ticketDesc || '') : ''}`).setTimestamp()] }).catch(() => {});
                                }
                            }
                        }
                    } catch (e) {
                        // ignore
                    }
                    await interaction.followUp({ content: `Ticket #${ticket.ticketId} created: <#${createdChannelId}> Opened.`, flags: MessageFlags.Ephemeral });
                    return true;
                }

                // Otherwise, create a private thread here and post an embed with the responses
                try {
                    const thr = await interaction.channel.threads.create({
                        name: `ticket-${ticket.ticketId}`,
                        autoArchiveDuration: 60,
                        type: ChannelType.PrivateThread,
                        reason: `Ticket ${ticket.ticketId} created`
                    });

                    const embed = await service.buildTicketEmbedForNextgen
                        ? await service.buildTicketEmbedForNextgen(interaction.guildId, category, responses, ticket)
                        : new EmbedBuilder().setTitle(`Ticket #${ticket.ticketId}`).setDescription(category || '').setTimestamp();

                    const msg = await thr.send({ embeds: [embed] });
                    await service.updticket(interaction.guildId, ticket.ticketId, { channelId: thr.id, messageId: msg.id });
                    await interaction.followUp({ content: `Ticket #${ticket.ticketId} created as a private thread.`, flags: MessageFlags.Ephemeral });
                    return true;
                } catch (err) {
                    await interaction.followUp({ content: `Ticket created but failed to create thread: ${err?.message}`, flags: MessageFlags.Ephemeral });
                    return true;
                }
            }

            // existing addresponses modal
            if (customId.startsWith('ticket:addresponses_modal:')) {
                await interaction.deferReply();
                const ticketId = customId.split(':')[2];
                const raw = interaction.fields.getTextInputValue('responses');

                let parsed;
                try {
                    parsed = JSON.parse(raw);
                    if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Responses must be an object');
                } catch (err) {
                    await interaction.followUp({ content: `Invalid JSON provided: ${err.message}`, flags: MessageFlags.Ephemeral });
                    return true;
                }

                const res = await service.addResponses(interaction.guildId, ticketId, parsed);
                if (res.status !== 'success') {
                    await interaction.followUp({ content: `Failed to add responses: ${res.message || 'unknown error'}`, flags: MessageFlags.Ephemeral });
                    return true;
                }

                await interaction.followUp({ content: `Responses saved for ticket #${ticketId}.`, flags: MessageFlags.Ephemeral });
                return true;
            }
        }

        // not handled here
        return false;
    } catch (err) {
        console.error('[ticket:buttonhandler] Error handling interaction:', err);
        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: 'An error occurred processing the ticket interaction.' }).catch(() => { });
            } else {
                await interaction.reply({ content: 'An error occurred processing the ticket interaction.', flags: MessageFlags.Ephemeral }).catch(() => { });
            }
        } catch { }
        return true;
    }
};