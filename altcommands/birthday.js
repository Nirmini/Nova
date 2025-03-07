const birthdayModule = require('../core/modules/birthday');

module.exports = {
    id: '0947326', // Unique 6-digit command ID
    /**
     * Handles the birthday command for setting, updating, or removing a user's birthday.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        try {
            const args = message.content.split(' ').slice(1);
            if (args.length === 0) {
                return message.reply('Usage: `?birthday [set/edit/remove] <DD/MM/YYYY or DD/MM>`');
            }

            const subcommand = args[0].toLowerCase();
            const userId = message.author.id;
            let dateInput = args[1]; // Only relevant for 'set' and 'edit'

            if (!['set', 'edit', 'remove'].includes(subcommand)) {
                return message.reply('Invalid subcommand. Use `set`, `edit`, or `remove`.');
            }

            if ((subcommand === 'set' || subcommand === 'edit') && !dateInput) {
                return message.reply('Please provide a valid date in `DD/MM/YYYY` or `DD/MM` format.');
            }

            if (dateInput) {
                // Validate and format the date
                const dateRegexFull = /^(\d{1,2})\/(\d{1,2})\/\d{4}$/;  // DD/MM/YYYY
                const dateRegexShort = /^(\d{1,2})\/(\d{1,2})$/;        // DD/MM

                let match = dateInput.match(dateRegexFull) || dateInput.match(dateRegexShort);

                if (!match) {
                    return message.reply({ content: '❌ Invalid date format! Please use `DD/MM/YYYY` or `DD/MM`.', flags: MessageFlags.Ephemeral });
                }

                // Extract day and month
                let day = parseInt(match[1], 10);
                let month = parseInt(match[2], 10);

                // Validate date range
                if (day < 1 || day > 31 || month < 1 || month > 12) {
                    return message.reply({ content: '❌ Invalid date! Please provide a real day and month.', flags: MessageFlags.Ephemeral });
                }

                // Format to always be "DD/MM"
                dateInput = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
            }

            let response;

            if (subcommand === 'set') {
                response = await birthdayModule.setBirthday(userId, dateInput);
            } else if (subcommand === 'edit') {
                response = await birthdayModule.updateBirthday(userId, dateInput);
            } else if (subcommand === 'remove') {
                response = await birthdayModule.removeBirthday(userId);
            }

            if (response?.error) {
                return message.reply({ content: `❌ ${response.error}`, flags: MessageFlags.Ephemeral });
            }

            let successMessage;
            if (subcommand === 'set') successMessage = `🎉 Your birthday has been set to **${dateInput}**! You'll be pinged on your special day.`;
            if (subcommand === 'edit') successMessage = `🎂 Your birthday has been updated to **${dateInput}**!`;
            if (subcommand === 'remove') successMessage = `Your birthday has been removed. No more pings on your special day.`;

            return message.reply(successMessage);

        } catch (error) {
            console.error('Error executing birthday command:', error);
            return message.reply({ content: '❌ An error occurred while processing your request. Please try again later.', flags: MessageFlags.Ephemeral });
        }
    },
};
