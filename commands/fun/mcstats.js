const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    id: '4000005', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('mcstats')
        .setDescription('Get detailed stats of a Minecraft player.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Enter the Minecraft username')
                .setRequired(true)
        ),

    async execute(interaction) {
        const username = interaction.options.getString('username');

        try {
            // Fetch UUID from username
            const userResponse = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
            
            if (!userResponse.data || !userResponse.data.id) {
                return interaction.reply({ content: '❌ Player not found!', flags: MessageFlags.Ephemeral });
            }

            const uuid = userResponse.data.id;
            const displayName = userResponse.data.name;

            // Fetch Profile Data for Join Date
            const profileResponse = await axios.get(`https://api.ashcon.app/mojang/v2/user/${username}`);
            const joinDate = profileResponse.data.created_at 
                ? new Date(profileResponse.data.created_at).toDateString() 
                : 'Unknown';

            // Get 3D Rendered Skin Model
            const skinRenderUrl = `https://crafatar.com/renders/body/${uuid}?overlay=true`;

            // Build Embed
            const embed = new EmbedBuilder()
                .setTitle(`🎮 Minecraft Player Stats`)
                .setDescription(`**Username:** ${displayName}\n**UUID:** ${uuid}\n**Join Date:** ${joinDate}`)
                .setColor('Green')
                .setImage(skinRenderUrl) // 3D Rendered Skin Below UUID
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Minecraft API error:', error.message);
            await interaction.reply({ content: '❌ Failed to fetch Minecraft player info.', flags: MessageFlags.Ephemeral });
        }
    }
};
