const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    id: '6000009', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Moderation tools')
        .addSubcommand(subcommand =>
            subcommand.setName('logs').setDescription('View recent moderation logs')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('stats').setDescription('View moderation statistics for the server')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('actions').setDescription('View your moderation actions')
        ),
    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return await interaction.reply({
                    content: 'You do not have permission to use this command.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            const subcommand = interaction.options.getSubcommand();
            const guild = interaction.guild;

            if (subcommand === 'logs') {
                const auditLogs = await guild.fetchAuditLogs({ limit: 10 });
                const logEntries = auditLogs.entries.map(entry => ({
                    action: String(entry.action) || 'Unknown Action',
                    user: entry.executor ? `<@${entry.executor.id}>` : 'Unknown Moderator',
                    target: entry.target ? (entry.target.id ? `<@${entry.target.id}>` : entry.target) : 'Unknown Target',
                    reason: entry.reason || 'No reason provided',
                    date: entry.createdAt.toLocaleDateString(),
                }));

                if (logEntries.length === 0) {
                    return await interaction.reply({
                        content: 'No recent moderation logs available.',
                        flags: MessageFlags.Ephemeral,
                    });
                }

                await paginate(interaction, 'Recent Moderation Logs', logEntries, entry =>
                    `**Action:** ${entry.action}\n**Moderator:** ${entry.user}\n**Target:** ${entry.target}\n**Reason:** ${entry.reason}\n**Date:** ${entry.date}`
                );

            } else if (subcommand === 'stats') {
                const auditLogs = await guild.fetchAuditLogs({ limit: 100 });
                const actionsCount = auditLogs.entries.reduce((stats, entry) => {
                    const actionName = String(entry.action) || 'Unknown Action';
                    stats[actionName] = (stats[actionName] || 0) + 1;
                    return stats;
                }, {});

                const statsEntries = Object.entries(actionsCount).map(([action, count]) => ({
                    action: action.replace(/_/g, ' '),
                    count: count.toString(),
                }));

                if (statsEntries.length === 0) {
                    return await interaction.reply({
                        content: 'No moderation actions recorded.',
                        flags: MessageFlags.Ephemeral,
                    });
                }

                await paginate(interaction, 'Moderation Statistics', statsEntries, entry =>
                    `**${entry.action}:** ${entry.count}`
                );

            } else if (subcommand === 'actions') {
                const user = interaction.user;
                const auditLogs = await guild.fetchAuditLogs({ limit: 100 });
                const userActions = auditLogs.entries
                    .filter(entry => entry.executor?.id === user.id)
                    .map(action => ({
                        action: String(action.action) || 'Unknown Action',
                        target: action.target ? (action.target.id ? `<@${action.target.id}>` : action.target) : 'Unknown Target',
                        reason: action.reason || 'No reason provided',
                        date: action.createdAt.toLocaleDateString(),
                    }));

                if (userActions.length === 0) {
                    return await interaction.reply({
                        content: 'You have not performed any moderation actions recently.',
                        flags: MessageFlags.Ephemeral,
                    });
                }

                await paginate(interaction, `${user.tag}'s Moderation Actions`, userActions, action =>
                    `**Action:** ${action.action}\n**Target:** ${action.target}\n**Reason:** ${action.reason}\n**Date:** ${action.date}`
                );
            }
        } catch (error) {
            console.error('Error executing /mod:', error);
            await interaction.reply({
                content: 'An error occurred while executing the command.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};

async function paginate(interaction, title, items, formatFunction) {
    if (!items || items.length === 0) {
        return interaction.reply({
            content: 'No data available.',
            flags: MessageFlags.Ephemeral,
        });
    }

    const itemsPerPage = 5;
    const pages = [];
    for (let i = 0; i < items.length; i += itemsPerPage) {
        pages.push(items.slice(i, i + itemsPerPage).map(formatFunction).join('\n\n'));
    }

    let currentPage = 0;
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(0x0099ff)
        .setDescription(pages[currentPage] || 'No data available.')
        .setFooter({ text: `Page ${currentPage + 1} of ${pages.length}` })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('prev').setLabel('⬅️ Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
        new ButtonBuilder().setCustomId('next').setLabel('➡️ Next').setStyle(ButtonStyle.Primary).setDisabled(pages.length === 1)
    );

    const message = await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral, fetchReply: true });

    const collector = message.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: "You can't interact with this!", ephemeral: true });

        if (i.customId === 'prev') currentPage--;
        if (i.customId === 'next') currentPage++;

        embed.setDescription(pages[currentPage] || 'No data available.')
            .setFooter({ text: `Page ${currentPage + 1} of ${pages.length}` });

        row.components[0].setDisabled(currentPage === 0);
        row.components[1].setDisabled(currentPage === pages.length - 1);

        await i.update({ embeds: [embed], components: [row] });
    });

    collector.on('end', () => {
        row.components.forEach(button => button.setDisabled(true));
        message.edit({ components: [row] }).catch(() => {});
    });
}
