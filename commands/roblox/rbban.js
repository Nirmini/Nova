const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { getGuildConfig, getUserData } = require('../../src/Database');
const { RemoveUserFromGroup } = require('../../core/APIs/Roblox');
const emoji = require('../../emoji.json');

module.exports = {
    id: '8000001',
    data: new SlashCommandBuilder()
        .setName('rbban')
        .setDescription('Ban a user from the Roblox group (removes user from group).')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Discord user to ban from Roblox group')
                .setRequired(true)
        ),
    async execute(interaction) {
        const embed = new EmbedBuilder();
        const discordUser = interaction.options.getUser('user');
        const guildId = interaction.guildId;

        // Fetch groupId from guild config
        const guildConfig = await getGuildConfig(guildId);
        const groupId = guildConfig?.rbxgroup;
        if (!groupId) {
            embed.setColor(0xff5050);
            embed.setDescription(`<:NovaFailure:${emoji.NovaFailure}> No Roblox group is set for this server!`);
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Fetch Roblox userId from user data
        const userData = await getUserData(discordUser.id);
        const robloxUserId = userData?.Roblox?.userId;
        if (!robloxUserId) {
            embed.setColor(0xff5050);
            embed.setDescription(`<:NovaFailure:${emoji.NovaFailure}> This user doesn't have a linked Roblox account!`);
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Ban user using Roblox API (same as kick, just for command semantics)
        const result = await RemoveUserFromGroup(groupId, robloxUserId);
        if (!result) {
            embed.setColor(0xff5050);
            embed.setDescription(`<:NovaFailure:${emoji.NovaFailure}> Failed to ban user from group. Please check permissions and try again.`);
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        embed.setColor(0x43b581);
        embed.setDescription(`<:NovaSuccess:${emoji.NovaSuccess}> Successfully banned <@${discordUser.id}> from group **${groupId}**.`);
        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
};