// Board Label Created, Updated, or Deleted
// Handles action types: createLabel, updateLabel, deleteLabel

const { prettifyColor } = require('./utils');
const { COLORS } = require('../constants');

/**
 * @param {object} payload - The full Trello webhook payload
 * @returns {{ title: string, description: string, member: object, board: object, color: number } | null}
 */
function handleCardLabelsUpdated(payload) {
    const action = payload.action || {};
    const member = action.memberCreator || {};
    const board = action.data?.board || {};
    const label = action.data?.label || {};
    const old = action.data?.old || {};
    const type = action.type;

    if (type !== 'createLabel' && type !== 'updateLabel' && type !== 'deleteLabel') return null;

    const labelName = label.name || prettifyColor(label.color);
    let title = '';
    let description = `**Label:** ${labelName}`;
    let color = COLORS.EDIT;

    if (type === 'createLabel') {
        color = COLORS.ADD;
        title = `${member.fullName} created label "${labelName}"`;
        description += `\n**Color:** ${prettifyColor(label.color)}`;
    } else if (type === 'deleteLabel') {
        color = COLORS.REMOVE;
        title = `${member.fullName} deleted label "${labelName}"`;
        description += `\n**Color:** ${prettifyColor(label.color)}`;
    } else if (type === 'updateLabel') {
        if (old.name !== undefined) {
            title = `${member.fullName} renamed label "${old.name}" to "${label.name}"`;
            description = `**Old Name:** ${old.name}\n**New Name:** ${label.name}`;
        } else if (old.color !== undefined) {
            title = `${member.fullName} recolored label "${labelName}"`;
            description = `**Label:** ${labelName}\n**Old Color:** ${prettifyColor(old.color)}\n**New Color:** ${prettifyColor(label.color)}`;
        } else {
            title = `${member.fullName} updated label "${labelName}"`;
        }
    }

    return { title, description, member, board, color };
}

module.exports = { handleCardLabelsUpdated };