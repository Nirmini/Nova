const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { getGuildConfig, getUserData } = require('../../src/Database');
const { UpdateRankInGroup } = require('../../core/APIs/Roblox');
const emoji = require('../../emoji.json')

module.exports = {
    id: '8000003',
    data: new SlashCommandBuilder()
        .setName('rbrank')
        .setDescription('Update a user\'s Roblox group rank.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Discord user to update Roblox rank for')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('rankname')
                .setDescription('The Roblox rank name to assign')
                .setRequired(true)
        ),
    async execute(interaction) {
        const embed = new EmbedBuilder()
        const discordUser = interaction.options.getUser('user');
        const rankName = interaction.options.getString('rankname');
        const guildId = interaction.guildId;

        // Fetch groupId from guild config
        const guildConfig = await getGuildConfig(guildId);
        const groupId = guildConfig?.rbxgroup;
        if (!groupId) {
            embed.setColor(0xff5050);
            embed.setDescription(`<:NovaFailure:${emoji.NovaFailure}> No Roblox group is set for this server!`);
            return interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
        }

        // Fetch Roblox userId from user data
        const userData = await getUserData(discordUser.id);
        const robloxUserId = userData?.Roblox?.userId;
        if (!robloxUserId) {
            embed.setColor(0xff5050);
            embed.setDescription(`<:NovaFailure:${emoji.NovaFailure}> This user doesn't have a linked Roblox account!`);
            return interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
        }

        // Fetch group roles to find rankId for rankName
        let rankId = null;
        try {
            const axios = require('axios');
            const response = await axios.get(`https://groups.roblox.com/v1/groups/${groupId}/roles`);
            if (response.data && Array.isArray(response.data.roles)) {
                const roleObj = response.data.roles.find(r => r.name.toLowerCase() === rankName.toLowerCase());
                if (roleObj) rankId = roleObj.id;
            }
        } catch (err) {
            embed.setColor(0xb0ffff);
            embed.setDescription(`<:Warning:${emoji.Warning}> An error occured while getting group roles!`);
            return interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
        }

        if (!rankId) {
            embed.setColor(0xb0ffff)
            embed.setDescription(`<:NovaFailure:${emoji.NovaFailure}> The requested rank (\`${rankName}\`) was not found.`)
            return interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
        }

        // Update rank using Roblox API
        const result = await UpdateRankInGroup(groupId, robloxUserId, rankId);
        if (!result) {
            return interaction.reply({
                content: 'Failed to update rank. Please check permissions and try again.',
                flags: MessageFlags.Ephemeral
            });
        }

        embed.setColor(0x43b581)
        embed.setTitle('Roblox Rank Updated')
        embed.setDescription(`Successfully updated <@${discordUser.id}>'s rank to **${rankName}** in group **${groupId}**.`);
        
        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
};