const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, MessageFlags } = require('discord.js');
const { setData, getData, updateData, deleteData } = require('../../src/firebaseAdmin'); // Admin SDK functions
const { setTimeout } = require('timers/promises'); // To handle timed deletion

module.exports = {
    id: '6332759', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('case')
        .setDescription('Manage moderation cases')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new case')
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for the case')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('assign')
                .setDescription('Assign a case to a moderator')
                .addStringOption(option =>
                    option
                        .setName('caseid')
                        .setDescription('ID of the case to assign')
                        .setRequired(true))
                .addUserOption(option =>
                    option
                        .setName('moderator')
                        .setDescription('Moderator to assign the case to')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close an existing case')
                .addStringOption(option =>
                    option
                        .setName('caseid')
                        .setDescription('ID of the case to close')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Retrieve information about a case')
                .addStringOption(option =>
                    option
                        .setName('caseid')
                        .setDescription('ID of the case to retrieve info about')
                        .setRequired(true))),
    
    async execute(interaction) {
        const guild = interaction.guild;
        const user = interaction.user;
        const member = interaction.member;

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'create':
                await handleCreateCase(interaction, guild, user);
                break;

            case 'assign':
                await handleAssignCase(interaction, guild);
                break;

            case 'close':
                await handleCloseCase(interaction, guild);
                break;

            case 'info':
                await handleCaseInfo(interaction, guild, member);
                break;

            default:
                await interaction.reply({ content: 'Invalid subcommand.', flags: MessageFlags.Ephemeral });
        }
    },
};

// Handle case creation
async function handleCreateCase(interaction, guild, user) {
    const reason = interaction.options.getString('reason');
    const categoryName = 'Cases';

    // Ensure the "Cases" category exists
    let category = guild.channels.cache.find(c => c.name === categoryName && c.type === 4); // 4 = Category
    if (!category) {
        category = await guild.channels.create({ name: categoryName, type: 4 });
    }

    // Get the case data from the database
    const casesPath = `cases/${guild.id}`;
    const casesData = await getData(casesPath) || {};
    const caseId = Object.keys(casesData).length + 1; // Increment case ID

    // Create a new case channel
    const caseChannel = await guild.channels.create({
        name: `case-${caseId}`,
        type: 0, // 0 = Text Channel
        parent: category.id,
        permissionOverwrites: [
            { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, // Deny access to everyone
            { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }, // Allow access to creator
            { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] }, // Deny all default roles
        ],
    });

    // Add the case data to the database
    const newCaseData = {
        caseId,
        reason,
        createdBy: user.id,
        createdAt: Date.now(),
        status: 'open',
        channelId: caseChannel.id,
    };
    await setData(`${casesPath}/${caseId}`, newCaseData);

    await interaction.reply({
        content: `Case #${caseId} has been created in ${caseChannel}.`,
        flags: MessageFlags.Ephemeral,
    });

    const embed = new EmbedBuilder()
        .setTitle(`Case #${caseId}`)
        .setDescription(`**Reason:** ${reason}`)
        .setColor(0x2f3136)
        .setFooter({ text: `Created by ${user.tag}` })
        .setTimestamp();

    await caseChannel.send({ embeds: [embed] });
}

// Handle case assignment
async function handleAssignCase(interaction, guild) {
    const caseId = interaction.options.getString('caseid');
    const moderator = interaction.options.getUser('moderator');
    const casesPath = `cases/${guild.id}/${caseId}`;

    // Check if the case exists
    const caseData = await getData(casesPath);
    if (!caseData) {
        await interaction.reply({ content: `Case #${caseId} does not exist.`, flags: MessageFlags.Ephemeral });
        return;
    }

    const caseChannel = guild.channels.cache.get(caseData.channelId);
    if (!caseChannel) {
        await interaction.reply({ content: `The channel for Case #${caseId} does not exist.`, flags: MessageFlags.Ephemeral });
        return;
    }

    // Update the case with the assigned moderator
    await updateData(casesPath, { assignedTo: moderator.id });

    // Add the moderator to the channel
    await caseChannel.permissionOverwrites.create(moderator.id, {
        ViewChannel: true,
        SendMessages: true,
    });

    await interaction.reply({ content: `Case #${caseId} has been assigned to ${moderator.tag}.`, flags: MessageFlags.Ephemeral });
}

// Handle case closure
async function handleCloseCase(interaction, guild) {
    const caseId = interaction.options.getString('caseid');
    const casesPath = `cases/${guild.id}/${caseId}`;

    // Check if the case exists
    const caseData = await getData(casesPath);
    if (!caseData) {
        await interaction.reply({ content: `Case #${caseId} does not exist.`, flags: MessageFlags.Ephemeral });
        return;
    }

    const caseChannel = guild.channels.cache.get(caseData.channelId);
    if (!caseChannel) {
        await interaction.reply({ content: `The channel for Case #${caseId} does not exist.`, flags: MessageFlags.Ephemeral });
        return;
    }

    // Close the case
    await updateData(casesPath, { status: 'closed', closedAt: Date.now() });

    // Delete the case channel
    await caseChannel.delete(`Case #${caseId} closed by ${interaction.user.tag}`);

    // Schedule deletion of case data after 7 days
    setTimeout(7 * 24 * 60 * 60 * 1000, async () => {
        await deleteData(casesPath);
        console.log(`Case #${caseId} data has been deleted.`);
    });

    await interaction.reply({ content: `Case #${caseId} has been closed and the channel has been deleted.`, flags: MessageFlags.Ephemeral });
}

// Handle case info
async function handleCaseInfo(interaction, guild, member) {
    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        await interaction.reply({ content: 'You do not have permission to view case information.', flags: MessageFlags.Ephemeral });
        return;
    }

    const caseId = interaction.options.getString('caseid');
    const casesPath = `cases/${guild.id}/${caseId}`;

    // Retrieve case data
    const caseData = await getData(casesPath);
    if (!caseData) {
        await interaction.reply({ content: `Case #${caseId} does not exist.`, flags: MessageFlags.Ephemeral });
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`Case #${caseId} Information`)
        .setDescription(`**Reason:** ${caseData.reason}`)
        .addFields(
            { name: 'Status', value: caseData.status || 'Unknown', inline: true },
            { name: 'Assigned To', value: caseData.assignedTo ? `<@${caseData.assignedTo}>` : 'None', inline: true },
            { name: 'Created By', value: `<@${caseData.createdBy}>`, inline: true }
        )
        .setColor(0x2f3136)
        .setTimestamp(caseData.createdAt);

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
