const client = require('../core/global/Client.js');

/*
Activity Codes
1: Listening
2: Watching
3: Playing
4: Streaming
*/

const NovaStatusMsgs = [
    { type: 3, msg: "Blackjack with Dyno" },
    { type: 3, msg: "Poker with Guardsman" }, 
    { type: 3, msg: "Baccarat with Bloxlink" },
    { type: 3, msg: "Go Fish with Kronos" },
    { type: 2, msg: () => `${client.guilds.cache.size} Communities` },
    { type: 2, msg: "your server" },
    { type: 1, msg: "to your suggestions"},
    { type: 3, msg: "Half-Life 2" },
    { type: 3, msg: "Portal 2" }
];

module.exports = NovaStatusMsgs;