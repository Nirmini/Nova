const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
const { env } = require('process');
require('dotenv').config();

module.exports = {
    id: '5657524', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('itunes')
        .setDescription('Search for iTunes media.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Search query')
                .setRequired(true)),
    async execute(interaction) {
        const query = interaction.options.getString('query');

        try {
            const { data } = await axios.get('https://itunes.apple.com/search', {
                params: { term: query, limit: 1 }
            });

            const result = data.results[0];
            if (!result) {
                return interaction.reply({ content: 'No results found.', flags: MessageFlags.Ephemeral });
            }

            const embed = new EmbedBuilder()
                .setTitle(result.trackName || result.collectionName)
                .setURL(result.trackViewUrl || result.collectionViewUrl)
                .setThumbnail(result.artworkUrl100)
                .addFields(
                    { name: 'Artist', value: result.artistName, inline: true },
                    { name: 'Album', value: result.collectionName || 'N/A', inline: true },
                    { name: 'Release Date', value: new Date(result.releaseDate).toLocaleDateString(), inline: true }
                );

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching iTunes data:', error);
            await interaction.reply({ content: 'Failed to fetch iTunes media. Please try again.', flags: MessageFlags.Ephemeral });
        }
    },
};
