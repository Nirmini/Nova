const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
require('dotenv').config();
const noblox = require('noblox.js');

const novaRobloxEmojiId = '1335069604032282655'; // Nova Info emoji

module.exports = {
    id: '4921303', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('robloxstats')
        .setDescription('Get detailed stats of a Roblox user.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Enter the Roblox username')
                .setRequired(true)
        ),

    async execute(interaction) {
        const username = interaction.options.getString('username');

        try {
            // Fetch user ID from username
            const userResponse = await axios.post('https://users.roblox.com/v1/usernames/users', {
                usernames: [username],
                excludeBannedUsers: false
            }, { headers: { 'Content-Type': 'application/json' } });

            if (!userResponse.data.data.length) {
                return interaction.reply({ content: '❌ User not found!', flags: MessageFlags.Ephemeral });
            }

            const userId = userResponse.data.data[0].id;
            const displayName = userResponse.data.data[0].displayName;
            const accountName = userResponse.data.data[0].name;

            // Fetch additional user info
            const userInfoResponse = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
            const joinDate = new Date(userInfoResponse.data.created).toDateString();

            // Fetch user description from Roblox OpenCloud API
            let description = userInfoResponse.data.description || 'No description available.';
            if (description.length > 90) {
                description = `${description.slice(0, 257)}...`;
            }

            // Fetch additional data using noblox.js
            const profileInfo = await noblox.getPlayerInfo(userId);

            const age = profileInfo.age || 'N/A';
            const friendCount = profileInfo.friendCount || 0;
            const followerCount = profileInfo.followerCount || 0;
            const followingCount = profileInfo.followingCount || 0;
            const oldNames = profileInfo.oldNames.length > 0 ? profileInfo.oldNames.join(', ') : 'None';
            const isBanned = profileInfo.isBanned ? 'Yes' : 'No';

            // Fetch avatar using Roblox Thumbnail API
            const avatarResponse = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar`, {
                params: {
                    userIds: userId,
                    size: "420x420",
                    format: "Png",
                    isCircular: false
                }
            });

            // Extract avatar URL
            let avatarUrl = 'https://tr.rbxcdn.com/default-avatar.png'; // Default if not found
            if (avatarResponse.data && avatarResponse.data.data.length > 0) {
                avatarUrl = avatarResponse.data.data[0].imageUrl;
            }

            // Build the embed
            const embed = new EmbedBuilder()
                .setTitle(`<:Roblox:${novaRobloxEmojiId}>  Roblox User Stats`)
                .setDescription(`**Username:** ${accountName}\n**Display Name:** ${displayName}\n**Join Date:** ${joinDate}`)
                .addFields(
                    { name: 'Description', value: `${description}`, inline: false},
                    { name: 'Account Age (days)', value: `${age}`, inline: true },
                    { name: 'Friends', value: `${friendCount}`, inline: true },
                    { name: 'Banned?', value: `${isBanned}`, inline: true},
                    { name: 'Followers', value: `${followerCount}`, inline: true },
                    { name: 'Following', value: `${followingCount}`, inline: true },
                )
                .setColor('Blue')
                .setImage(avatarUrl)
                .setTimestamp();

                if (oldNames != 'None') {
                    embed.addFields(
                        { name: 'Previous Names', value: `${oldNames}`, inline: false }
                    )
                }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Roblox API error:', error.response?.data || error.message);
            await interaction.reply({ content: '❌ Failed to fetch Roblox user info.', flags: MessageFlags.Ephemeral });
        }
    }
};
