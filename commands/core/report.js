const { SlashCommandBuilder, WebhookClient, MessageFlags } = require('discord.js');

module.exports = {
    id: '2000016', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Send a report to the NDT.'),
    async execute(interaction) {
        const webhookURL = 'YOUR_REPORTING_WEBHOOK_URL';
        const webhookClient = new WebhookClient({ url: webhookURL });

        const user = interaction.user;
        const guild = interaction.guild;

        // Format the report message
        const reportMessage = `\`${user.username} (@${user.id})\` reported \`${guild.name} (${guild.id})\` for AUP and/or Discord Terms violations.`;

        try {
            await webhookClient.send({ content: reportMessage });
            await interaction.reply({ content: '❌ Failed to submit. Nova reports are unavailable currently.', flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error sending report via webhook:', error);
            await interaction.reply({ content: '❌ Failed to submit your report. Please try again later.', flags: MessageFlags.Ephemeral });
        }
    },
};
