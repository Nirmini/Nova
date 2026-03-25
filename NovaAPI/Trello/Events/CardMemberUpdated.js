// Card Member Added or Removed
// Handles action types: addMemberToCard, removeMemberFromCard

const { COLORS } = require('../constants');

/**
 * @param {object} payload - The full Trello webhook payload
 * @returns {{ title: string, description: string, member: object, board: object, color: number } | null}
 */
function handleCardMemberUpdated(payload) {
    const action = payload.action || {};
    const member = action.memberCreator || {};
    const board = action.data?.board || {};
    const card = action.data?.card || {};
    const addedMember = action.data?.member || {};
    const type = action.type;

    if (type !== 'addMemberToCard' && type !== 'removeMemberFromCard') return null;

    const cardLink = card.shortLink
        ? `[${card.name}](https://trello.com/c/${card.shortLink})`
        : card.name;

    const verb = type === 'addMemberToCard' ? 'added' : 'removed';
    const preposition = verb === 'added' ? 'to' : 'from';
    const color = type === 'addMemberToCard' ? COLORS.ADD : COLORS.REMOVE;
    const isSelf = member.id === addedMember.id;

    const title = isSelf
        ? `${member.fullName} ${verb} themselves ${preposition} "${card.name}"`
        : `${member.fullName} ${verb} ${addedMember.fullName} ${preposition} "${card.name}"`;

    const description = `**Card:** ${cardLink}\n**Member:** ${addedMember.fullName}`;

    return { title, description, member, board, color };
}

module.exports = { handleCardMemberUpdated };