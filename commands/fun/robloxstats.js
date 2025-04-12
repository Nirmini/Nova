const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const RobloxAPI = require('../../core/APIs/Roblox'); // Import the internal Roblox.js API
const noblox = require('noblox.js'); // Use noblox.js for unsupported features

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
            // Fetch user ID from username using Roblox.js API
            const userId = await RobloxAPI.UserName2ID(username);
            if (!userId) {
                return interaction.reply({ content: '❌ User not found!', flags: MessageFlags.Ephemeral });
            }

            // Fetch general user info using Roblox.js API
            const generalInfo = await RobloxAPI.GetGeneral(userId);
            if (!generalInfo) {
                return interaction.reply({ content: '❌ Failed to fetch user info!', flags: MessageFlags.Ephemeral });
            }

            let { username: accountName, displayName, description, avatarUrl, joinDate } = generalInfo;

            // Fetch additional data using noblox.js
            const profileInfo = await noblox.getPlayerInfo(userId);
            const age = profileInfo.age || 'N/A';
            const friendCount = profileInfo.friendCount || 0;
            const followerCount = profileInfo.followerCount || 0;
            const followingCount = profileInfo.followingCount || 0;

            // Safely handle oldNames
            const oldNames = Array.isArray(profileInfo.oldNames) && profileInfo.oldNames.length > 0
                ? profileInfo.oldNames.join(', ')
                : 'None';

            // Safely handle isBanned
            const isBanned = profileInfo.isBanned ? 'Yes' : 'No';
            let accountNameWithStatus = accountName;
            if (isBanned === 'Yes') {
                accountNameWithStatus += ' **[BANNED]**';
            }

            // Append "☑" if the user is verified
            if (profileInfo.isVerified) {
                accountNameWithStatus += ' ☑';
                displayName += ' ☑';
            }

            if (description.length > 110) {
                description = description.slice(0, 107) + '...'; // Truncate long descriptions
            }

            // Fetch avatar details using Roblox Avatar API
            const avatarDetailsResponse = await RobloxAPI.GetAvtrItms(userId);

            // Check for specific keywords in the description or avatar assets
            let footerText = '';
            if (
                description.toLowerCase().includes('furry') || // Check for "furry" in the description
                avatarDetailsResponse.some(asset =>
                    asset.name.toLowerCase().includes('fursuit') || // Check for "fursuit" in the avatar assets
                    asset.name.toLowerCase().includes('kemono') || // Check for "kemono" in the avatar assets
                    asset.name.toLowerCase().includes('tail') // Check for "tail" in the avatar assets
                )
            ) {
                footerText = '\"UWU\" - West7014';
            }

            // Build the embed
            const embed = new EmbedBuilder()
                .setTitle(`<:Roblox:${novaRobloxEmojiId}> Roblox User Stats`)
                .setURL(`https://www.roblox.com/users/${userId}/profile`)
                .setDescription(`**Username:** ${accountNameWithStatus}\n**Display Name:** ${displayName}`)
                .addFields(
                    { name: 'Description', value: `${description}`, inline: false },
                    { name: 'Account Age (days)', value: `${age}`, inline: true },
                    { name: 'Friends', value: `${friendCount}`, inline: true },
                    { name: 'Followers', value: `${followerCount}`, inline: true },
                    { name: 'Following', value: `${followingCount}`, inline: true },
                )
                .setColor('Blue')
                .setImage(avatarUrl)
                .setTimestamp(new Date(joinDate));

            if (footerText) {
                embed.setFooter({ text: footerText }); // Add the footer if the condition is met
            }

            if (oldNames !== 'None') {
                embed.addFields(
                    { name: 'Previous Names', value: `${oldNames}`, inline: false }
                );
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            const err = error.response?.data || error.message || error;
            console.error('Roblox API error:', err);
            await interaction.reply({ content: '❌ Failed to fetch Roblox user info.', flags: MessageFlags.Ephemeral });
        }
    }
};
