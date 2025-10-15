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

/**
 * NOTE: ticket storage format (new format)
 * {
 *   ticketId: 1,
 *   openedAt: ISOString,
 *   openedBy: "userid",
 *   lastInteraction: { timestamp, userId, userName },
 *   ticketName: "...",
 *   ticketDesc: "...",
 *   usersInvolved: [{ uid, perms }],
 *   ticketType: "legacy" | "nextgen",
 *   formresponse: { ... } || null,
 *   channelId: "0",
 *   messageId: "0",
 *   status: "open" | "closed",
 *   createdAt: ISOString
 * }
 */

/**
 * Utility: Get all tickets for a guild
 */
async function getTickets(guildId) {
    const tickets = await getGuildData(guildId, 'ticketdata.tickets');
    return Array.isArray(tickets) ? tickets : [];
}

/**
 * Utility: Save all tickets for a guild
 */
async function saveTickets(guildId, tickets) {
    await setGuildData(guildId, 'ticketdata.tickets', tickets);
}

/**
 * Allocate next numeric ticketId for a guild (keeps numeric sequence)
 */
function nextNumericTicketId(tickets) {
    if (!Array.isArray(tickets) || tickets.length === 0) return 1;
    const max = tickets.reduce((m, t) => Math.max(m, Number(t.ticketId) || 0), 0);
    return max + 1;
}

/**
 * Create a new Nova Ticket (Legacy or NextGen)
 * Responses (formresponse) may be provided for nextgen but can also be added later via addResponses().
 * Returns object { status, ticket } or { status: "error", message }
 */
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

    return { status: "success", ticket };
}

/**
 * Add responses to a nextgen ticket.
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

/**
 * Edit a ticket by ID (keeps compatibility). Avoid editing formresponse here.
 */
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

/**
 * Fetch a ticket by ID
 */
async function getticket(guildId, ticketId) {
    const tickets = await getTickets(guildId);
    const ticket = tickets.find(t => Number(t.ticketId) === Number(ticketId));
    return ticket || null;
}

/**
 * Delete a ticket by ID
 */
async function deleteticket(guildId, ticketId) {
    let tickets = await getTickets(guildId);
    tickets = tickets.filter(t => Number(t.ticketId) !== Number(ticketId));
    await saveTickets(guildId, tickets);
    return { status: "success" };
}

/**
 * Mark ticket as closed and schedule deletion after 3 weeks
 */
async function closeticket(guildId, ticketId) {
    const ticket = await updticket(guildId, ticketId, { status: 'closed', closedAt: new Date().toISOString() });
    return ticket;
}

/**
 * Cleanup closed tickets older than 3 weeks
 */
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
    cleanupClosedTickets
};