// To be fixed eventually
const axios = require('axios');
require('dotenv').config();
const cfg = require('../../settings.json');

const TOPGG_TOKEN = process.env.TGG_TOKEN;
const BOT_ID = process.env.CLIENTID;

/**
 * Posts bot stats to Top.gg using the provided Discord.js client instance.
 * @param {import('discord.js').Client} client - The Discord.js client instance.
 * @param {Object} [options] - Optional extra fields for the Top.gg API.
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
async function fetchAndPostStats(client, options = {}) {
    if (!TOPGG_TOKEN || !BOT_ID) {
        console.warn('[Top.gg] Missing TOPGG_TOKEN or BOT_ID in environment.');
        return false;
    }
    if (!cfg.push_2_topgg) {
        console.warn('[TGG]: Attempted to execute a call while disabled!');
        return false;
    }
    try {
        const bot = client.user;
        const guilds = Array.from(client.guilds.cache.keys());
        const server_count = guilds.length;
        const shard_count = client.shard?.count || 1;

        const stats = {
            id: bot.id,
            username: bot.username,
            discriminator: bot.discriminator,
            avatar: bot.avatar
                ? ` https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png`
                : `https://cdn.discordapp.com/embed/avatars/${Number(bot.discriminator) % 5}.png`,
            defAvatar: `https://cdn.discordapp.com/embed/avatars/${Number(bot.discriminator) % 5}.png`, //Alternative hosted at https://thatWest7014.pages.dev/imgs/NovaV1.png
            defAvatar: bot.avatar || null,
            lib: 'discord.js',
            prefix: '?',
            owners: cfg.operator.userId,
            guilds: guilds,
            server_count,
            shard_count,
            ...options // allow override/extra fields
        };

        const res = await axios.post(
            `https://top.gg/api/bots/${BOT_ID}/stats`,
            stats,
            {
                headers: {
                    Authorization: TOPGG_TOKEN,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`[Top.gg] ✅ Posted stats for bot ${bot.username} (${bot.id}). Status: ${res.status}`);
        return true;
    } catch (error) {
        if (error.response) {
            console.error(`[Top.gg] ❌ Failed to post stats:`, error.response.data);
        } else {
            console.error(`[Top.gg] ❌ Failed to post stats:`, error.message);
        }
        return false;
    }
}

// Optionally auto-run if global.client is available and ready
if (global.client && global.client.user) {
    fetchAndPostStats(global.client)
        .then(success => {
            if (!success) {
                console.warn('[Top.gg] Auto-post failed. Call fetchAndPostStats(client) after client is ready.');
            }
        });
}

module.exports = { fetchAndPostStats };
