const { Client, IntentsBitField, Collection, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        // CORE
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        // DMs
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.DirectMessageTyping,
        IntentsBitField.Flags.DirectMessagePolls,
        IntentsBitField.Flags.DirectMessageReactions,
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
    ],
    partials: ['CHANNEL']
});

client.commands = new Collection();

module.exports = client
//OwO