// Card Deleted, Archived, Created, Moved, Renamed
// Handles action types: createCard, deleteCard, updateCard

const { COLORS } = require('../constants');

/**
 * @param {object} payload - The full Trello webhook payload
 * @returns {{ title: string, description: string, member: object, board: object, color: number } | null}
 */
function handleCardUpdated(payload) {
    const action = payload.action || {};
    const member = action.memberCreator || {};
    const board = action.data?.board || {};
    const card = action.data?.card || {};
    const list = action.data?.list || {};
    const listBefore = action.data?.listBefore || {};
    const listAfter = action.data?.listAfter || {};
    const old = action.data?.old || {};
    const type = action.type;

    let title = '';
    let description = '';
    let color = COLORS.EDIT;

    const cardLink = card.shortLink
        ? `[${card.name}](https://trello.com/c/${card.shortLink})`
        : card.name;

    if (type === 'deleteCard') {
        color = COLORS.REMOVE;
        title = `${member.fullName} deleted card`;
        description = `**Card ID:** ${card.id}`;
        if (list.name) description += `\n**List:** ${list.name}`;
    } else if (type === 'createCard') {
        color = COLORS.ADD;
        title = `${member.fullName} created card "${card.name}"`;
        description = `**Card:** ${cardLink}`;
        if (list.name) description += `\n**List:** ${list.name}`;
    } else if (type === 'updateCard') {
        if (old.name !== undefined) {
            // Renamed
            title = `${member.fullName} renamed card "${old.name}"`;
            description = `Changed **${old.name}** to **${card.name}**`;
            if (list.name) description += `\n**List:** ${list.name}`;
        } else if (listBefore.name) {
            // Moved between lists
            title = `${member.fullName} moved card "${card.name}" to ${listAfter.name}`;
            description = `Moved from **${listBefore.name}** to **${listAfter.name}**`;
        } else if (old.closed !== undefined) {
            // Archived or unarchived
            const verb = card.closed ? 'archived' : 'unarchived';
            color = card.closed ? COLORS.REMOVE : COLORS.ADD;
            title = `${member.fullName} ${verb} card "${card.name}"`;
            description = `**Card:** ${cardLink}`;
            if (list.name) description += `\n**List:** ${list.name}`;
        } else {
            // Generic card update — not handled by this event handler
            return null;
        }
    } else {
        return null;
    }

    return { title, description, member, board, color };
}

module.exports = { handleCardUpdated };