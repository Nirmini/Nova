// Card Checklist Added, Renamed, Removed, Converted to Card
// Card Checklist Item Added, Renamed, Removed, Completed/Uncompleted
// Handles action types:
//   addChecklistToCard, removeChecklistFromCard, updateChecklist,
//   createCheckItem, deleteCheckItem, updateCheckItem, convertToCardFromCheckItem

const { COLORS } = require('../constants');

/**
 * @param {object} payload - The full Trello webhook payload
 * @returns {{ title: string, description: string, member: object, board: object, color: number } | null}
 */
function handleCardChecklistUpdated(payload) {
    const action = payload.action || {};
    const member = action.memberCreator || {};
    const board = action.data?.board || {};
    const card = action.data?.card || {};
    const checklist = action.data?.checklist || {};
    const checkItem = action.data?.checkItem || {};
    const old = action.data?.old || {};
    const type = action.type;

    const supported = [
        'addChecklistToCard',
        'removeChecklistFromCard',
        'updateChecklist',
        'createCheckItem',
        'deleteCheckItem',
        'updateCheckItem',
        'convertToCardFromCheckItem',
    ];
    if (!supported.includes(type)) return null;

    const cardLink = card.shortLink
        ? `[${card.name}](https://trello.com/c/${card.shortLink})`
        : card.name;

    let title = '';
    let description = `**Card:** ${cardLink}`;
    let color = COLORS.EDIT;

    if (type === 'addChecklistToCard') {
        color = COLORS.ADD;
        title = `${member.fullName} added checklist "${checklist.name}" to "${card.name}"`;
        description += `\n**Checklist:** ${checklist.name}`;
    } else if (type === 'removeChecklistFromCard') {
        color = COLORS.REMOVE;
        title = `${member.fullName} removed checklist "${checklist.name}" from "${card.name}"`;
        description += `\n**Checklist:** ${checklist.name}`;
    } else if (type === 'updateChecklist') {
        if (old.name !== undefined) {
            title = `${member.fullName} renamed checklist on "${card.name}"`;
            description += `\n**Old Name:** ${old.name}\n**New Name:** ${checklist.name}`;
        } else {
            title = `${member.fullName} updated checklist "${checklist.name}" on "${card.name}"`;
            description += `\n**Checklist:** ${checklist.name}`;
        }
    } else if (type === 'createCheckItem') {
        color = COLORS.ADD;
        title = `${member.fullName} added item "${checkItem.name}" to checklist "${checklist.name}"`;
        description += `\n**Checklist:** ${checklist.name}\n**Item:** ${checkItem.name}`;
    } else if (type === 'deleteCheckItem') {
        color = COLORS.REMOVE;
        title = `${member.fullName} removed item "${checkItem.name}" from "${checklist.name}"`;
        description += `\n**Checklist:** ${checklist.name}\n**Item:** ${checkItem.name}`;
    } else if (type === 'updateCheckItem') {
        if (old.name !== undefined) {
            title = `${member.fullName} renamed a checklist item in "${checklist.name}"`;
            description += `\n**Checklist:** ${checklist.name}\n**Old Name:** ${old.name}\n**New Name:** ${checkItem.name}`;
        } else if (old.state !== undefined) {
            const completed = checkItem.state === 'complete';
            color = completed ? COLORS.ADD : COLORS.REMOVE;
            title = `${member.fullName} ${completed ? 'completed' : 'marked incomplete'} "${checkItem.name}" in "${checklist.name}"`;
            description += `\n**Checklist:** ${checklist.name}\n**Item:** ${checkItem.name}`;
        } else {
            title = `${member.fullName} updated checklist item "${checkItem.name}"`;
            description += `\n**Checklist:** ${checklist.name}\n**Item:** ${checkItem.name}`;
        }
    } else if (type === 'convertToCardFromCheckItem') {
        color = COLORS.ADD;
        title = `${member.fullName} converted checklist item "${checkItem.name}" to a card`;
        description += `\n**Checklist:** ${checklist.name}\n**Item:** ${checkItem.name}`;
    }

    return { title, description, member, board, color };
}

module.exports = { handleCardChecklistUpdated };