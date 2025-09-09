const fs = require('fs');
const path = require('path');
const settings = require('../settings.json');
const { getGuildConfig, getGuildData, setGuildData, updateGuildData } = require('./Database');
const { EmbedBuilder } = require('discord.js');
const client = require('../core/global/Client');

/**
 * CASE TYPES
 * 1: Warning
 * 2: Mute
 * 3: Ban
 * 4: Timeout
 * 5: Kick
 * 6: Automod
 * 7: Unused
 * 8: Unused
 * 9: Unused
 * 0: Unused
 */

/*
--DATA FORMAT--
Each case is stored as an object inside an array at <GuildId>.cases[]
{
  "id": <caseId>,
  "timestamp": "<timestamp>",
  "target": "<targetuid>",
  "issuer": "<issueruid>",
  "type": <casetype>,
  "title": "<title>",
  "description": "<description>"
}
*/

async function getNewCaseId(guildId) {
    const modenabled = await getGuildConfig(guildId, 'caseconfig.%enabled');
    console.log(`[NovaCases] getNewCaseId: guildId=${guildId}, %caseconfig=${modenabled}`);
    if (modenabled !== true) {
        console.log(`[NovaCases] getNewCaseId: Moderation not enabled for guild ${guildId}`);
        return false; // cannot be disabled
    }

    let guildcases = await getGuildData(guildId, 'cases');
    console.log(`[NovaCases] getNewCaseId: Loaded cases for guild ${guildId}:`, guildcases);
    if (!Array.isArray(guildcases)) guildcases = [];
    const nextOpenCaseId = guildcases.length > 0
        ? guildcases[guildcases.length - 1].id + 1
        : 1;

    console.log(`[NovaCases] getNewCaseId: Next case ID for guild ${guildId}: ${nextOpenCaseId}`);
    return nextOpenCaseId;
}

async function createUserCase(guildId, userId, type, issuerId, title, description, expires) {
    console.log(`[NovaCases] createUserCase: guildId=${guildId}, userId=${userId}, type=${type}, issuerId=${issuerId}, title=${title}, description=${description}, expires=${expires}`);
    const caseId = await getNewCaseId(guildId);
    if (!caseId) {
        console.log(`[NovaCases] createUserCase: Failed to get new case ID for guild ${guildId}`);
        return false;
    }

    const caseData = {
        id: caseId,
        timestamp: new Date().toISOString(),
        target: userId,
        issuer: issuerId,
        type: type,
        title: title || `Case #${caseId}`,
        description: description || "No description provided.",
        expires: expires || null
    };

    let guildcases = await getGuildData(guildId, 'cases');
    console.log(`[NovaCases] createUserCase: Loaded cases before push:`, guildcases);
    if (!Array.isArray(guildcases)) guildcases = [];
    guildcases.push(caseData);

    try {
        await setGuildData(guildId, 'cases', guildcases);
        console.log(`[NovaCases] createUserCase: Wrote cases for guild ${guildId}:`, guildcases);
    } catch (err) {
        console.error(`[NovaCases] createUserCase: Error writing cases for guild ${guildId}:`, err);
    }

    // resolve log channel **here**
    const channelId = await getGuildConfig(guildId, 'caseconfig.logchannel');
    if (channelId) {
        const logchannel = client.channels.cache.get(channelId);
        if (logchannel) {
            const embed = new EmbedBuilder()
                .setTitle(`New Case #${caseId} — ${caseTypeToString(type)}`)
                .addFields(
                    { name: 'Target', value: `<@${userId}> (${userId})`, inline: true },
                    { name: 'Issuer', value: `<@${issuerId}> (${issuerId})`, inline: true },
                    { name: 'Reason', value: description || 'No description provided.' }
                )
                .setColor(typeToColor(type))
                .setTimestamp();

            await logchannel.send({ embeds: [embed] });
        }
    }

    return caseData;
}


async function getCaseData(guildId, userId, caseId) {
    const guildcases = await getGuildData(guildId, 'cases') || [];
    return guildcases.find(c => c.id === caseId && c.target === userId) || null;
}

async function updateUserCase(guildId, userId, caseId, newData) {
    let guildcases = await getGuildData(guildId, 'cases') || [];
    let caseIndex = guildcases.findIndex(c => c.id === caseId && c.target === userId);
    if (caseIndex === -1) return false;

    const channelId = await getGuildConfig(guildId, 'caseconfig.logchannel');
    if (channelId) {
        const logchannel = client.channels.cache.get(channelId);
        if (logchannel) {
            const embed = new EmbedBuilder()
                .setTitle(`New Case #${caseId} — ${caseTypeToString(type)}`)
                .addFields(
                    { name: 'Target', value: `<@${userId}> (${userId})`, inline: true },
                    { name: 'Issuer', value: `<@${issuerId}> (${issuerId})`, inline: true },
                    { name: 'Reason', value: description || 'No description provided.' }
                )
                .setColor(typeToColor(type))
                .setTimestamp();

            await logchannel.send({ embeds: [embed] });
        }
    }

    guildcases[caseIndex] = { ...guildcases[caseIndex], ...newData };
    await setGuildData(guildId, 'cases', guildcases);
    return guildcases[caseIndex];
}

async function delUserCase(guildId, userId, caseId) {
    let guildcases = await getGuildData(guildId, 'cases') || [];
    const before = guildcases.length;
    guildcases = guildcases.filter(c => !(c.id === caseId && c.target === userId));

    if (guildcases.length === before) return false; // not found

    const channelId = await getGuildConfig(guildId, 'caseconfig.logchannel');
    if (channelId) {
        const logchannel = client.channels.cache.get(channelId);
        if (logchannel) {
            const embed = new EmbedBuilder()
                .setTitle(`New Case #${caseId} — ${caseTypeToString(type)}`)
                .addFields(
                    { name: 'Target', value: `<@${userId}> (${userId})`, inline: true },
                    { name: 'Issuer', value: `<@${issuerId}> (${issuerId})`, inline: true },
                    { name: 'Reason', value: description || 'No description provided.' }
                )
                .setColor(typeToColor(type))
                .setTimestamp();

            await logchannel.send({ embeds: [embed] });
        }
    }

    await setGuildData(guildId, 'cases', guildcases);
    return true;
}

// Helpers
function caseTypeToString(type) {
    const types = {
        1: "Warning",
        2: "Mute",
        3: "Ban",
        4: "Timeout",
        5: "Kick",
        6: "Automod"
    };
    return types[type] || "Unknown";
}

function typeToColor(type) {
    const colors = {
        1: 0xFFFF00, // Warning - yellow
        2: 0xFFA500, // Mute - orange
        3: 0xFF0000, // Ban - red
        4: 0x00FFFF, // Timeout - cyan
        5: 0xFF4500, // Kick - orange-red
        6: 0x800080  // Automod - purple
    };
    return colors[type] || 0x2F3136; // default gray
}

module.exports = {
    getNewCaseId,
    createUserCase,
    getCaseData,
    updateUserCase,
    delUserCase
};
