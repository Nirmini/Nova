const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const githubToken = process.env.GTHBTOKEN; // Ensure this is set in .env

module.exports = {
    id: '0000008', // Unique 6-digit command ID
    /**
     * Executes the github command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        const args = message.content.split(' ').slice(1); // Split the message into arguments
        if (args.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('GitHub Command Help')
                .setDescription('Usage: `?github <Repo URL or user/repo>`')
                .setColor(0x0099ff)
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        try {
            const repoInput = args.join(' ').replace(/"/g, '');
            let owner, repo;

            // If a full GitHub URL is provided, extract the owner and repo
            const match = repoInput.match(/github\.com\/([\w-]+)\/([\w-]+)/);
            if (match) {
                [_, owner, repo] = match;
            } else {
                // If it's a shorthand like "owner/repo", split it manually
                [owner, repo] = repoInput.split('/');
            }

            if (!owner || !repo) {
                return message.reply('Invalid repository format. Use `?github <Repo URL>` or `?github <owner/repo>`.');
            }

            const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
            const languagesUrl = `https://api.github.com/repos/${owner}/${repo}/languages`;

            // Fetch repository data
            const { data } = await axios.get(apiUrl, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            });

            // Fetch languages
            const { data: langData } = await axios.get(languagesUrl, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            });
            const mostUsedLang = Object.keys(langData)[0] || 'Unknown';

            // Extract license info
            const license = data.license ? data.license.name : 'None';

            const embed = new EmbedBuilder()
                .setTitle(data.full_name)
                .setURL(data.html_url)
                .setDescription(data.description || 'No description available.')
                .addFields(
                    { name: '🔗 Repo', value: `[${data.full_name}](${data.html_url})`, inline: false },
                    { name: '⭐ Stars', value: data.stargazers_count.toString(), inline: true },
                    { name: '🍴 Forks', value: data.forks_count.toString(), inline: true },
                    { name: '🐞 Open Issues', value: data.open_issues_count.toString(), inline: true },
                    { name: '💻 Most Used Language', value: mostUsedLang, inline: true },
                    { name: '📜 License', value: license, inline: true },
                )
                .setColor(0x0099ff)
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching GitHub repository:', error);
            message.reply('Could not fetch repository details. Please check the repository name or URL.');
        }
    },
};
