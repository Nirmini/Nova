// RemoteEvents.js
// Receives a pre-built Discord embed (as a JSON CLI argument from TrelloHandling.js)
// and sends it to the development server's Discord webhook.
require('dotenv').config();
const { WebhookClient } = require('discord.js');

(async () => {
    const webhookClient = new WebhookClient({
        url: process.env.Trello_Test_Webhook,
    });

    try {
        const rawEmbed = process.argv[2];
        if (!rawEmbed) throw new Error('Missing embed argument');

        const embed = JSON.parse(rawEmbed);

        await webhookClient.send({
            content: '',
            embeds: [embed],
        });

        console.log('📤 Successfully sent to Discord webhook');
        webhookClient.destroy();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error sending to Discord:', err);
        webhookClient.destroy();
        process.exit(1);
    }
})();