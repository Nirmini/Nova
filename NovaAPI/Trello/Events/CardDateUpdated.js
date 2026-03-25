// Card Due Date Added, Changed, or Removed
// Handles action type: updateCard (when old.due is present)

const { COLORS } = require('../constants');

/**
 * @param {object} payload - The full Trello webhook payload
 * @returns {{ title: string, description: string, member: object, board: object, color: number } | null}
 */
function handleCardDateUpdated(payload) {
    const action = payload.action || {};
    const member = action.memberCreator || {};
    const board = action.data?.board || {};
    const card = action.data?.card || {};
    const list = action.data?.list || {};
    const old = action.data?.old || {};
    const type = action.type;

    if (type !== 'updateCard' || old.due === undefined) return null;

    const cardLink = card.shortLink
        ? `[${card.name}](https://trello.com/c/${card.shortLink})`
        : card.name;

    const newDue = card.due ? new Date(card.due).toUTCString() : null;
    const oldDue = old.due ? new Date(old.due).toUTCString() : null;

    let title = '';
    let description = `**Card:** ${cardLink}`;
    let color;

    if (!old.due && card.due) {
        color = COLORS.ADD;
        title = `${member.fullName} set a due date on "${card.name}"`;
        description += `\n**Due:** ${newDue}`;
    } else if (old.due && !card.due) {
        color = COLORS.REMOVE;
        title = `${member.fullName} removed the due date on "${card.name}"`;
        description += `\n**Was Due:** ${oldDue}`;
    } else {
        color = COLORS.EDIT;
        title = `${member.fullName} changed the due date on "${card.name}"`;
        description += `\n**Old Due:** ${oldDue}\n**New Due:** ${newDue}`;
    }

    if (list.name) description += `\n**List:** ${list.name}`;

    return { title, description, member, board, color };
}

module.exports = { handleCardDateUpdated };