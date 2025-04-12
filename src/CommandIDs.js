// Command data /\\\/ Tourture Map :3
const commands = [
    { id: "650011", name: "?ban", category: "altcommands", subcommands: null },
    { id: "869825", name: "?commands", category: "altcommands", subcommands: null },
    { id: "527694", name: "?credits", category: "altcommands", subcommands: null },
    { id: "717849", name: "?debug", category: "altcommands", subcommands: null },
    { id: "719221", name: "?dice", category: "altcommands", subcommands: null },
    { id: "818710", name: "?github", category: "altcommands", subcommands: null },
    { id: "725283", name: "?kick", category: "altcommands", subcommands: null },
    { id: "598818", name: "?mute", category: "altcommands", subcommands: null },
    { id: "647539", name: "?ping", category: "altcommands", subcommands: null },
    { id: "539068", name: "?purge", category: "altcommands", subcommands: null },
    { id: "836592", name: "?lock", category: "altcommands", subcommands: null },
    { id: "836593", name: "?unlock", category: "altcommands", subcommands: null },
    { id: "978116", name: "?version", category: "altcommands", subcommands: null },
    { id: "936749", name: "?warn", category: "altcommands", subcommands: null },
    { id: "947326", name: "?birthday", category: "altcommands", subcommands: null },
    { id: "284795", name: "$debugstats", category: "admin", subcommands: null },
    { id: "264795", name: "$remoteconfig", category: "admin", subcommands: null },
    { id: "482716", name: "/embed", category: "admin", subcommands: null },
    { id: "735921", name: "/format", category: "admin", subcommands: null },
    { id: "947382", name: "/join", category: "admin", subcommands: null },
    { id: "947383", name: "/leave", category: "admin", subcommands: null },
    { id: "381502", name: "/maint", category: "admin", subcommands: null },
    { id: "000001", name: "/test", category: "admin", subcommands: null },
    { id: "387645", name: "/msg", category: "admin", subcommands: null },
    { id: "244118", name: "/sysmsg", category: "admin", subcommands: null },
    { id: "454475", name: "/anommsg", category: "core", subcommands: { 1: "send", 2: "track", 3: "ban" } },
    { id: "333781", name: "/birthday", category: "core", subcommands: { 1: "set", 2: "update", 3: "remove" } },
    { id: "546290", name: "/bug", category: "core", subcommands: null },
    { id: "489322", name: "/commit", category: "core", subcommands: null },
    { id: "876459", name: "/credits", category: "core", subcommands: null },
    { id: "285719", name: "/diagnose", category: "core", subcommands: null },
    { id: "860823", name: "/serverinfo", category: "core", subcommands: null },
    { id: "692226", name: "/help", category: "core", subcommands: null },
    { id: "159245", name: "/info", category: "core", subcommands: null },
    { id: "989703", name: "/members", category: "core", subcommands: null },
    { id: "881307", name: "/modules", category: "core", subcommands: null },
    { id: "413285", name: "/ping", category: "core", subcommands: null },
    { id: "258051", name: "/premium", category: "core", subcommands: null },
    { id: "306341", name: "/remind", category: "core", subcommands: null },
    { id: "410039", name: "/report", category: "core", subcommands: null },
    { id: "640130", name: "/setup", category: "core", subcommands: { 1: "roles", 2: "channels" } },
    { id: "080832", name: "/sponser", category: "core", subcommands: null },
    { id: "025486", name: "/status", category: "core", subcommands: null },
    { id: "141310", name: "/subscribe", category: "core", subcommands: {1: "updates", 2: "status"} },
    { id: "255223", name: "/wiki", category: "core", subcommands: null },
    { id: "648610", name: "/commands", category: "core", subcommands: { 1: "list", 2: "toggle" } },
    { id: "042585", name: "/eval", category: "event", subcommands: null },
    { id: "763760", name: "/seval", category: "event", subcommands: null },
    { id: "303076", name: "/stryout", category: "event", subcommands: null },
    { id: "247163", name: "/tryout", category: "event", subcommands: null },
    { id: "399112", name: "/cat", category: "fun", subcommands: null },
    { id: "575518", name: "/coin", category: "fun", subcommands: null },
    { id: "288538", name: "/dice", category: "fun", subcommands: null },
    { id: "958930", name: "/dog", category: "fun", subcommands: null },
    { id: "414315", name: "/mcstats", category: "fun", subcommands: null },
    { id: "921303", name: "/robloxstats", category: "fun", subcommands: null },
    { id: "498186", name: "/rps", category: "fun", subcommands: null },
    { id: "861851", name: "/afk", category: "misc", subcommands: { 1: "set", 2: "return", 3: "remove" } },
    { id: "343884", name: "/announce", category: "misc", subcommands: null },
    { id: "704798", name: "/github", category: "misc", subcommands: null },
    { id: "657524", name: "/itunes", category: "misc", subcommands: null },
    { id: "621784", name: "/nick", category: "misc", subcommands: null },
    { id: "891803", name: "/purge", category: "misc", subcommands: null },
    { id: "457562", name: "/roleinfo", category: "misc", subcommands: null },
    { id: "387489", name: "/roles", category: "misc", subcommands: null },
    { id: "904576", name: "/spotify", category: "misc", subcommands: null },
    { id: "911899", name: "/uptime", category: "misc", subcommands: null },
    { id: "723849", name: "/vexstats", category: "misc", subcommands: { 1: "team", 2: "awards" } },
    { id: "905507", name: "/whois", category: "misc", subcommands: null },
    { id: "353193", name: "/yt", category: "misc", subcommands: null },
    { id: "975089", name: "/ban", category: "moderation", subcommands: null },
    { id: "332759", name: "/case", category: "moderation", subcommands: { 1: "create", 2: "assign", 3: "close", 4: "info" } },
    { id: "819561", name: "/deafen", category: "moderation", subcommands: { 1: "add", 2: "remove" } },
    { id: "659812", name: "/delwarn", category: "moderation", subcommands: null },
    { id: "673834", name: "/lock", category: "moderation", subcommands: null },
    { id: "739556", name: "/lockdown", category: "moderation", subcommands: null },
    { id: "072073", name: "/masslock", category: "moderation", subcommands: null },
    { id: "361152", name: "/massunlock", category: "moderation", subcommands: null },
    { id: "902911", name: "/mod", category: "moderation", subcommands: { 1: "logs", 2: "stats", 3: "actions" } },
    { id: "076204", name: "/modstaff", category: "moderation", subcommands: { 1: "ls", 2: "add", 3: "remove" } },
    { id: "106323", name: "/move", category: "moderation", subcommands: null },
    { id: "725600", name: "/mute", category: "moderation", subcommands: null },
    { id: "465805", name: "/note", category: "moderation", subcommands: { 1: "add", 2: "remove" } },
    { id: "126481", name: "/role", category: "moderation", subcommands: { 1: "add", 2: "edit", 3: "remove" } },
    { id: "840885", name: "/sban", category: "moderation", subcommands: null },
    { id: "235902", name: "/smode", category: "moderation", subcommands: null },
    { id: "033246", name: "/snick", category: "moderation", subcommands: null },
    { id: "013696", name: "/tban", category: "moderation", subcommands: null },
    { id: "094274", name: "/ticket", category: "moderation", subcommands: { 1: "open", 2: "assign", 3: "close" } },
    { id: "583689", name: "/ticketpanel", category: "moderation", subcommands: null },
    { id: "403000", name: "/unban", category: "moderation", subcommands: null },
    { id: "323282", name: "/unlock", category: "moderation", subcommands: null },
    { id: "161901", name: "/warn", category: "moderation", subcommands: null },
    { id: "374027", name: "/warnings", category: "moderation", subcommands: null },
    { id: "321307", name: "/autopurge", category: "premium", subcommands: null },
    { id: "251908", name: "/warnings", category: "premium", subcommands: null },
    { id: "469589", name: "/rblx", category: "roblox", subcommands: { 1: "warn", 2: "ban" } },
    { id: "369009", name: "/pinrole", category: "usermgmnt", subcommands: null },
    { id: "761307", name: "/rank", category: "usermgmnt", subcommands: { 1: "add", 2: "remove" } },
    { id: "141035", name: "/rankmanage", category: "usermgmnt", subcommands: { 1: "add", 2: "remove" } },
    { id: "439092", name: "/ranks", category: "usermgmnt", subcommands: null },
    { id: "509674", name: "/temprole", category: "usermgmnt", subcommands: null },
    { id: "624766", name: "/unpinrole", category: "usermgmnt", subcommands: null },
    { id: "688368", name: "/verify", category: "usermgmnt", subcommands: null },
    { id: "742387", name: "/update", category: "usermgmnt", subcommands: null },
    { id: "259806", name: "/bind", category: "usermgmnt", subcommands:{1:"group",2:"gamepass",3:"badge",4:"verification"} },
    { id: "101380", name: "/binds", category: "usermgmnt", subcommands: null },
];

/**
 * Get a command by its ID.
 * @param {string} id - The command ID.
 * @returns {object|null} - The command object or null if not found.
 */
function getCommandById(id) {
    return commands.find(command => command.id === id) || null;
}

/**
 * Get a command by its name.
 * @param {string} name - The command name.
 * @returns {object|null} - The command object or null if not found.
 */
function getCommandByName(name) {
    return commands.find(command => command.name === name) || null;
}

/**
 * Convert a command ID to its name.
 * @param {string} id - The command ID.
 * @returns {string} - The command name or "Unknown Command" if not found.
 */
function convertCommandIdToName(id) {
    const command = getCommandById(id);
    return command ? command.name : `Unknown Command (${id})`;
}

/**
 * Convert a command name to its ID.
 * @param {string} name - The command name.
 * @returns {string} - The command ID or "Unknown Command" if not found.
 */
function convertCommandNameToId(name) {
    const command = getCommandByName(name);
    return command ? command.id : `Unknown Command (${name})`;
}

module.exports = {
    getCommandById,
    getCommandByName,
    convertCommandIdToName,
    convertCommandNameToId,
};