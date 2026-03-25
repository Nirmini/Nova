// Card Attachment Added, Updated, or Deleted
// Handles action types: addAttachmentToCard, updateAttachment, deleteAttachmentFromCard

const { COLORS } = require('../constants');

/**
 * @param {object} payload - The full Trello webhook payload
 * @returns {{ title: string, description: string, member: object, board: object, color: number } | null}
 */
function handleCardAttachmentUpdated(payload) {
    const action = payload.action || {};
    const member = action.memberCreator || {};
    const board = action.data?.board || {};
    const card = action.data?.card || {};
    const attachment = action.data?.attachment || {};
    const old = action.data?.old || {};
    const type = action.type;

    if (
        type !== 'addAttachmentToCard' &&
        type !== 'updateAttachment' &&
        type !== 'deleteAttachmentFromCard'
    ) return null;

    const cardLink = card.shortLink
        ? `[${card.name}](https://trello.com/c/${card.shortLink})`
        : card.name;

    let title = '';
    let description = `**Card:** ${cardLink}`;
    let color = COLORS.EDIT;

    if (type === 'addAttachmentToCard') {
        color = COLORS.ADD;
        title = `${member.fullName} added an attachment to "${card.name}"`;
        const attachLabel = attachment.url
            ? `[${attachment.name}](${attachment.url})`
            : attachment.name;
        description += `\n**Attachment:** ${attachLabel}`;
    } else if (type === 'deleteAttachmentFromCard') {
        color = COLORS.REMOVE;
        title = `${member.fullName} removed attachment "${attachment.name}" from "${card.name}"`;
        description += `\n**Attachment:** ${attachment.name}`;
    } else if (type === 'updateAttachment') {
        if (old.name !== undefined) {
            title = `${member.fullName} renamed an attachment on "${card.name}"`;
            description += `\n**Old Name:** ${old.name}\n**New Name:** ${attachment.name}`;
        } else {
            title = `${member.fullName} updated an attachment on "${card.name}"`;
            description += `\n**Attachment:** ${attachment.name}`;
        }
    }

    return { title, description, member, board, color };
}

module.exports = { handleCardAttachmentUpdated };