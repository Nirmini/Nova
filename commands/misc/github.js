const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config();

const githubToken = process.env.GTHBTOKEN; // Ensure this is set in .env

module.exports = {
    id: '5000003', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('github')
        .setDescription('Fetch information about a GitHub repository')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('The URL of the GitHub repository')
                .setRequired(true)),

    async execute(interaction) {
        const repoUrl = interaction.options.getString('url');

        // Improved regex to support usernames with hyphens and multiple characters
        const match = repoUrl.match(/github\.com\/([\w-]+)\/([\w-]+)/);
        if (!match) {
            return interaction.reply({ 
                content: 'Invalid GitHub repository URL. Please provide a valid link like `https://github.com/user/repo`.', 
                flags: 64 
            });
        }

        const [_, owner, repo] = match;
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const languagesUrl = `https://api.github.com/repos/${owner}/${repo}/languages`;

        try {
            // Fetch repository data
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            });

            if (response.status === 404) {
                return interaction.reply({ 
                    content: 'Repository not found. Please check the URL.', 
                    flags: 64 
                });
            }

            if (!response.ok) {
                return interaction.reply({ 
                    content: `GitHub API error: ${response.statusText}`, 
                    flags: 64 
                });
            }

            const data = await response.json();

            // Fetch languages
            const langResponse = await fetch(languagesUrl, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            });
            const langData = await langResponse.json();
            const mostUsedLang = Object.keys(langData)[0] || 'Unknown';

            // Extract license info
            const license = data.license ? data.license.name : 'None';

            // Create an embed with repository details
            const embed = {
                color: 0x0099ff,
                title: data.full_name,
                url: data.html_url,
                description: data.description || 'No description available.',
                fields: [
                    { name: '🔗 Repo', value: `[${data.full_name}](${data.html_url})`, inline: false },
                    { name: '⭐ Stars', value: data.stargazers_count.toString(), inline: true },
                    { name: '🍴 Forks', value: data.forks_count.toString(), inline: true },
                    { name: '🐞 Open Issues', value: data.open_issues_count.toString(), inline: true },
                    { name: '💻 Most Used Language', value: mostUsedLang, inline: true },
                    { name: '📜 License', value: license, inline: true },
                ],
                footer: {
                    text: `Repository created on ${new Date(data.created_at).toDateString()}`,
                },
            };

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching GitHub repository:', error);
            await interaction.reply({ 
                content: 'An unexpected error occurred while fetching the repository information.', 
                flags: 64 
            });
        }
    },
};
