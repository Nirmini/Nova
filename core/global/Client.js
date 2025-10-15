const { Client, IntentsBitField, Collection, GatewayIntentBits, Partials } = require('discord.js');

const client = new Client({
    intents: [
        // Basic Stuff. Don't touch!
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        // DM Events and such. Don't touch!
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.DirectMessageTyping,
        IntentsBitField.Flags.DirectMessagePolls,
        IntentsBitField.Flags.DirectMessageReactions,
        // VC Stuff. Forgot why this is here.
        IntentsBitField.Flags.GuildVoiceStates,
        // Automod Module stuff. Don't touch!
        IntentsBitField.Flags.AutoModerationConfiguration,
        IntentsBitField.Flags.AutoModerationExecution,
        // Various other guild stuff.
        IntentsBitField.Flags.GuildInvites,
        IntentsBitField.Flags.GuildExpressions,
        IntentsBitField.Flags.GuildInvites,
        IntentsBitField.Flags.GuildModeration,
        IntentsBitField.Flags.GuildWebhooks
    ],
    partials: [
        Partials.Channel 
        //Partials.Message,
        //Partials.User,
        //Partials.GuildMember,
        //Partials.ThreadMember,
        //Partials.Reaction,
        //Partials.GuildScheduledEvent
    ]
});

client.commands = new Collection();

module.exports = client
//OwO