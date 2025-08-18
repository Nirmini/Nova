const { MessageFlags } = require('discord.js');

const activeReminders = new Map(); // Keeps track of reminders for each user

module.exports = {
    id: '0000014', // Unique 6-digit command ID
    /**
     * Executes the ?remind <time> <reminder> command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     * @param {string[]} args - The arguments passed with the command.
     */
    execute: async (message, args) => {
        if (args.length < 2) {
            await message.reply('Usage: `?remind <1m-7d> <reminder text>`');
            return;
        }

        const timeInput = args[0];
        const reminderText = args.slice(1).join(' ');
        const userId = message.author.id;

        // Validate time format and convert to milliseconds
        const timeMatch = timeInput.match(/^(\d+)([smhd])$/);
        if (!timeMatch) {
            await message.reply('Invalid time format. Use `<number><unit>` (e.g., 10m, 2h, 1d).');
            return;
        }

        const [_, value, unit] = timeMatch;
        const timeValue = parseInt(value, 10);
        const timeUnits = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
        const timeMs = timeValue * timeUnits[unit];

        // Ensure time is within limits (7 days max)
        if (timeMs > 7 * 86400000) {
            await message.reply('Time exceeds the maximum limit of 7 days.');
            return;
        }

        // Check if user has reached the reminder limit
        const userReminders = activeReminders.get(userId) || [];
        if (userReminders.length >= 4) {
            await message.reply('You have reached the maximum of 4 active reminders. Please wait or cancel one.');
            return;
        }

        // Schedule the reminder
        const reminderId = Date.now();
        const reminderTimeout = setTimeout(async () => {
            try {
                await message.author.send(`⏰ Reminder: ${reminderText}`);
            } catch {
                console.error(`Failed to DM reminder to user ${userId}.`);
            }
            // Remove the reminder from active reminders
            const updatedReminders = activeReminders.get(userId) || [];
            activeReminders.set(userId, updatedReminders.filter(rem => rem.id !== reminderId));
        }, timeMs);

        // Add the reminder to the active list
        userReminders.push({ id: reminderId, timeout: reminderTimeout });
        activeReminders.set(userId, userReminders);

        await message.reply(`✅ Reminder set for ${timeInput}: "${reminderText}"`);
    },
};