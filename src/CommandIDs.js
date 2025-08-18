// Command data /\\\/ Tourture Map :3
const commands = [
    { id: "0000001", name: "?ban", category: "altcommands", subcommands: null },
    { id: "0000002", name: "?birthday", category: "altcommands", subcommands: null },
    { id: "0000003", name: "?coin", category: "altcommands", subcommands: null },
    { id: "0000004", name: "?commands", category: "altcommands", subcommands: null },
    { id: "0000005", name: "?credits", category: "altcommands", subcommands: null },
    { id: "0000006", name: "?debug", category: "altcommands", subcommands: null },
    { id: "0000007", name: "?dice", category: "altcommands", subcommands: null },
    { id: "0000008", name: "?github", category: "altcommands", subcommands: null },
    { id: "0000009", name: "?kick", category: "altcommands", subcommands: null },
    { id: "0000010", name: "?lock", category: "altcommands", subcommands: null },
    { id: "0000011", name: "?mute", category: "altcommands", subcommands: null },
    { id: "0000012", name: "?ping", category: "altcommands", subcommands: null },
    { id: "0000013", name: "?purge", category: "altcommands", subcommands: null },
    { id: "0000014", name: "?remind", category: "altcommands", subcommands: null },
    { id: "0000015", name: "?roll", category: "altcommands", subcommands: null },
    { id: "0000016", name: "?unlock", category: "altcommands", subcommands: null },
    { id: "0000017", name: "?uptime", category: "altcommands", subcommands: null },
    { id: "0000018", name: "?verify", category: "altcommands", subcommands: null },
    { id: "0000019", name: "?version", category: "altcommands", subcommands: null },
    { id: "0000020", name: "?warn", category: "altcommands", subcommands: null },

    { id: "0000021", name: "$debugstats", category: "admin", subcommands: null },
    { id: "0000022", name: "$remoteconfig", category: "admin", subcommands: null },

    { id: "1000001", name: "/devrun", category: "admin", subcommands: null },
    { id: "1000002", name: "/embed", category: "admin", subcommands: null },
    { id: "1000003", name: "/format", category: "admin", subcommands: null },
    { id: "1000004", name: "/join", category: "admin", subcommands: null },
    { id: "1000005", name: "/leave", category: "admin", subcommands: null },
    { id: "1000006", name: "/maint", category: "admin", subcommands: null },
    { id: "1000007", name: "/msg", category: "admin", subcommands: null },
    { id: "1000008", name: "/serverconfig", category: "admin", subcommands: null },
    { id: "1000009", name: "/sc2msg", category: "admin", subcommands: null },
    { id: "1000010", name: "/sysmsg", category: "admin", subcommands: null },
    { id: "1000011", name: "/test", category: "admin", subcommands: null },

    { id: "2000001", name: "/about", category: "core", subcommands: null },
    { id: "2000002", name: "/anommsg", category: "core", subcommands: { 1: "send", 2: "track", 3: "ban" } },
    { id: "2000003", name: "/birthday", category: "core", subcommands: { 1: "set", 2: "update", 3: "remove" } },
    { id: "2000004", name: "/bug", category: "core", subcommands: null },
    { id: "2000005", name: "/commands", category: "core", subcommands: { 1: "list", 2: "toggle"} },
    { id: "2000006", name: "/commit", category: "core", subcommands: null },
    { id: "2000007", name: "/credits", category: "core", subcommands: null },
    { id: "2000008", name: "/serverinfo", category: "core", subcommands: null },
    { id: "2000009", name: "/help", category: "core", subcommands: null },
    { id: "2000010", name: "/info", category: "core", subcommands: null },
    { id: "2000011", name: "/members", category: "core", subcommands: null },
    { id: "2000012", name: "/modules", category: "core", subcommands: null },
    { id: "2000013", name: "/ping", category: "core", subcommands: null },
    { id: "2000014", name: "/premium", category: "core", subcommands: null },
    { id: "2000015", name: "/remind", category: "core", subcommands: null },
    { id: "2000016", name: "/report", category: "core", subcommands: null },
    { id: "2000017", name: "/settings", category: "core", subcommands: { 1: "roles", 2: "channels" } },
    { id: "2000018", name: "/setup", category: "core", subcommands: null },
    { id: "2000019", name: "/sponser", category: "core", subcommands: null },
    { id: "2000020", name: "/status", category: "core", subcommands: null },
    { id: "2000021", name: "/subscribe", category: "core", subcommands: {1: "updates", 2: "status", 3: "api"} },
    { id: "2000022", name: "/wiki", category: "core", subcommands: null },

    { id: "3000001", name: "/eval", category: "event", subcommands: null },
    { id: "3000002", name: "/seval", category: "event", subcommands: null },
    { id: "3000001", name: "/stryout", category: "event", subcommands: null },
    { id: "3000004", name: "/tryout", category: "event", subcommands: null },

    { id: "4000001", name: "/cat", category: "fun", subcommands: null },
    { id: "4000002", name: "/coin", category: "fun", subcommands: null },
    { id: "4000003", name: "/dice", category: "fun", subcommands: null },
    { id: "4000004", name: "/dog", category: "fun", subcommands: null },
    { id: "4000005", name: "/mcstats", category: "fun", subcommands: null },
    { id: "4000006", name: "/rgroup", category: "fun", subcommands: { 1: "name", 2: "id"}},
    { id: "4000007", name: "/robloxstats", category: "fun", subcommands: null },
    { id: "4000008", name: "/rps", category: "fun", subcommands: null },

    { id: "5000001", name: "/afk", category: "misc", subcommands: { 1: "set", 2: "return", 3: "remove" } },
    { id: "5000002", name: "/announce", category: "misc", subcommands: null },
    { id: "5000003", name: "/github", category: "misc", subcommands: null },
    { id: "5000004", name: "/itunes", category: "misc", subcommands: null },
    { id: "5000005", name: "/nick", category: "misc", subcommands: null },
    { id: "5000006", name: "/purge", category: "misc", subcommands: null },
    { id: "5000007", name: "/roleinfo", category: "misc", subcommands: null },
    { id: "5000008", name: "/roles", category: "misc", subcommands: null },
    { id: "5000009", name: "/spotify", category: "misc", subcommands: null },
    { id: "5000010", name: "/uptime", category: "misc", subcommands: null },
    { id: "5000011", name: "/vexstats", category: "misc", subcommands: { 1: "team", 2: "awards" } },
    { id: "5000012", name: "/whois", category: "misc", subcommands: null },
    { id: "5000013", name: "/yt", category: "misc", subcommands: null },

    { id: "6000001", name: "/ban", category: "moderation", subcommands: null },
    { id: "6000002", name: "/deafen", category: "moderation", subcommands: { 1: "add", 2: "remove" } },
    { id: "6000003", name: "/delwarn", category: "moderation", subcommands: null },
    { id: "6000004", name: "/kick", category: "moderation", subcommands: null },
    { id: "6000005", name: "/lock", category: "moderation", subcommands: null },
    { id: "6000006", name: "/lockdown", category: "moderation", subcommands: null },
    { id: "6000007", name: "/masslock", category: "moderation", subcommands: null },
    { id: "6000008", name: "/massunlock", category: "moderation", subcommands: null },
    { id: "6000009", name: "/mod", category: "moderation", subcommands: { 1: "logs", 2: "stats", 3: "actions" } },
    { id: "6000010", name: "/modstaff", category: "moderation", subcommands: { 1: "ls", 2: "add", 3: "remove" } },
    { id: "6000011", name: "/move", category: "moderation", subcommands: null },
    { id: "6000012", name: "/mute", category: "moderation", subcommands: null },
    { id: "6000013", name: "/note", category: "moderation", subcommands: { 1: "add", 2: "remove" } },
    { id: "6000014", name: "/role", category: "moderation", subcommands: { 1: "add", 2: "edit", 3: "remove" } },
    { id: "6000015", name: "/sban", category: "moderation", subcommands: null },
    { id: "6000016", name: "/smode", category: "moderation", subcommands: null },
    { id: "6000017", name: "/snick", category: "moderation", subcommands: null },
    { id: "6000018", name: "/tban", category: "moderation", subcommands: null },
    { id: "6000019", name: "/ticket", category: "moderation", subcommands: { 1: "open", 2: "assign", 3: "close" } },
    { id: "6000020", name: "/ticketpanel", category: "moderation", subcommands: null },
    { id: "6000021", name: "/unban", category: "moderation", subcommands: null },
    { id: "6000022", name: "/unlock", category: "moderation", subcommands: null },
    { id: "6000023", name: "/warn", category: "moderation", subcommands: null },
    { id: "6000024", name: "/warnings", category: "moderation", subcommands: null },

    { id: "9000001", name: "/bind", category: "usermgmnt", subcommands:{1:"group",2:"gamepass",3:"badge",4:"verification"} },
    { id: "9000002", name: "/binds", category: "usermgmnt", subcommands: null },
    { id: "9000003", name: "/pinrole", category: "usermgmnt", subcommands: null },
    { id: "9000004", name: "/rank", category: "usermgmnt", subcommands: { 1: "add", 2: "remove" } },
    { id: "9000005", name: "/rankmanage", category: "usermgmnt", subcommands: { 1: "add", 2: "remove" } },
    { id: "9000006", name: "/ranks", category: "usermgmnt", subcommands: null },
    { id: "9000007", name: "/temprole", category: "usermgmnt", subcommands: null },
    { id: "9000008", name: "/unpinrole", category: "usermgmnt", subcommands: null },
    { id: "9000009", name: "/update", category: "usermgmnt", subcommands: null },
    { id: "9000010", name: "/verify", category: "usermgmnt", subcommands: null },
    
];

/**
 * Get a command by its ID or smart-prefixed ID
 * Supports long-form IDs like 1000001 or 9000001
 * @param {string|number} rawId
 * @returns {object|null}
 */
function getCommandById(rawId) {
    const idStr = String(rawId);

    const exact = commands.find(cmd => cmd.id === idStr);
    if (exact) return exact;

    const paddedId = idStr.padStart(6, '0');

    if (idStr.length > 6) {
        const shortId = idStr.slice(-6);
        const prefix = idStr.slice(0, -6);

        const categoryMap = {
            '0': 'altcommands',
            '1': 'admin',
            '2': 'core',
            '3': 'event',
            '4': 'fun',
            '5': 'misc',
            '6': 'moderation',
            '7': 'modules',
            '8': 'roblox',
            '9': 'usermgmnt'
        };

        const category = categoryMap[prefix];
        if (category) {
            return commands.find(cmd => cmd.id === shortId && cmd.category === category);
        }
    }
    
    return commands.find(cmd => cmd.id === paddedId) || null;
}


/**
 * Get a command by its name, with support for shorthand ? or / prefix
 * @param {string} name
 * @returns {object|null}
 */
function getCommandByName(name) {
    const normalized = name.trim().toLowerCase();

    return commands.find(cmd =>
        cmd.name.toLowerCase() === normalized ||                // direct match
        cmd.name.toLowerCase() === `?${normalized}` ||          // shorthand altcommand
        cmd.name.toLowerCase() === `/${normalized}`             // shorthand slash command
    ) || null;
}

/**
 * Convert a command ID (extended or base) to its name
 * @param {string|number} id
 * @returns {string}
 */
function convertCommandIdToName(id) {
    const cmd = getCommandById(id);
    return cmd ? cmd.name : `Unknown Command (${id})`;
}

/**
 * Convert a command name to its ID
 * @param {string} name
 * @returns {string}
 */
function convertCommandNameToId(name) {
    const cmd = getCommandByName(name);
    return cmd ? cmd.id : `Unknown Command (${name})`;
}

module.exports = {
    getCommandById,
    getCommandByName,
    convertCommandIdToName,
    convertCommandNameToId
};
