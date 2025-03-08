// Torture :3
const commandIdMap = {
    "650011": { name: "?ban", category: "altcommands", subcommands: null },
    "869825": { name: "?commands", category: "altcommands", subcommands: null },//
    "527694": { name: "?credits", category: "altcommands", subcommands: null },
    "717849": { name: "?debug", category: "altcommands", subcommands: null },
    "719221": { name: "?dice", category: "altcommands", subcommands: null },
    "818710": { name: "?github", category: "altcommands", subcommands: null },
    "725283": { name: "?kick", category: "altcommands", subcommands: null },
    "598818": { name: "?mute", category: "altcommands", subcommands: null },
    "647539": { name: "?ping", category: "altcommands", subcommands: null },
    "539068": { name: "?purge", category: "altcommands", subcommands: null },
    "836592": { name: "?lock", category: "altcommands", subcommands: null },
    "836593": { name: "?unlock", category: "altcommands", subcommands: null },
    "978116": { name: "?version", category: "altcommands", subcommands: null },
    "936749": { name: "?warn", category: "altcommands", subcommands: null },
    "947326": { name: "?birthday", category: "altcommands", subcommands: null },

    "482716": { name: "/embed", category: "admin", subcommands: null },
    "735921": { name: "/format", category: "admin", subcommands: null },
    "947382": { name: "/join", category: "admin", subcommands: null },
    "947383": { name: "/leave", category: "admin", subcommands: null },
    "381502": { name: "/maint", category: "admin", subcommands: null },
    "387645": { name: "/msg", category: "admin", subcommands: null },
    "244118": { name: "/sysmsg", category: "admin", subcommands: null },

    "454475": { name: "/anommsg", category: "core", subcommands: {1:"send",2:"track",3:"ban"} },
    "333781": { name: "/birthday", category: "core", subcommands: {1:"set",2:"update",3:"remove"} },
    "546290": { name: "/bug", category: "core", subcommands: null },
    "489322": { name: "/commit", category: "core", subcommands: null },
    "876459": { name: "/credits", category: "core", subcommands: null },
    "285719": { name: "/diagnose", category: "core", subcommands: null },
    "860823": { name: "/serverinfo", category: "core", subcommands: null },
    "692226": { name: "/help", category: "core", subcommands: null },
    "159245": { name: "/info", category: "core", subcommands: null },
    "989703": { name: "/members", category: "core", subcommands: null },
    "881307": { name: "/modules", category: "core", subcommands: null },
    "413285": { name: "/ping", category: "core", subcommands: null },
    "258051": { name: "/premium", category: "core", subcommands: null },
    "306341": { name: "/remind", category: "core", subcommands: null },
    "410039": { name: "/report", category: "core", subcommands: null },
    "640130": { name: "/setup", category: "core", subcommands: {1:"roles",2:"channels"} },
    "080832": { name: "/sponser", category: "core", subcommands: null },
    "025486": { name: "/status", category: "core", subcommands: null },
    "143969": { name: "/updates", category: "core", subcommands: null },
    "255223": { name: "/wiki", category: "core", subcommands: null },

    "042585": { name: "/eval", category: "event", subcommands: null },
    "763760": { name: "/seval", category: "event", subcommands: null },
    "303076": { name: "/stryout", category: "event", subcommands: null },
    "247163": { name: "/tryout", category: "event", subcommands: null },

    "399112": { name: "/cat", category: "fun", subcommands: null },
    "575518": { name: "/coin", category: "fun", subcommands: null },
    "288538": { name: "/dice", category: "fun", subcommands: null },
    "958930": { name: "/dog", category: "fun", subcommands: null },
    "414315": { name: "/mcstats", category: "fun", subcommands: null },
    "921303": { name: "/robloxstats", category: "fun", subcommands: null },
    "498186": { name: "/rps", category: "fun", subcommands: null },

    "861851": { name: "/afk", category: "misc", subcommands: {1:"set",2:"return",3:"remove"} },
    "343884": { name: "/announce", category: "misc", subcommands: null },
    "704798": { name: "/github", category: "misc", subcommands: null },
    "657524": { name: "/itunes", category: "misc", subcommands: null },
    "621784": { name: "/nick", category: "misc", subcommands: null },
    "891803": { name: "/purge", category: "misc", subcommands: null },
    "457562": { name: "/roleinfo", category: "misc", subcommands: null },
    "387489": { name: "/roles", category: "misc", subcommands: null },
    "904576": { name: "/spotify", category: "misc", subcommands: null },
    "911899": { name: "/uptime", category: "misc", subcommands: null },
    "723849": { name: "/vexstats", category: "misc", subcommands: {1:"team",2:"awards"} },
    "905507": { name: "/whois", category: "misc", subcommands: null },
    "353193": { name: "/yt", category: "misc", subcommands: null },

    "975089": { name: "/ban", category: "moderation", subcommands: null },
    "332759": { name: "/case", category: "moderation", subcommands: {1:"create",2:"assign",3:"close",4:"info"} },
    "819561": { name: "/deafen", category: "moderation", subcommands: {1:"add",2:"remove"} },
    "659812": { name: "/delwarn", category: "moderation", subcommands: null },
    "673834": { name: "/lock", category: "moderation", subcommands: null },
    "739556": { name: "/lockdown", category: "moderation", subcommands: null },
    "072073": { name: "/masslock", category: "moderation", subcommands: null },
    "361152": { name: "/massunlock", category: "moderation", subcommands: null },
    "902911": { name: "/mod", category: "moderation", subcommands: {1:"logs",2:"stats",3:"actions"} },
    "076204": { name: "/modstaff", category: "moderation", subcommands: {1:"ls",2:"add",3:"remove"} },
    "106323": { name: "/move", category: "moderation", subcommands: null },
    "725600": { name: "/mute", category: "moderation", subcommands: null },
    "465805": { name: "/note", category: "moderation", subcommands: {1:"add",2:"remove"} },
    "126481": { name: "/role", category: "moderation", subcommands: {1:"add",2:"edit",3:"remove"} },
    "840885": { name: "/sban", category: "moderation", subcommands: null },
    "235902": { name: "/smode", category: "moderation", subcommands: null },
    "033246": { name: "/snick", category: "moderation", subcommands: null },
    "013696": { name: "/tban", category: "moderation", subcommands: null },
    "094274": { name: "/ticket", category: "moderation", subcommands: {1:"open",2:"assign",3:"close"} },
    "583689": { name: "/ticketpanel", category: "moderation", subcommands: null },
    "403000": { name: "/unban", category: "moderation", subcommands: null },
    "323282": { name: "/unlock", category: "moderation", subcommands: null },
    "161901": { name: "/warn", category: "moderation", subcommands: null },
    "374027": { name: "/warnings", category: "moderation", subcommands: null },

    "321307": { name: "/autopurge", category: "premium", subcommands: null },
    "251908": { name: "/warnings", category: "premium", subcommands: null },

    "469589": { name: "/rblx", category: "roblox", subcommands: {1:"warn",2:"ban"} },

    "369009": { name: "/pinrole", category: "usermgmnt", subcommands: null },
    "761307": { name: "/rank", category: "usermgmnt", subcommands: {1:"add",2:"remove"} },
    "141035": { name: "/rankmanage", category: "usermgmnt", subcommands: {1:"add",2:"remove"} },
    "439092": { name: "/ranks", category: "usermgmnt", subcommands: null },
    "509674": { name: "/temprole", category: "usermgmnt", subcommands: null },
    "624766": { name: "/unpinrole", category: "usermgmnt", subcommands: null },
    "688368": { name: "/verify", category: "usermgmnt", subcommands: null },
};
function convertCommandId(commandId) {
    if (typeof commandId !== "string" || commandId.length < 6 || commandId.length > 7) {
        return "Invalid Command ID";
    }

    const uniquePart = commandId.slice(-6); // Extract last 6 digits

    if (!commandIdMap[uniquePart]) {
        return `Unknown Command (${commandId})`;
    }

    const { name, category, subcommands } = commandIdMap[uniquePart];

    return category ? `${name} ${category} ${subcommands}` : name;
}

// Example usage:
console.log(convertCommandId("761307"));
console.log(convertCommandId("251908"));

module.exports = {
    convertCommandId
};

// I asssure you I'm not crazy after doing this for an hour straight - Frost :3