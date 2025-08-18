const { ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { getGuildConfig, updateGuildConfig, getGuildData, updateGuildData } = require('../src/Database')
const emoji = require('../emoji.json')
const client = require('../core/global/Client');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Report Message')
        .setType(ApplicationCommandType.Message), // Message context menu command

    async execute(interaction) {
        const guild = interaction.guild
        try {
            let reportsEnabled = await getGuildConfig(guild.id, 'reports.enabled');
            let ctxtReportsEnabled = await getGuildConfig(guild.id, 'reports.contextmenu_reports_enabled');
            const embed = new EmbedBuilder()
            const embed2 = new EmbedBuilder()
            if (reportsEnabled == true && ctxtReportsEnabled == true) {
                // Normal
                const targetMessage = interaction.targetMessage;
                const channel = interaction.channel;

                let channelId = await getGuildConfig(guild.id, 'reports.contextmenu_reports_channel');
                let reportchannel = client.channels.cache.get(channelId);
                try {
                    embed.setColor(0xff5050);
                    embed.setTitle(`Message Report`);
                    embed.setDescription(`
                        Reporter: ${interaction.user.tag} (<@${interaction.user.id}>)
                        Channel: ${channel}
                        Message Link: ${targetMessage.url}
                        `)
                    embed.addFields(
                        { name: '***Message Contents:***', value: `\`\`\`\n${targetMessage}\n\`\`\``}
                    )
                    reportchannel.send({
                        embeds: [embed]
                    })
                    embed2.setColor(0x50ff50);
                    embed2.setTitle(`<:NovaSuccess:${emoji.NovaSuccess}> Your report has been sent!`);
                    interaction.reply({
                        embeds: [embed2],
                        flags: MessageFlags.Ephemeral
                    })
                } catch (error) {
                    embed.setColor(0xff5050)
                    embed.setTitle(`<:NovaFailure:${emoji.NovaFailure}> Failed to submit report.`);
                    embed.setDescription(`If you are a server admin, check Nova's configuration.\nIf this is a frequent issue contact Nirmini.`);
                    interaction.reply({
                        embeds: [embed],
                        flags: MessageFlags.Ephemeral
                    })
                }
            }
            else {
                embed.setColor(0xff5050)
                embed.setTitle(`<:NovaFailure:${emoji.NovaFailure}> Reports are disabled in this server.`);
                interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                })
            }

        } catch (error) {
            console.error('Error in CTxt Report After command:', error);
            await interaction.reply({
                content: 'An error occurred while trying to report the message.',
                flags: MessageFlags
            });
        }
    }
};
