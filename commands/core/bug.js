const { SlashCommandBuilder, WebhookClient, MessageFlags, EmbedBuilder } = require('discord.js');

module.exports = {
    id: '2000004', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('bug')
        .setDescription('Send a report to the NDT.')
        .addStringOption(option =>
        option
                .setName('bugdesc')
                .setDescription('Describe the bug here.')
                .setRequired(true)),
    async execute(interaction) {
        const webhookURL = 'YOUR_BUG_REPORT_WEBHOOK_URL';
        const webhookClient = new WebhookClient({ url: webhookURL });

        const user = interaction.user;
        const guild = interaction.guild;
        const bugreport = interaction.options.getString('bugdesc') || '';

        if (bugreport.length > 1021) {
            bugreport = `${bugreport.slice(0, 1021)}...`;
        }

        // Format the report message
        const reportEmbed = new EmbedBuilder()
            .setColor(0x0000ff)
            .setTitle('Bug Report')
            .setDescription(`Bug report from ${user.tag}`)
            .addFields({ name:'User Info:', value:`${user.tag} (@${user.id})`})
            .addFields({ name:'Bug Report', value:`${bugreport}`});

        try {
            // Send the message to the webhook
            await webhookClient.send({ embeds: [reportEmbed] });

            // Acknowledge the report
            await interaction.reply({ content: '<:Check:1319480831303225354> Your bug report has been submitted.', flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error sending report via webhook:', error);
            await interaction.reply({ content: '<:Failure:1329622862742421594> Failed to submit your report. Please try again later.', flags: MessageFlags.Ephemeral });
        }
    },
};
