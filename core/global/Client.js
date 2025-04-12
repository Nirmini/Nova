const { Client, IntentsBitField, Collection } = require('discord.js');

const client = new Client({
    intents: [
        // CORE
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        // VOICE CHANNELS
        IntentsBitField.Flags.GuildVoiceStates,
        // AUTOMOD
        IntentsBitField.Flags.AutoModerationConfiguration,
        IntentsBitField.Flags.AutoModerationExecution,
        // MODMAIL
        IntentsBitField.Flags.DirectMessagePolls,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.DirectMessageTyping,
        // ANTI RAID
        IntentsBitField.Flags.GuildInvites,
        // ETC
        IntentsBitField.Flags.GuildExpressions,
        IntentsBitField.Flags.GuildInvites,
        IntentsBitField.Flags.GuildModeration,
        IntentsBitField.Flags.GuildWebhooks
    ]
});

client.commands = new Collection();

module.exports = client
//OwU