// TrelloHandling.js
// Receives a raw Trello webhook payload (as a JSON CLI argument from the API),
// routes it to the appropriate event handler in Events/, builds the embed data,
// and spawns RemoteEvents.js to deliver it to the Discord webhook.

const path = require('path');
const { spawn } = require('child_process');

const { handleCardUpdated }             = require('./Events/CardUpdated');
const { handleCardDateUpdated }         = require('./Events/CardDateUpdated');
const { handleCardLabelUpdated }        = require('./Events/CardLabelUpdated');
const { handleCardMemberUpdated }       = require('./Events/CardMemberUpdated');
const { handleBoardMembersUpdated }     = require('./Events/BoardMembersUpdated');
const { handleCardLabelsUpdated }           = require('./Events/CardLabelsUpdated');
const { handleCardAttachmentUpdated }   = require('./Events/CardAttachmentUpdated');
const { handleCardChecklistUpdated }    = require('./Events/CardChecklistUpdated');
const { handleCardCommentUpdated }      = require('./Events/CardCommentUpdated');

// Shared embed colors
const { COLORS } = require('./constants');

/**
 * Builds a Discord embed from event handler output.
 * @param {{ title: string, description: string, member: object, board: object, color?: number }} eventData
 * @returns {object} Discord embed object
 */
function buildEmbed({ title, description, member, board, color }) {
    return {
        type: 'rich',
        title,
        description,
        author: {
            name: `Trello: ${board.name || 'Unknown Board'}`,
            url: board.shortLink
                ? `https://trello.com/b/${board.shortLink}?utm_source=Nirmini%20Nova`
                : 'https://trello.com',
            icon_url: 'https://get.snaz.in/6WGgyu8.png',
        },
        footer: {
            text: 'Nova',
            icon_url: 'https://nirmini.dev/imgs/Nova/v4/Nightsmith-V3Logo-Dev.png',
        },
        color: color ?? COLORS.DEFAULT,
        timestamp: new Date().toISOString(),
        thumbnail: member.avatarUrl
            ? { url: `${member.avatarUrl}/170.png` }
            : undefined,
    };
}

/**
 * Routes a Trello webhook payload to the correct event handler.
 * Returns a Discord embed object, or null if the event is not handled.
 * @param {object} payload - The parsed Trello webhook payload
 * @returns {object|null}
 */
function handleTrelloEvent(payload) {
    const type = payload?.action?.type;
    const old = payload?.action?.data?.old || {};

    // updateCard dispatches to sub-handlers based on what changed
    if (type === 'updateCard') {
        if (old.due !== undefined) {
            const data = handleCardDateUpdated(payload);
            if (data) return buildEmbed(data);
        }

        const data = handleCardUpdated(payload);
        if (data) return buildEmbed(data);

        return null;
    }

    const handlers = [
        handleCardUpdated,
        handleCardLabelUpdated,
        handleCardMemberUpdated,
        handleBoardMembersUpdated,
        handleCardLabelsUpdated,
        handleCardAttachmentUpdated,
        handleCardChecklistUpdated,
        handleCardCommentUpdated,
    ];

    for (const handler of handlers) {
        const data = handler(payload);
        if (data) return buildEmbed(data);
    }

    return null;
}

// --- CLI entry point ---
// Spawned by APIApp.js with the raw Trello payload JSON as the first argument.
if (require.main === module) {
    (async () => {
        try {
            const rawPayload = process.argv[2];
            if (!rawPayload) throw new Error('Missing Trello payload argument');

            const payload = JSON.parse(rawPayload);
            const type = payload?.action?.type || 'unknownAction';

            const embed = handleTrelloEvent(payload);

            if (!embed) {
                console.log(`[TrelloHandling] Ignored Trello event: ${type}`);
                process.exit(0);
            }

            console.log(`[TrelloHandling] Dispatching event: ${type}`);

            // Spawn RemoteEvents.js with the built embed
            const child = spawn('node', [
                path.resolve(__dirname, 'RemoteEvents.js'),
                JSON.stringify(embed),
            ]);

            child.stdout.on('data', (d) => console.log(`[RemoteEvents] ${d.toString().trim()}`));
            child.stderr.on('data', (d) => console.error(`[RemoteEvents ERR] ${d.toString().trim()}`));

            child.on('close', (code) => {
                console.log(`[TrelloHandling] RemoteEvents exited with code ${code}`);
                process.exit(code ?? 0);
            });
        } catch (err) {
            console.error('[TrelloHandling] Error:', err);
            process.exit(1);
        }
    })();
}

module.exports = { handleTrelloEvent, buildEmbed, COLORS };