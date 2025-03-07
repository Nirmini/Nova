const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { setData, getData, updateData, deleteData } = require('../../src/firebaseAdmin'); // Admin SDK functions

module.exports = {
    id: '6094274', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Manage tickets')
        .addSubcommand(subcommand =>
            subcommand
                .setName('open')
                .setDescription('Open a new ticket'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('assign')
                .setDescription('Assign a ticket')
                .addIntegerOption(option =>
                    option
                        .setName('id')
                        .setDescription('Ticket ID to assign')
                        .setRequired(true))
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to assign the ticket to')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close an existing ticket')
                .addIntegerOption(option =>
                    option
                        .setName('id')
                        .setDescription('Ticket ID to close')
                        .setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const ticketsPath = `tickets/${guildId}`; // Fixed Path

        if (subcommand === 'open') {
            await handleOpenTicket(interaction, ticketsPath);
        } else if (subcommand === 'assign') {
            const ticketId = interaction.options.getInteger('id');
            const user = interaction.options.getUser('user');
            await handleAssignTicket(interaction, ticketsPath, ticketId, user);
        } else if (subcommand === 'close') {
            const ticketId = interaction.options.getInteger('id');
            await handleCloseTicket(interaction, ticketsPath, ticketId);
        }
    },
};

async function handleOpenTicket(interaction, ticketsPath) {
    const guild = interaction.guild;
    const user = interaction.user;

    // Fetch the ticket count and calculate the next Ticket ID
    const ticketsData = await getData(ticketsPath) || {};
    const ticketId = Object.keys(ticketsData).length;

    const ticketCategory = guild.channels.cache.find(
        channel => channel.name.toLowerCase() === 'tickets' && channel.type === 4 // Type 4 is for category
    ) || await guild.channels.create({
        name: 'Tickets',
        type: 4, // Category
    });

    const ticketChannel = await guild.channels.create({
        name: `ticket-${ticketId}`,
        type: 0, // Text channel
        parent: ticketCategory.id,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: user.id,
                allow: [PermissionsBitField.Flags.ViewChannel],
            },
            ...guild.roles.cache
                .filter(role => role.name.toLowerCase().includes('admin') || role.permissions.has(PermissionsBitField.Flags.Administrator))
                .map(role => ({
                    id: role.id,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                })),
        ],
    });

    // Save ticket to the database
    const ticketData = {
        id: ticketId,
        userId: user.id,
        channelId: ticketChannel.id,
        status: 'open',
        createdAt: new Date().toISOString(),
    };
    await setData(`${ticketsPath}/${ticketId}`, ticketData);

    await interaction.reply(`Ticket #${ticketId} has been created: ${ticketChannel}`);
}

async function handleAssignTicket(interaction, ticketsPath, ticketId, user) {
    const guild = interaction.guild;
    const ticketData = await getData(`${ticketsPath}/${ticketId}`);
    if (!ticketData) {
        return interaction.reply({ content: `Ticket #${ticketId} does not exist.`, flags: MessageFlags.Ephemeral });
    }

    const ticketChannel = guild.channels.cache.get(ticketData.channelId);
    if (!ticketChannel) {
        return interaction.reply({ content: `Ticket channel for #${ticketId} no longer exists.`, flags: MessageFlags.Ephemeral });
    }

    await ticketChannel.permissionOverwrites.create(user.id, {
        ViewChannel: true,
    });

    await updateData(`${ticketsPath}/${ticketId}`, { assignedTo: user.id });
    await interaction.reply(`Ticket #${ticketId} has been assigned to ${user}.`);
}

async function handleCloseTicket(interaction, ticketsPath, ticketId) {
    const guild = interaction.guild;
    const user = interaction.user;
    const ticketData = await getData(`${ticketsPath}/${ticketId}`);

    if (!ticketData) {
        return interaction.reply({ content: `Ticket #${ticketId} does not exist.`, flags: MessageFlags.Ephemeral });
    }

    if (ticketData.userId !== user.id) {
        return interaction.reply({ content: `You can only close tickets you opened.`, flags: MessageFlags.Ephemeral });
    }

    const ticketChannel = guild.channels.cache.get(ticketData.channelId);
    if (ticketChannel) {
        await ticketChannel.delete();
    }

    const closeTimestamp = new Date().toISOString();
    await updateData(`${ticketsPath}/${ticketId}`, { status: 'closed', closedAt: closeTimestamp });

    // Schedule removal of the ticket data after 7 days
    setTimeout(async () => {
        await deleteData(`${ticketsPath}/${ticketId}`);
    }, 7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds

    await interaction.reply(`Ticket #${ticketId} has been closed.`);
}
