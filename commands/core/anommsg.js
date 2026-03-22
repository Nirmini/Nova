const { SlashCommandBuilder, PermissionsBitField, ChannelType, MessageFlags } = require('discord.js');
const { setUserData, getUserData, setGuildConfig, getGuildConfig } = require('../../src/Database'); // Firebase Admin functions

/**
 * TO BE REFACTORED
 * 
 * Cover user ident with ATicket IDs
 */

module.exports = {
    id: '2000002',
    data: new SlashCommandBuilder()
        .setName('anommsg')
        .setDescription('Send anonymous messages or manage the system.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription('Send an anonymous message.')
                .addStringOption(option =>
                    option
                        .setName('text')
                        .setDescription('The message to send.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('track')
                .setDescription('Track a user\'s anonymous messages.')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to track.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a user from sending anonymous messages.')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to ban.')
                        .setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guild = interaction.guild;
        const firebasePath = 'anommsg'; // Root path for storing data in Firebase

        // This will return null if the interaction is not in a guild and the ! will flip the result so it will return true and return without doing anything.
        if (!interaction.guild.id) {
            await interaction.reply({ content: 'This command can only be used in servers.', flags: MessageFlags.Ephemeral });
            return;
        }
        
        // Ensure the category exists
        let category = guild.channels.cache.find(channel => channel.name === 'AnomTickets' && channel.type === ChannelType.GuildCategory);
        if (!category) {
            category = await guild.channels.create({
                name: 'AnomTickets',
                type: ChannelType.GuildCategory
            });
        }

        if (subcommand === 'send') {
            const userId = interaction.user.id;

            // Check if the user is banned in Firebase
            const bannedUsers = await getGuildConfig(guildId, 'anonymous/banned') || [];
            if (bannedUsers.includes(userId)) {
                const BannedMsg = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('<:ShieldDenied:1329622917109252247> You are banned from sending anonymous messages.')
                await interaction.reply({ embeds: [BannedMsg], flags: MessageFlags.Ephemeral });
                return;
            }

            const messageText = interaction.options.getString('text');

            // Create a ticket channel
            const ticketChannel = await guild.channels.create({
                name: `aticket-${Date.now()}`,
                type: ChannelType.GuildText,
                parent: category.id,
                topic: `Anonymous message ticket.`,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, // Deny public view
                    { id: interaction.client.user.id, allow: [PermissionsBitField.Flags.ViewChannel] } // Bot access
                ]
            });

            // Log the message in Firebase
            const userLogs = (await getUserData(userId, 'anon_logs')) || [];
            userLogs.push({ message: messageText, channel: ticketChannel.id, timestamp: new Date().toISOString() });
            await setUserData(interaction.user.id, 'anon_logs', userLogs);

            // Send the message in the ticket channel
            const ticketEmbed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('Anonymous Message')
                .setDescription(messageText)
                .setFooter({ text: `Sent by ${interaction.member.roles.highest.name}` });

            await ticketChannel.send({ embeds: [ticketEmbed] });

            await interaction.reply({ content: 'Your anonymous message has been sent!', flags: MessageFlags.Ephemeral });
        } else if (subcommand === 'track') {
            // Check permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                await interaction.reply({ content: 'You lack the necessary permissions to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }

            const user = interaction.options.getUser('user');
            const userLogs = (await getUserData(user.id, 'anon_logs')) || [];

            if (userLogs.length === 0) {
                await interaction.reply({ content: 'This user has not sent any anonymous messages.', flags: MessageFlags.Ephemeral });
                return;
            }

            const logMessages = userLogs.map(log => `Message: "${log.message}" in <#${log.channel}> at ${log.timestamp}`).join('\n');
            await interaction.reply({ content: `Anonymous messages for ${user.tag}:\n${logMessages}`, flags: MessageFlags.Ephemeral });
        } else if (subcommand === 'ban') {
            // Check permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                await interaction.reply({ content: 'You lack the necessary permissions to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }

            const user = interaction.options.getUser('user');
            const bannedUsersPath = `${firebasePath}/banned`;
            const bannedUsers = await getGuildConfig(guildId, 'anon_logs/banned') || [];

            if (bannedUsers.includes(user.id)) {
                await interaction.reply({ content: `${user.tag} is already banned from using anonymous messages.`, flags: MessageFlags.Ephemeral });
                return;
            }

            bannedUsers.push(user.id);
            await setGuildConfig(guildId, 'anon_logs/banned', bannedUsers);

            await interaction.reply({ content: `${user.tag} has been banned from using anonymous messages.`, flags: MessageFlags.Ephemeral });
        }
    },
};
