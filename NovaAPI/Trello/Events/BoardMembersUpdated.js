// Board Member Added, Removed, or Role Changed
// Handles action types: addMemberToBoard, removeMemberFromBoard, makeAdminOfBoard, makeNormalMemberOfBoard

const { COLORS } = require('../constants');

/**
 * @param {object} payload - The full Trello webhook payload
 * @returns {{ title: string, description: string, member: object, board: object, color: number } | null}
 */
function handleBoardMembersUpdated(payload) {
    const action = payload.action || {};
    const member = action.memberCreator || {};
    const board = action.data?.board || {};
    const addedMember = action.data?.member || {};
    const type = action.type;

    const supported = [
        'addMemberToBoard',
        'removeMemberFromBoard',
        'makeAdminOfBoard',
        'makeNormalMemberOfBoard',
    ];
    if (!supported.includes(type)) return null;

    const boardLink = board.shortLink
        ? `[${board.name}](https://trello.com/b/${board.shortLink})`
        : board.name;

    let title = '';
    let color = COLORS.EDIT;
    const description = `**Board:** ${boardLink}\n**Member:** ${addedMember.fullName}`;

    if (type === 'addMemberToBoard') {
        color = COLORS.ADD;
        title = `${member.fullName} added ${addedMember.fullName} to the board`;
    } else if (type === 'removeMemberFromBoard') {
        color = COLORS.REMOVE;
        title = `${member.fullName} removed ${addedMember.fullName} from the board`;
    } else if (type === 'makeAdminOfBoard') {
        title = `${member.fullName} made ${addedMember.fullName} an admin of the board`;
    } else if (type === 'makeNormalMemberOfBoard') {
        title = `${member.fullName} changed ${addedMember.fullName} to a normal member`;
    }

    return { title, description, member, board, color };
}

module.exports = { handleBoardMembersUpdated };