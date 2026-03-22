const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const noblox = require('noblox.js');
const RobloxAPI = require('../../core/APIs/Roblox.js');
const fetch = require('node-fetch');

async function getGroupId(groupName) {
    try {
        const response = await fetch(`https://groups.roproxy.com/v1/groups/search/lookup?groupName=${encodeURIComponent(groupName)}`);
        const data = await response.json();
        if (data.data && data.data.length > 0) {
            return data.data[0].id;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching group ID:", error);
        return null;
    }
}

async function fetchGroupIcon(groupId) {
    try {
        const res = await fetch(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size=150x150&format=Png&isCircular=false`);
        const data = await res.json();
        if (data.data && data.data[0] && data.data[0].imageUrl) {
            return data.data[0].imageUrl;
        }
    } catch (e) {
        console.error("Error fetching group icon:", e);
    }
    return null;
}

module.exports = {
    id: '4000006', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('rgroup')
        .setDescription('Get info about a Roblox group')
        .addSubcommand(sub =>
            sub.setName('name')
                .setDescription('Get group info by group name')
                .addStringOption(opt =>
                    opt.setName('groupname')
                        .setDescription('Roblox group name (e.g. Nirmini Development)')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('id')
                .setDescription('Get group info by group ID')
                .addStringOption(opt =>
                    opt.setName('groupid')
                        .setDescription('Roblox group ID')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();

        let groupId;
        if (interaction.options.getSubcommand() === 'name') {
            const groupName = interaction.options.getString('groupname');
            groupId = await getGroupId(groupName);
            if (!groupId) {
                await interaction.editReply('Could not resolve the Roblox group from the name.');
                return;
            }
        } else if (interaction.options.getSubcommand() === 'id') {
            const groupIdInput = interaction.options.getString('groupid');
            if (!/^\d+$/.test(groupIdInput)) {
                await interaction.editReply('Group ID must be a number.');
                return;
            }
            groupId = Number(groupIdInput);
        }

        // Get group info (try noblox first, then fallback to RobloxAPI)
        let groupInfo;
        try {
            groupInfo = await noblox.getGroup(groupId);
        } catch {
            groupInfo = await RobloxAPI.GetGroupInfo(groupId);
        }

        if (!groupInfo) {
            await interaction.editReply('Could not fetch group info.');
            return;
        }

        // Get group icon using the thumbnails API
        let iconUrl = groupInfo.thumbnail || groupInfo.icon || null;
        if (!iconUrl) {
            iconUrl = await fetchGroupIcon(groupId);
        }

        const embed = new EmbedBuilder()
            .setTitle(groupInfo.name || 'Unknown Group')
            .setThumbnail(iconUrl || null)
            .setURL(`https://www.roblox.com/groups/${groupId}`)
            .setDescription(
                (groupInfo.description ? groupInfo.description.slice(0, 80) : 'No description.') +
                (groupInfo.description && groupInfo.description.length > 80 ? '...' : '')
            )
            .addFields(
                { name: 'Members', value: groupInfo.memberCount ? groupInfo.memberCount.toLocaleString() : 'Unknown', inline: true }
            )
            .setFooter({ text: `Group ID: ${groupId}` })
            .setColor(0x0099ff);

        await interaction.editReply({ embeds: [embed] });
    }
};