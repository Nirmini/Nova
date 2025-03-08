const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    id: '2876459', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('credits')
        .setDescription('Multi Credits.'),
    async execute(interaction) {
        const creditsEmbed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('Nova Credits')
            .setAuthor({ name: 'Nova' })
            .setThumbnail('https://i.imgur.com/fEQIChj.png')
            .addFields(
                { name: '**MAIN LIBRARIES**', value: 'These are some of the main NPM Packages Nova uses.' },
                { name: 'Discord.js', value: 'We use Discord.js to host and manage the bot' },
                { name: 'Firebase', value: 'We use Firebase to provide reliable infrastructure for our users.' },
                { name: 'Node.js', value: 'We utilize Node.js to host the bot and other key operations due to its simplicity and reliability.' },
                { name: 'axios', value: 'We use Axios to handle API calls and HTTP requests' },
                { name: 'dotenv', value: 'We also use dotenv to be able to have a more secure application.' },
                { name: 'Express.js', value: 'We use Express.js to handle the dashboard as well as other web-server operations.' },
                { name: 'Noblox.js', value: 'We use Noblox to allow for an easy and simple authentication for server admins and members.' },
                { name: 'js-yaml', value: 'We used js-yaml to be able to have different configurations for the bot.' },
                { name: 'Cheerio', value: 'We use Cheerio mainly as a fallback to Noblox.' },
                { name: 'cloudflare', value: 'We use this to provide Cloudflare functions in the application.' },
                { name: 'googleapis', value: 'We use this to be able to use multiple Google APIs' },
                { name: 'ms', value: 'We use ms to handle time conversions in user inputs.' },
                { name: 'stripe', value: 'We use Stripe to handle premium payments and such.' },
                { name: 'mongodb', value: 'We use MongoDB as a fallback to Firebase.' },
                { name: 'ws', value: 'We use ws for websockets for things like Trello change updates.' },
                { name: 'body-parser', value: 'We use body-parser both in multiple packages alongside other uses.' },
                { name: 'node-cron', value: 'We use node-cron to handle timed events like checking the birthdays list.' },
                { name: 'eris', value: 'We use eris to provide a customizable backend for the shorthand(?) commands.' },
                { name: '\u200B', value: '\u200B' },
                { name: '**CONTRIBUTORS**', value: 'Those in the NDT that have directly contributed to Nova.' },
                { name: 'Frost', value: 'Lead Maintainer & Project Founder', inline: true },
                { name: 'Nirmini DevTeam', value: 'Project Oversight & Backend Support.', inline: true },
                { name: 'Zacharyeb17', value: 'Ex-Project Feedback', inline: true },
                { name: '.Aaron227', value: 'Project Feedback', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: '\"Unbound.\"' });

        await interaction.reply({ embeds: [creditsEmbed] });
    },
};
// TO BE UPDATED