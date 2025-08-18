const { setBirthday, getBirthday, updBirthday, remBirthday } = require('../src/Database');
const { EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const Client = require('../core/global/Client');

module.name = "BirthdayHandler";

/**
 * Validates and formats the birthday input.
 * @param {string} dateStr - Expected format: "DD/MM"
 * @returns {string|null} - Returns formatted "DD/MM" or null if invalid.
 */
function validateBirthday(dateStr) {
    const dateRegex = /^(\d{1,2})\/(\d{1,2})$/;
    const match = dateStr.match(dateRegex);

    if (!match) return null;

    let day = parseInt(match[1], 10);
    let month = parseInt(match[2], 10);

    if (day < 1 || day > 31 || month < 1 || month > 12) return null;

    // Ensures the format is always "DD/MM" with two digits
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
}

/**
 * Sets a user's birthday in the database.
 */
async function setUserBirthday(userId, birthday) {
    const formattedBirthday = validateBirthday(birthday);

    if (!formattedBirthday) {
        throw new Error('Invalid date format. Please use "DD/MM".');
    }

    const existingData = await getBirthday(userId, 'Birthday.date');
    if (existingData) {
        return { error: 'Birthday already set. Use `/birthday update` to change it.' };
    }

    await setBirthday(userId, 'Birthday', { date: formattedBirthday });
    return { success: true };
}

/**
 * Updates a user's birthday, enforcing a 24-hour cooldown.
 */
async function updateUserBirthday(userId, birthday) {
    const formattedBirthday = validateBirthday(birthday);

    if (!formattedBirthday) {
        throw new Error('Invalid date format. Please use "DD/MM".');
    }

    const lastUpdated = await getBirthday(userId, 'LastUpdated');
    const now = Date.now();

    if (lastUpdated && now - lastUpdated < 24 * 60 * 60 * 1000) {
        return { error: 'You can only update your birthday once every 24 hours.' };
    }

    await updBirthday(userId, 'Birthday', { date: formattedBirthday });
    await setBirthday(userId, 'LastUpdated', now);
    return { success: true };
}

/**
 * Removes a user's birthday from the database.
 */
async function removeUserBirthday(userId) {
    await remBirthday(userId, 'Birthday');
    await remBirthday(userId, 'LastUpdated');
    return { success: true };
}

/**
 * Sends birthday pings to users on their birthday.
 */
async function sendBirthdayPing(client) {
    const guilds = client.guilds.cache;

    for (const [guildId, guild] of guilds) {
        try {
            const birthdaysChannel = guild.channels.cache.find(channel =>
                channel.name.toLowerCase().includes('birthday')
            );

            if (!birthdaysChannel) continue;

            // Get all birthdays for all users
            const allBirthdays = await getBirthday();
            const today = new Date();
            const todayFormatted = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}`; // "DD/MM"

            for (const userId in allBirthdays) {
                const userBirthday = allBirthdays[userId]?.Birthday?.date;
                if (userBirthday === todayFormatted) {
                    const user = await guild.members.fetch(userId).catch(() => null);
                    if (!user) continue;

                    const embed = new EmbedBuilder()
                        .setTitle('🎉 Happy Birthday! 🎂')
                        .setDescription(`Happy Birthday **${user.user.username}**! 🥳`)
                        .setColor('Random');

                    await birthdaysChannel.send({
                        content: `${user}`,
                        embeds: [embed],
                    });
                }
            }
        } catch (error) {
            console.error(`Error sending birthday ping in guild ${guildId}:`, error);
        }
    }
}

/**
 * Initializes the cron job to run daily at midnight.
 */
function initializeCron(client) {
    cron.schedule('0 0 * * *', () => {
        console.log('Running daily birthday ping...');
        sendBirthdayPing(client)
            .then(() => console.log('Birthday pings completed!'))
            .catch(error => console.error('Error running birthday pings:', error));
    });
}

module.exports = {
    setUserBirthday,
    updateUserBirthday,
    removeUserBirthday,
    sendBirthdayPing,
    initializeCron,
};