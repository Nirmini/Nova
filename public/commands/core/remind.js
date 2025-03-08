const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const activeReminders = new Map(); // Keeps track of reminders for each user

module.exports = {
    id: '2306341', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder.')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Time for the reminder (e.g., 10m, 2h, 1d). Max: 7d.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text of the reminder.')
                .setRequired(true)),
    async execute(interaction) {
        const timeInput = interaction.options.getString('time');
        const reminderText = interaction.options.getString('text');
        const userId = interaction.user.id;

        // Validate time format and convert to milliseconds
        const timeMatch = timeInput.match(/^(\d+)([smhd])$/);
        if (!timeMatch) {
            return interaction.reply({
                content: 'Invalid time format. Use `<number><unit>` (e.g., 10m, 2h, 1d).',
                flags: MessageFlags.Ephemeral,
            });
        }

        const [_, value, unit] = timeMatch;
        const timeValue = parseInt(value, 10);
        const timeUnits = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
        const timeMs = timeValue * timeUnits[unit];

        // Ensure time is within limits (7 days max)
        if (timeMs > 7 * 86400000) {
            return interaction.reply({
                content: 'Time exceeds the maximum limit of 7 days.',
                flags: MessageFlags.Ephemeral,
            });
        }

        // Check if user has reached the reminder limit
        const userReminders = activeReminders.get(userId) || [];
        if (userReminders.length >= 4) {
            return interaction.reply({
                content: 'You have reached the maximum of 4 active reminders. Please wait or cancel one.',
                flags: MessageFlags.Ephemeral,
            });
        }

        // Schedule the reminder
        const reminderTimeout = setTimeout(async () => {
            try {
                await interaction.user.send(`⏰ Reminder: ${reminderText}`);
            } catch {
                console.error(`Failed to DM reminder to user ${userId}.`);
            }

            // Remove the reminder from active reminders
            const updatedReminders = activeReminders.get(userId) || [];
            activeReminders.set(userId, updatedReminders.filter(rem => rem.id !== reminderId));
        }, timeMs);

        // Add the reminder to the active list
        const reminderId = Date.now();
        userReminders.push({ id: reminderId, timeout: reminderTimeout });
        activeReminders.set(userId, userReminders);

        await interaction.reply({
            content: `✅ Reminder set for ${timeInput}: "${reminderText}"`,
            flags: MessageFlags.Ephemeral,
        });
    },
};
