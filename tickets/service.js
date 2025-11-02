const fs = require('node:fs');
const path = require('node:path');
const Client = require('../core/global/Client');
const { 
    getGuildConfig,
    setGuildConfig,
    getGuildData,
    setGuildData,
    removeGuildData,
    getUserData
} = require('../src/Database');
const gconfig = require('../settings.json');
const tconfig = require('../ticketsettings.json');
require('../mainapp/sentry');
const perms = require('../devperms.json'); //TEMP!! : Override to allow developers access to tickets so QA doesn't break something badly again.
const { ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function getTickets(guildId) {
    const tickets = await getGuildData(guildId, 'ticketdata.tickets');
    return Array.isArray(tickets) ? tickets : [];
}

async function saveTickets(guildId, tickets) {
    await setGuildData(guildId, 'ticketdata.tickets', tickets);
}

function nextNumericTicketId(tickets) {
    if (!Array.isArray(tickets) || tickets.length === 0) return 1;
    const max = tickets.reduce((m, t) => Math.max(m, Number(t.ticketId) || 0), 0);
    return max + 1;
}

async function findTicketConfig(guildId, categoryName) {
    const tcfgs = await getGuildData(guildId, 'ticketdata.ticket_configs');
    if (!Array.isArray(tcfgs)) return null;
    return tcfgs.find(t => String(t.name) === String(categoryName)) || null;
}

async function createPrivateChannelForTicket(guild, parentCategoryId, chName, openerId, includeRoleIds = []) {
    const overwrites = [];

    // deny @everyone
    overwrites.push({
        id: guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
    });

    // allow opener
    overwrites.push({
        id: String(openerId),
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
    });

    // allow roles
    for (const rid of (includeRoleIds || [])) {
        try {
            overwrites.push({
                id: rid,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
            });
        } catch (e) { /* ignore malformed ids */ }
    }

    // include devs (perms map) as individual user overwrites (level > 450 aka senior NEDD Nova Devs)
    for (const uid in perms) {
        try {
            const p = perms[uid];
            if (p && typeof p.level === 'number' && p.level > 450) {
                overwrites.push({
                    id: String(uid),
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
                });
            }
        } catch (e) {}
    }

    const created = await guild.channels.create({
        name: chName,
        type: ChannelType.GuildText,
        parent: parentCategoryId || undefined,
        permissionOverwrites: overwrites,
        reason: `Ticket channel for ${chName}`
    });

    return created;
}

async function buildTicketEmbedForNextgen(guildId, categoryName, formresponse, ticket) {
    const cfg = await findTicketConfig(guildId, categoryName);
    const usage = cfg?.ticket_usage ? String(cfg.ticket_usage) : null;
    const openerName = ticket?.lastInteraction?.userName || null;
    const titleParts = [];
    if (ticket && ticket.ticketId) titleParts.push(`Ticket #${ticket.ticketId}`);
    if (usage) titleParts.push(usage.charAt(0).toUpperCase() + usage.slice(1));
    if (openerName) titleParts.push(`${openerName}`);

    const embed = new EmbedBuilder()
        .setTitle(cfg?.legacy_embed?.title ?? (titleParts.length ? titleParts.join(' — ') : `Ticket — ${categoryName || 'General'}`))
        .setDescription(cfg?.legacy_embed?.description ?? 'Ticket opened')
        .setColor(0x00AE86)
        .setTimestamp();

    // If we have structured nextgen form questions, try to map them
    const questions = cfg?.nextgen_form || null;
    if (questions && typeof questions === 'object') {
        for (const qk of Object.keys(questions)) {
            const q = questions[qk];
            const answer = (formresponse && typeof formresponse === 'object') ? (formresponse[qk] ?? '—') : '—';
            embed.addFields([{ name: q.question || qk, value: String(answer).slice(0, 1024) }]);
        }
    } else if (formresponse && typeof formresponse === 'object') {
        // fallback: dump key -> value pairs
        for (const k of Object.keys(formresponse)) {
            embed.addFields([{ name: k, value: String(formresponse[k]).slice(0, 1024) }]);
        }
    }

    return embed;
}

async function newticket({
    guildId,
    openerId,
    ticket_title = 'Support Ticket',
    ticket_description = null,
    ticket_fields = {},
    ticket_box = null,
    ticket_json = {},
    type = 'legacy', // or 'nextgen'
    formresponse = null,
    channelId = null
}) {
    // Enforce configs
    const guildConfig = await getGuildConfig(guildId);
    if (!guildConfig || !guildConfig.ticketconfig?.enabled) {
        return { status: "error", message: "Tickets are disabled for this guild." };
    }
    // Blacklist check
    const blacklistedRoles = guildConfig.ticketconfig?.guild_blacklist_roles || [];
    const userData = await getUserData(openerId);
    if (userData?.roles?.some(role => blacklistedRoles.includes(role))) {
        return { status: "error", message: "You are not allowed to open tickets." };
    }

    // Create ticket object using numeric ticketId (consistent with new JSON)
    const tickets = await getTickets(guildId);
    const numericId = nextNumericTicketId(tickets);

    const ticket = {
        ticketId: numericId,
        openedAt: new Date().toISOString(),
        openedBy: String(openerId),
        lastInteraction: {
            timestamp: new Date().toISOString(),
            userId: String(openerId),
            userName: (Client.users?.cache?.get(openerId)?.username) || null
        },
        ticketName: ticket_title,
        ticketDesc: ticket_description,
        usersInvolved: [{ uid: String(openerId), perms: 'owner' }],
        ticketType: type === 'nextgen' ? 'nextgen' : 'legacy',
        formresponse: (type === 'nextgen' && formresponse && typeof formresponse === 'object') ? formresponse : null,
        channelId: channelId ? String(channelId) : null,
        messageId: null,
        status: 'open',
        createdAt: new Date().toISOString()
    };

    tickets.push(ticket);
    await saveTickets(guildId, tickets);

    // Do we make a channel or a thread?
    try {
        const parentCategoryId = guildConfig.ticketconfig?.category_id || null;
        const useThreads = Boolean(guildConfig.ticketconfig?.use_threads);
        const tcfg = await findTicketConfig(guildId, ticket_json?.category);

        const forceChannelForThis = (tcfg && typeof tcfg.forcechannel === 'boolean') ? tcfg.forcechannel : true;

        const shouldSkipChannel = (!parentCategoryId) || (useThreads && forceChannelForThis === false);

        if (shouldSkipChannel) {
            // signal the caller that they should create a thread instead (or no channel)
            return { status: "success", ticket, createThread: true };
        }

        // create private channel
        const guild = Client.guilds.cache.get(guildId) || await Client.guilds.fetch(guildId);
        if (guild) {
            const chName = `ticket-${ticket.ticketId}`;
            const includeRoles = Array.isArray(guildConfig.ticketconfig?.include_roles) ? guildConfig.ticketconfig.include_roles : [];
            const created = await createPrivateChannelForTicket(guild, parentCategoryId, chName, openerId, includeRoles);
            ticket.channelId = created.id;

            // create embed & message
            // build action buttons
            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`ticket:close:${ticket.ticketId}`).setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji({ name: "⛔" }),
                new ButtonBuilder().setCustomId(`ticket:lock:${ticket.ticketId}`).setLabel('Lock').setStyle(ButtonStyle.Secondary).setEmoji({ name: "🔒" }),
                new ButtonBuilder().setCustomId(`ticket:assign:${ticket.ticketId}`).setLabel('Assign').setStyle(ButtonStyle.Primary).setEmoji({ name: "📥" })
            );

            if (ticket.ticketType === 'nextgen' && ticket.formresponse) {
                const embed = await buildTicketEmbedForNextgen(guildId, ticket_json?.category || 'General', ticket.formresponse, ticket);
                const msg = await created.send({ embeds: [embed], components: [actionRow] });
                ticket.messageId = msg.id;
            } else {
                // legacy or no form; include welcome message if configured
                const cfg = await findTicketConfig(guildId, ticket_json?.category);
                const welcome = cfg?.welcome_message || null;
                const embed = new EmbedBuilder()
                    .setTitle((welcome && welcome.title) ? welcome.title : (ticket.ticketName || `Ticket #${ticket.ticketId}`))
                    .setDescription((welcome && welcome.description) ? welcome.description : (ticket.ticketDesc || 'A ticket has been opened.'))
                    .setTimestamp();
                const msg = await created.send({ embeds: [embed], components: [actionRow] });
                ticket.messageId = msg.id;
            }

            // Notify configured log channel in guild settings
            try {
                const logChId = guildConfig.ticketconfig?.logchannel || null;
                if (logChId) {
                    const logCh = await guild.channels.fetch(logChId).catch(() => null);
                    if (logCh) {
                        const notifyEmbed = new EmbedBuilder()
                            .setTitle(`New ticket opened — #${ticket.ticketId}`)
                            .setDescription(`Opened by <@${openerId}> in <#${ticket.channelId}>
Category: ${ticket_json?.category || 'General'}`)
                            .setTimestamp();
                        await logCh.send({ embeds: [notifyEmbed] }).catch(() => {});
                    }
                }
            } catch (e) {
                // ignore notify failures
            }

            // persist updated ticket
            const idx = tickets.findIndex(t => Number(t.ticketId) === Number(ticket.ticketId));
            if (idx !== -1) {
                tickets[idx] = ticket;
                await saveTickets(guildId, tickets);
            }

            return { status: "success", ticket, created: { channelId: created.id, messageId: ticket.messageId } };
        } else {
            // cannot access guild; return success but no channel created
            return { status: "success", ticket, createThread: true };
        }
    } catch (err) {
        // channel creation failed; still return ticket but signal no channel
        console.warn('[tickets.service] Channel creation failed:', err?.message || err);
        return { status: "success", ticket, createThread: true };
    }
}

/**
 * Add responses to a nextgen ticket. (This is mainly just for fixing it should things go wrong)
 * - Only allowed if ticket exists and ticket.formresponse is null (responses cannot be edited).
 * - responses must be an object (key -> answer)
 */
async function addResponses(guildId, ticketId, responses = {}) {
    if (!responses || typeof responses !== 'object') {
        return { status: 'error', message: 'Responses must be an object.' };
    }

    const tickets = await getTickets(guildId);
    const idx = tickets.findIndex(t => Number(t.ticketId) === Number(ticketId));
    if (idx === -1) return { status: "error", message: "Ticket not found." };

    const ticket = tickets[idx];

    if (ticket.ticketType !== 'nextgen') {
        return { status: "error", message: "Cannot add responses to legacy ticket." };
    }

    if (ticket.formresponse && Object.keys(ticket.formresponse || {}).length) {
        return { status: "error", message: "Responses already set; editing is not allowed." };
    }

    // attach responses and update lastInteraction
    ticket.formresponse = responses;
    ticket.lastInteraction = {
        timestamp: new Date().toISOString(),
        userId: 'system',
        userName: 'system'
    };

    tickets[idx] = ticket;
    await saveTickets(guildId, tickets);

    return { status: "success", ticket };
}

async function updticket(guildId, ticketId, updates) {
    let tickets = await getTickets(guildId);
    const idx = tickets.findIndex(t => Number(t.ticketId) === Number(ticketId));
    if (idx === -1) return { status: "error", message: "Ticket not found." };
    // avoid allowing formresponse edits via generic update
    if (updates && updates.formresponse !== undefined) delete updates.formresponse;
    tickets[idx] = { ...tickets[idx], ...updates, lastInteraction: { timestamp: new Date().toISOString() } };
    await saveTickets(guildId, tickets);
    return { status: "success", ticket: tickets[idx] };
}

async function getticket(guildId, ticketId) {
    const tickets = await getTickets(guildId);
    const ticket = tickets.find(t => Number(t.ticketId) === Number(ticketId));
    return ticket || null;
}

async function deleteticket(guildId, ticketId) {
    let tickets = await getTickets(guildId);
    tickets = tickets.filter(t => Number(t.ticketId) !== Number(ticketId));
    await saveTickets(guildId, tickets);
    return { status: "success" };
}

async function closeticket(guildId, ticketId) {
    // mark closed
    const tup = await updticket(guildId, ticketId, { status: 'closed', closedAt: new Date().toISOString() });
    try {
        const ticket = tup.ticket || null;
        if (!ticket || !ticket.channelId) return tup;
        const guild = Client.guilds.cache.get(guildId) || await Client.guilds.fetch(guildId);
        if (!guild) return tup;

        const channel = await guild.channels.fetch(ticket.channelId).catch(() => null);
        if (!channel) return tup;

        const guildConfig = await getGuildConfig(guildId) || {};
        const closedCategory = guildConfig.ticketconfig?.closed_category || null;

        // rename to closed-<id>
        try {
            await channel.setName(`closed-${ticket.ticketId}`);
        } catch (e) { 
            return "An Error Occured"
        }

        // move to closed_category if present
        if (closedCategory) {
            try {
                await channel.setParent(closedCategory, { lockPermissions: false });
            } catch (e) { 
                return "An Error Occured"
             }
        }

        // remove opener overwrite
        try {
            await channel.permissionOverwrites.delete(ticket.openedBy).catch(() => {});
        } catch (e) {}

    } catch (err) {
        console.warn('[tickets.service] closeticket post-processing error:', err?.message || err);
    }
    return tup;
}

async function cleanupClosedTickets(guildId) {
    let tickets = await getTickets(guildId);
    const now = Date.now();
    const threeWeeksMs = 21 * 24 * 60 * 60 * 1000;
    const filtered = tickets.filter(t => !(t.status === 'closed' && t.closedAt && (now - new Date(t.closedAt).getTime()) > threeWeeksMs));
    if (filtered.length !== tickets.length) {
        await saveTickets(guildId, filtered);
    }
}

module.exports = {
    newticket,
    addResponses,
    updticket,
    getticket,
    deleteticket,
    closeticket,
    getTickets,
    cleanupClosedTickets,
    findTicketConfig
};