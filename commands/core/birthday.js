const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const birthdayModule = require('../../core/modules/birthday');

module.exports = {
    id: '2000003', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Manage your birthday to receive a special ping!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set your birthday.')
                .addStringOption(option =>
                    option
                        .setName('date')
                        .setDescription('Your birthday (MM/DD format).')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('update')
                .setDescription('Update your birthday.')
                .addStringOption(option =>
                    option
                        .setName('date')
                        .setDescription('Your new birthday (MM/DD format).')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove your birthday.')
        ),

    async execute(interaction) {
        const userId = interaction.user.id;
        const subcommand = interaction.options.getSubcommand();
        let dateInput = interaction.options.getString('date');

        // Validate and format date for 'set' and 'update'
        if (subcommand !== 'remove') {
            const dateRegex = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])$/; // MM/DD format
            
            if (!dateRegex.test(dateInput)) {
                return interaction.reply({
                    content: '❌ Invalid date format! Please use `MM/DD` (e.g., `12/25` for December 25th).',
                    flags: MessageFlags.Ephemeral,
                });
            }

            // Normalize leading zeros (e.g., "5/9" -> "05/09")
            const [month, day] = dateInput.split('/');
            dateInput = `${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
        }

        try {
            let response;

            if (subcommand === 'set') {
                response = await birthdayModule.setBirthday(userId, dateInput);
            } else if (subcommand === 'update') {
                response = await birthdayModule.updateBirthday(userId, dateInput);
            } else if (subcommand === 'remove') {
                response = await birthdayModule.removeBirthday(userId);
            }

            if (response?.error) {
                return interaction.reply({
                    content: `❌ ${response.error}`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            let successMessage;
            if (subcommand === 'set') successMessage = `🎉 Your birthday has been set to **${dateInput}**! You'll be pinged on your special day.`;
            if (subcommand === 'update') successMessage = `🎂 Your birthday has been updated to **${dateInput}**!`;
            if (subcommand === 'remove') successMessage = `Your birthday has been removed. No more pings on your special day.`;

            return interaction.reply({
                content: successMessage,
                flags: MessageFlags.Ephemeral,
            });

        } catch (error) {
            console.error('Error handling /birthday command:', error);
            return interaction.reply({
                content: '❌ An error occurred while processing your request. Please try again later.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
