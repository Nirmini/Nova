const { EmbedBuilder, Events } = require('discord.js');
const { getGuildConfig } = require('../src/Database');
const client = require('../core/global/Client');

// Map internal event names → config keys
const EVENT_KEY_MAP = {
    messageDelete: "message_delete",
    messageEdit: "message_edit",
    bulkMessageDelete: "message_bulkdel",
    messageInvite: "message_invites",
    messageModCmd: "message_modcmds", // When a command in /commands/moderation is run.
    memberJoin: "members_join",
    memberLeave: "members_leave",
    memberRoleAdd: "members_roleadd",
    memberRoleRemove: "members_rolerem",
    memberTimeout: "members_timeout",
    nicknameChange: "members_nickchg",
    memberBan: "members_banned",
    memberUnban: "members_unbaned",
    roleCreate: "role_create",
    roleDelete: "role_delete",
    roleUpdate: "role_update",
    channelCreate: "chnnl_create",
    channelUpdate: "chnnl_update",
    channelDelete: "chnnl_delete",
    emojiCreate: "emoji_create",
    emojiUpdate: "emoji_update",
    emojiDelete: "emoji_delete",
    voiceChannelJoin: "voice_join",
    voiceChannelLeave: "voice_leave",
    voiceChannelMove: "voice_trans",
};

// Ensure webhook for a given channel
async function getOrCreateWebhook(channel) {
    if (!channel || !channel.isTextBased()) return null;

    const webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find(wh => wh.owner && wh.owner.id === client.user.id);

    if (!webhook) {
        webhook = await channel.createWebhook({ name: "Nova" });
    }

    return webhook;
}

// Main logger
async function sendActionLog(guild, eventType, description) {
    const actionConfig = await getGuildConfig(guild.id, 'actionlogs');
    if (!actionConfig || !actionConfig.enabled) return;

    const configKey = EVENT_KEY_MAP[eventType];
    if (!configKey || !actionConfig.modules[configKey]) return;

    const eventConfig = actionConfig.modules[configKey];
    if (!eventConfig.enabled) return;

    // Pick channel
    let channelId = eventConfig.logchannel;
    if (!channelId && actionConfig.usecommonlogc) {
        channelId = actionConfig.logchannel;
    }
    if (!channelId) return;

    const logChannel = guild.channels.cache.get(channelId);
    if (!logChannel || !logChannel.isTextBased()) return;

    const webhook = await getOrCreateWebhook(logChannel);
    if (!webhook) return;

    const embed = new EmbedBuilder()
        .setTitle(`Action Log: ${eventType}`)
        .setDescription(description)
        .setColor(0x7289DA)
        .setTimestamp()
        .setFooter({ text: guild.name });

    await webhook.send({
        username: "Nova",
        avatarURL: "https://thatwest7014.pages.dev/imgs/Nova/v4/Nightsmith-V3Logo-Dev.png",
        embeds: [embed]
    });
}

// === Events ===
// Message Events
client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;
    await sendActionLog(message.guild, "messageDelete",
        `A message by **${message.author.tag}** was deleted in <#${message.channel.id}>.\n**Content:** ${message.content || '[Attachment]'}`
    );
});

client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    await sendActionLog(oldMessage.guild, "messageEdit",
        `A message by **${oldMessage.author.tag}** was edited in <#${oldMessage.channel.id}>.\n**Before:** ${oldMessage.content}\n**After:** ${newMessage.content}`
    );
});

client.on(Events.MessageBulkDelete, async (messages) => {
    const guild = messages.first()?.guild;
    if (!guild) return;

    await sendActionLog(guild, "bulkMessageDelete",
        `**${messages.size} messages** were bulk deleted in <#${messages.first().channel.id}>.`
    );
});

// Member Events
client.on(Events.GuildMemberAdd, async (member) => {
    await sendActionLog(member.guild, "memberJoin", `**${member.user.tag}** joined the server.`);
});

client.on(Events.GuildMemberRemove, async (member) => {
    await sendActionLog(member.guild, "memberLeave", `**${member.user.tag}** left the server.`);
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (oldMember.nickname !== newMember.nickname) {
        await sendActionLog(newMember.guild, "nicknameChange",
            `**${newMember.user.tag}** changed their nickname from **${oldMember.nickname || 'None'}** to **${newMember.nickname || 'None'}**.`
        );
    }

    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

        if (addedRoles.size) {
            await sendActionLog(newMember.guild, "memberRoleAdd",
                `**${newMember.user.tag}** was given the role(s): ${addedRoles.map(r => `\`${r.name}\``).join(', ')}`
            );
        }
        if (removedRoles.size) {
            await sendActionLog(newMember.guild, "memberRoleRemove",
                `**${newMember.user.tag}** had the role(s) removed: ${removedRoles.map(r => `\`${r.name}\``).join(', ')}`
            );
        }
    }
});

// Role Events
client.on(Events.GuildRoleCreate, async (role) => {
    await sendActionLog(role.guild, "roleCreate", `Role \`${role.name}\` was created.`);
});

client.on(Events.GuildRoleDelete, async (role) => {
    await sendActionLog(role.guild, "roleDelete", `Role \`${role.name}\` was deleted.`);
});

client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
    if (oldRole.name !== newRole.name) {
        await sendActionLog(newRole.guild, "roleUpdate", `Role **${oldRole.name}** was renamed to **${newRole.name}**.`);
    }
});

// Channel Events
client.on(Events.ChannelCreate, async (channel) => {
    await sendActionLog(channel.guild, "channelCreate", `Channel <#${channel.id}> (\`${channel.name}\`) was created.`);
});

client.on(Events.ChannelDelete, async (channel) => {
    await sendActionLog(channel.guild, "channelDelete", `Channel \`${channel.name}\` was deleted.`);
});

client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
    if (oldChannel.name !== newChannel.name) {
        await sendActionLog(newChannel.guild, "channelUpdate", `Channel \`${oldChannel.name}\` was renamed to \`${newChannel.name}\`.`);
    }
});

// Emoji Events
client.on(Events.GuildEmojiCreate, async (emoji) => {
    await sendActionLog(emoji.guild, "emojiCreate", `Emoji \`${emoji.name}\` was created.`);
});

client.on(Events.GuildEmojiDelete, async (emoji) => {
    await sendActionLog(emoji.guild, "emojiDelete", `Emoji \`${emoji.name}\` was deleted.`);
});

client.on(Events.GuildEmojiUpdate, async (oldEmoji, newEmoji) => {
    if (oldEmoji.name !== newEmoji.name) {
        await sendActionLog(newEmoji.guild, "emojiUpdate", `Emoji \`${oldEmoji.name}\` was renamed to \`${newEmoji.name}\`.`);
    }
});

// Voice Events
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if (!oldState.channel && newState.channel) {
        await sendActionLog(newState.guild, "voiceChannelJoin",
            `**${newState.member.user.tag}** joined voice channel <#${newState.channel.id}>.`
        );
    } else if (oldState.channel && !newState.channel) {
        await sendActionLog(oldState.guild, "voiceChannelLeave",
            `**${oldState.member.user.tag}** left voice channel <#${oldState.channel.id}>.`
        );
    } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
        await sendActionLog(newState.guild, "voiceChannelMove",
            `**${oldState.member.user.tag}** moved from <#${oldState.channel.id}> to <#${newState.channel.id}>.`
        );
    }
});
