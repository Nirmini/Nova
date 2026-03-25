const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
const { env } = require('process');
require('dotenv').config();

module.exports = {
    id: '5000009', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('spotify')
        .setDescription('Get information about a Spotify track.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Spotify track URL')
                .setRequired(true)),
    async execute(interaction) {
        const url = interaction.options.getString('url');
        const trackId = url.split('/track/')[1]?.split('?')[0];

        if (!trackId) {
            return interaction.reply({ content: 'Invalid Spotify URL.', flags: MessageFlags.Ephemeral });
        }

        try {
            const clientId = process.env.SPOT_CID
            const clientSecret = process.env.SPOT_CSC
            const { data: tokenData } = await axios.post('https://accounts.spotify.com/api/token', null, {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
                },
                params: { grant_type: 'client_credentials' }
            });

            const { data: trackData } = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
            });

            const embed = new EmbedBuilder()
                .setTitle(trackData.name)
                .setURL(trackData.external_urls.spotify)
                .setThumbnail(trackData.album.images[0].url)
                .addFields(
                    { name: 'Artist', value: trackData.artists.map(artist => artist.name).join(', '), inline: true },
                    { name: 'Album', value: trackData.album.name, inline: true },
                    { name: 'Release Date', value: trackData.album.release_date, inline: true }
                );

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching Spotify data:', error);
            await interaction.reply({ content: 'Failed to fetch Spotify track. Please try again.', flags: MessageFlags.Ephemeral });
        }
    },
};
