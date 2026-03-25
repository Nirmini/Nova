// Card Comment Added, Edited, or Deleted
// Handles action types: commentCard, updateComment, deleteComment

const { COLORS } = require('../constants');

const MAX_COMMENT_LENGTH = 300;

/**
 * Truncates a comment for display.
 * @param {string} text
 * @returns {string}
 */
function truncateComment(text) {
    if (!text) return '';
    return text.length > MAX_COMMENT_LENGTH
        ? `${text.slice(0, MAX_COMMENT_LENGTH)}…`
        : text;
}

/**
 * @param {object} payload - The full Trello webhook payload
 * @returns {{ title: string, description: string, member: object, board: object, color: number } | null}
 */
function handleCardCommentUpdated(payload) {
    const action = payload.action || {};
    const member = action.memberCreator || {};
    const board = action.data?.board || {};
    const card = action.data?.card || {};
    const text = action.data?.text || '';
    const type = action.type;

    if (
        type !== 'commentCard' &&
        type !== 'updateComment' &&
        type !== 'deleteComment'
    ) return null;

    const cardLink = card.shortLink
        ? `[${card.name}](https://trello.com/c/${card.shortLink})`
        : card.name;

    let title = '';
    let description = `**Card:** ${cardLink}`;
    let color = COLORS.EDIT;

    if (type === 'commentCard') {
        color = COLORS.COMMENT;
        title = `${member.fullName} commented on "${card.name}"`;
        if (text) description += `\n**Comment:** ${truncateComment(text)}`;
    } else if (type === 'updateComment') {
        title = `${member.fullName} edited a comment on "${card.name}"`;
        if (text) description += `\n**Comment:** ${truncateComment(text)}`;
    } else if (type === 'deleteComment') {
        color = COLORS.REMOVE;
        title = `${member.fullName} deleted a comment on "${card.name}"`;
    }

    return { title, description, member, board, color };
}

module.exports = { handleCardCommentUpdated };