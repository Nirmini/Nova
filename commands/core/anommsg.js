const { SlashCommandBuilder, PermissionsBitField, ChannelType, MessageFlags } = require('discord.js');
const { setData, getData } = require('../../src/firebaseAdmin'); // Firebase Admin functions

module.exports = {
    id: '2454475', // Unique 6-digit command ID
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
            const bannedUsers = await getData(`${firebasePath}/banned`) || [];
            if (bannedUsers.includes(userId)) {
                await interaction.reply({ content: 'You are banned from sending anonymous messages.', flags: MessageFlags.Ephemeral });
                return;
            }

            const messageText = interaction.options.getString('text');

            // Create a ticket channel
            const ticketChannel = await guild.channels.create({
                name: `ticket-${Date.now()}`,
                type: ChannelType.GuildText,
                parent: category.id,
                topic: `Anonymous message ticket.`,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, // Deny public view
                    { id: interaction.client.user.id, allow: [PermissionsBitField.Flags.ViewChannel] } // Bot access
                ]
            });

            // Log the message in Firebase
            const userLogsPath = `${firebasePath}/logs/${userId}`;
            const userLogs = (await getData(userLogsPath)) || [];
            userLogs.push({ message: messageText, channel: ticketChannel.id, timestamp: new Date().toISOString() });
            await setData(userLogsPath, userLogs);

            // Send the message in the ticket channel
            await ticketChannel.send(`**Anonymous Message**\n${messageText}`);

            await interaction.reply({ content: 'Your anonymous message has been sent!', flags: MessageFlags.Ephemeral });
        } else if (subcommand === 'track') {
            // Check permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                await interaction.reply({ content: 'You lack the necessary permissions to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }

            const user = interaction.options.getUser('user');
            const userLogsPath = `${firebasePath}/logs/${user.id}`;
            const userLogs = (await getData(userLogsPath)) || [];

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
            const bannedUsers = await getData(bannedUsersPath) || [];

            if (bannedUsers.includes(user.id)) {
                await interaction.reply({ content: `${user.tag} is already banned from using anonymous messages.`, flags: MessageFlags.Ephemeral });
                return;
            }

            bannedUsers.push(user.id);
            await setData(bannedUsersPath, bannedUsers);

            await interaction.reply({ content: `${user.tag} has been banned from using anonymous messages.`, flags: MessageFlags.Ephemeral });
        }
    },
};
