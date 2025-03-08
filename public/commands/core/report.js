const { SlashCommandBuilder, WebhookClient, MessageFlags } = require('discord.js');

module.exports = {
    id: '2410039', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Send a report to the SHDT.'),
    async execute(interaction) {
        const webhookURL = 'https://ptb.discord.com/api/webhooks/1325220566747058227/RH7wgxlH9w_8v41BPxgpqlfhowSWBSCYw3R3B_No2kB29ap8h08JkYIi0x1LH5iNWEL2';
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
