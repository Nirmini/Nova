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
    { type: 2, msg: "your games for exploiters" },
    { type: 3, msg: "Half-Life 2" },
    { type: 3, msg: "HSRF v2.8.11" },
    { type: 3, msg: "Portal 2" },
    { type: 2, msg: "for Cheaters" }
];

module.exports = NovaStatusMsgs;