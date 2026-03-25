// Card Label Added or Removed
// Handles action types: addLabelToCard, removeLabelFromCard

const { prettifyColor } = require('./utils');
const { COLORS } = require('../constants');

/**
 * @param {object} payload - The full Trello webhook payload
 * @returns {{ title: string, description: string, member: object, board: object, color: number } | null}
 */
function handleCardLabelUpdated(payload) {
    const action = payload.action || {};
    const member = action.memberCreator || {};
    const board = action.data?.board || {};
    const card = action.data?.card || {};
    const label = action.data?.label || {};
    const type = action.type;

    if (type !== 'addLabelToCard' && type !== 'removeLabelFromCard') return null;

    const cardLink = card.shortLink
        ? `[${card.name}](https://trello.com/c/${card.shortLink})`
        : card.name;

    const verb = type === 'addLabelToCard' ? 'added' : 'removed';
    const color = type === 'addLabelToCard' ? COLORS.ADD : COLORS.REMOVE;
    const labelName = label.name || prettifyColor(label.color);
    const title = `${member.fullName} ${verb} label "${labelName}" ${verb === 'added' ? 'to' : 'from'} "${card.name}"`;
    const description = `**Card:** ${cardLink}\n**Label:** ${labelName} (${prettifyColor(label.color)})`;

    return { title, description, member, board, color };
}

module.exports = { handleCardLabelUpdated };