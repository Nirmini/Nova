const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

const sourceGuildId = '1281856503447425188'; // Source guild ID
const sourceChannelId = '1343391393229312052'; // Source announcement channel ID

module.exports = {
    id: '2141310', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('statusupdates')
        .setDescription('Set a channel to recieve status updates from the NDT.')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The target channel.')
                .setRequired(true)),
    
    async execute(interaction) {
        const targetGuildId = interaction.guildId;

        // Check if the user has the required permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
            return;
        }

        const targetChannel = interaction.options.getChannel('channel');

        try {
            // Get the client
            const client = interaction.client;

            // Fetch the source guild and source channel
            const sourceGuild = await client.guilds.fetch(sourceGuildId);
            const sourceChannel = await sourceGuild.channels.fetch(sourceChannelId);

            if (!sourceChannel || sourceChannel.type !== 5) { // 5 = Announcement Channel
                await interaction.reply({ content: 'The source announcement channel does not exist or is not an announcement channel.', flags: MessageFlags.Ephemeral });
                return;
            }

            if (targetChannel.type !== 0) { // 0 = Text Channel
                await interaction.reply({ content: 'The specified target channel must be a text channel.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Follow the source announcement channel
            await sourceChannel.addFollower(targetChannel.id, `Following updates from ${sourceChannel.name}`);

            await interaction.reply({ content: `The channel ${targetChannel} is now following updates from the source announcement channel.`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error handling updates command:', error);
            await interaction.reply({ content: 'There was an error setting up the channel to follow the announcement channel. Please try again later.', flags: MessageFlags.Ephemeral });
        }
    },
};
