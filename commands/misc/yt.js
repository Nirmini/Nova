const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    id: '5000013', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('yt')
        .setDescription('Get information about a YouTube video.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('YouTube video URL')
                .setRequired(true)),
    async execute(interaction) {
        const url = interaction.options.getString('url');
        const videoId = url.split('v=')[1]?.split('&')[0];

        if (!videoId) {
            return interaction.reply({ content: 'Invalid YouTube URL.', flags: MessageFlags.Ephemeral });
        }

        try {
            const apiKey = process.env.YTAPIKEY;
            const { data } = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
                params: {
                    id: videoId,
                    key: apiKey,
                    part: 'snippet,statistics'
                }
            });

            const video = data.items[0];

            // Truncate description to 160 characters
            let description = video.snippet.description || 'No description available.';
            if (description.length > 160) {
                description = `${description.slice(0, 157)}...`;
            }

            const embed = new EmbedBuilder()
                .setTitle(video.snippet.title)
                .setURL(url)
                .setDescription(description)
                .setThumbnail(video.snippet.thumbnails.high.url)
                .addFields(
                    { name: 'Channel', value: video.snippet.channelTitle, inline: true },
                    { name: 'Views', value: video.statistics.viewCount.toLocaleString(), inline: true },
                    { name: 'Likes', value: video.statistics.likeCount?.toLocaleString() || 'N/A', inline: true }
                )
                .setFooter({ text: `Published on ${new Date(video.snippet.publishedAt).toLocaleDateString()}` });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching YouTube video:', error);
            await interaction.reply({ content: 'Failed to fetch video details. Please try again.', flags: MessageFlags.Ephemeral });
        }
    },
};
