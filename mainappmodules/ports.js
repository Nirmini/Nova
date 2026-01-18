require('dotenv').config();
const { activeFlags, flagData } = require(`../mainapp/launchargs`);
const config = require('../settings.json');

/**
 * Gets the assigned port for a given ident
 * @param {string} ident 
 * @returns {number}
 */
function getPort(ident) {
    
    let pident = ident.toLowerCase();
    let retValue
    let pName 
    let pNumb 

    if (activeFlags.includes('fp')) {
        [PortName, PortNumber] = flagData.flagValue.split(':');
        pName = PortName.toLowerCase(); // We're using lowercase in the switch to get around case sensitivity.
        pNumb = parseInt(PortNumber, 10); // Sanity check to make it a number
    }

    switch (pident) {
        case 'devdash':
            retValue = config.ports.DevDash; // 5 Item array
            if (pName == 'devdash') retValue = pNumb // Runs last anyway so it'll overwrite the initial value when needed.
            break;
        case 'novaapi':
            retValue = config.ports.NovaAPI
            if (pName == 'novaapi') retValue = pNumb
            break;
        case 'statusapi':
            retValue = config.ports.StatusAPI
            if (pName == 'statusapi') retValue = pNumb
            break;
        case 'shardmngr':
            retValue = config.ports.ShardMngr
            if (pName == 'shardmngr') retValue = pNumb
            break;
        case 'localdash':
            retValue = config.ports.LocalDash
            if (pName == 'localdash') retValue = pNumb
            break;
        case 'cloudflare':
            retValue = config.ports.Cloudflare
            if (pName == 'cloudflare') retValue = pNumb
            break;
        case 'shard':
            retValue = config.ports.Shard
            // Shard cannot be overridden by the CLI due to how it's structured to use a block of ports.
            break;
    }

    return retValue;
}

/**
 * Gets the true port for a given ident
 * @param {string} ident 
 * @returns {number}
 */
function getTruePort(ident) {
    posIdent = ident.toLowerCase();
    switch (posIdent) {
        case 'devdash':
            return config.ports.DevDash; // 5 Item array
            break; // Extra return because I have trust issues lol.
        case 'novaapi':
            return config.ports.NovaAPI;
            break;
        case 'statusapi':
            return config.ports.StatusAPI;
            break;
        case 'shardmngr':
            return config.ports.ShardMngr;
            break;
        case 'localdash':
            return config.ports.LocalDash;
            break;
        case 'cloudflare':
            return config.ports.Cloudflare;
            break;
        case 'shard':
            return config.ports.Shard;
            break;
    }
}

module.exports = {
    getPort,
    getTruePort,
}