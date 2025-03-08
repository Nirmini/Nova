const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '2080832', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('sponser')
        .setDescription('Sponser NPM Packages we use'),
    async execute(interaction) {
        const user = interaction.user;

        // Create the embed
        const embed = new EmbedBuilder()
            .setColor('#4832a8')
            .setTitle('Support the work of those who allow Nova to function')
            .setDescription('We rely on a lot of open-source work made by those who make very little of these and we try to support them back as much as we can. Below you can find all the Node.js packages we use.')
            .addFields(
                { name: 'Axios:', value: 'https://www.npmjs.com/package/axios' },
                { name: 'Cheerio:', value: 'https://www.npmjs.com/package/cheerio' },
                { name: 'Cloudflare:', value: 'https://www.npmjs.com/package/cloudflare' },
                { name: 'Discord.js:', value: 'https://www.npmjs.com/package/discord.js' },
                { name: 'Dotenv:', value: 'https://www.npmjs.com/package/dotenv' },
                { name: 'Express.js:', value: 'https://www.npmjs.com/package/express' },
                { name: 'Firebase:', value: 'https://www.npmjs.com/package/firebase' },
                { name: 'Firebase-Admin:', value: 'https://www.npmjs.com/package/firebase-admin' },
                { name: 'Googleapis:', value: 'https://www.npmjs.com/package/googleapis' },
                { name: 'JS-yaml:', value: 'https://www.npmjs.com/package/js-yaml' },
                { name: 'MS:', value: 'https://www.npmjs.com/package/ms' },
                { name: 'Noblox.js:', value: 'https://www.npmjs.com/package/noblox.js' },
                { name: 'Stripe:', value: 'https://www.npmjs.com/package/stripe' },
            )
            .setFooter({ text: 'Thank you to those devs.' })
            .setTimestamp();

        try {
            // Send the embed as a DM
            await user.send({ embeds: [embed] });
            await interaction.reply({
                content: 'I\'ve sent you a list of packages we use via DM.',
                flags: MessageFlags.Ephemeral,
            });
        } catch (error) {
            console.error('Error sending sponser DM:', error);
            await interaction.reply({
                content: 'I was unable to send you a DM. Please check your DM settings and try again.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
