const { SlashCommandBuilder, PermissionsBitField, MessageFlags, ChannelType } = require('discord.js');

const updatesSourceGuildId = '1225142849922928661'; // Source guild ID for updates
const updatesSourceChannelId = '1360019129821827276'; // Source announcement channel ID for updates

const statusSourceGuildId = '1225142849922928661'; // Source guild ID for status updates
const statusSourceChannelId = '1360019791322284232'; // Source announcement channel ID for status updates

module.exports = {
    id: '2141310', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('subscribe')
        .setDescription('Subscribe a channel to updates or status notifications.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('updates')
                .setDescription('Subscribe a channel to follow the updates announcement channel.')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel to follow the updates announcement channel.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Subscribe a channel to receive status updates.')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel to receive status updates.')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const targetChannel = interaction.options.getChannel('channel');

        // Check if the user has the required permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            // Get the client
            const client = interaction.client;

            // Handle the logic for each subcommand
            if (subcommand === 'updates') {
                // Fetch the source guild and source channel for updates
                const sourceGuild = await client.guilds.fetch(updatesSourceGuildId);
                const sourceChannel = await sourceGuild.channels.fetch(updatesSourceChannelId);

                if (!sourceChannel || sourceChannel.type !== ChannelType.GuildAnnouncement) {
                    await interaction.reply({ content: 'The source updates announcement channel does not exist or is not an announcement channel.', flags: MessageFlags.Ephemeral });
                    return;
                }

                if (targetChannel.type !== ChannelType.GuildText) {
                    await interaction.reply({ content: 'The specified target channel must be a text channel.', flags: MessageFlags.Ephemeral });
                    return;
                }

                // Follow the source announcement channel
                await sourceChannel.addFollower(targetChannel.id, `Following updates from ${sourceChannel.name}`);

                await interaction.reply({ content: `The channel ${targetChannel} is now following updates from the source announcement channel.`, flags: MessageFlags.Ephemeral });
            } else if (subcommand === 'status') {
                // Fetch the source guild and source channel for status updates
                const sourceGuild = await client.guilds.fetch(statusSourceGuildId);
                const sourceChannel = await sourceGuild.channels.fetch(statusSourceChannelId);

                if (!sourceChannel || sourceChannel.type !== ChannelType.GuildAnnouncement) {
                    await interaction.reply({ content: 'The source status announcement channel does not exist or is not an announcement channel.', flags: MessageFlags.Ephemeral });
                    return;
                }

                if (targetChannel.type !== ChannelType.GuildText) {
                    await interaction.reply({ content: 'The specified target channel must be a text channel.', flags: MessageFlags.Ephemeral });
                    return;
                }

                // Follow the source announcement channel
                await sourceChannel.addFollower(targetChannel.id, `Following status updates from ${sourceChannel.name}`);

                await interaction.reply({ content: `The channel ${targetChannel} is now following status updates from the source announcement channel.`, flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: 'Invalid subcommand.', flags: MessageFlags.Ephemeral });
            }
        } catch (error) {
            console.error('Error handling subscribe command:', error);
            await interaction.reply({ content: 'There was an error setting up the channel to follow the announcement channel. Please try again later.', flags: MessageFlags.Ephemeral });
        }
    },
};