const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    /**
     * Executes the github command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        const args = message.content.split(' ').slice(1); // Split the message into arguments
        if (args.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('GitHub Command Help')
                .setDescription('Usage: `?github <Repo Name/URL>`')
                .setColor('BLUE')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        try {
            const repo = args.join(' ').replace(/"/g, '');
            const repoUrl = repo.startsWith('http') ? repo : `https://api.github.com/repos/${repo}`;

            const { data } = await axios.get(repoUrl);
            const embed = new EmbedBuilder()
                .setTitle(data.full_name)
                .setURL(data.html_url)
                .setDescription(data.description || 'No description available.')
                .addFields(
                    { name: 'Stars', value: data.stargazers_count.toString(), inline: true },
                    { name: 'Forks', value: data.forks_count.toString(), inline: true },
                    { name: 'Language', value: data.language || 'Unknown', inline: true },
                )
                .setColor('BLUE')
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching GitHub repository:', error);
            message.reply('Could not fetch repository details. Please check the repository name or URL.');
        }
    },
};
