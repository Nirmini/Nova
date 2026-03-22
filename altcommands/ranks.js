const { EmbedBuilder, MessageFlags } = require('discord.js');
const { getGuildConfig } = require('../src/Database');
const emoji = require('../emoji.json');

module.exports = {
    id: '0000016',
    name: 'ranks',
    description: 'View the list of ranks in the guild',
    usage: '?ranks',
    /**
     * Executes the ranks command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     * @param {string[]} args - The arguments passed with the command.
     */
    async execute(message, args) {
        const logEmbed = new EmbedBuilder();
        const guildId = message.guild.id;

        try {
            // Fetch the ranks from Firebase
            const currentRanks = await getGuildConfig(guildId, 'ranks');

            // If no ranks are found, send an ephemeral message
            if (!currentRanks || Object.keys(currentRanks).length === 0) {
                logEmbed.setColor(0x5086e3);
                logEmbed.setDescription(`<:Info:${emoji.Info}> There are no ranks set for this guild.`);
                return message.reply({ embeds: [logEmbed], flags: MessageFlags.Ephemeral });
            }

            // Create an embed to show the list of ranks
            const rankEmbed = new EmbedBuilder()
                .setTitle('Guild Ranks')
                .setColor(0xa0a0ff)
                .setDescription('Here are the current ranks in this guild:')
                .setTimestamp();

            // Add each rank to the embed
            Object.entries(currentRanks).forEach(([roleId, rankName], index) => {
                rankEmbed.addFields({
                    name: `Rank ${index + 1}: ${rankName}`,
                    value: `Role ID: ${roleId}`,
                    inline: false,
                });
            });

            // Send the embed to the channel where the command was issued
            return message.reply({ embeds: [rankEmbed] });
        } catch (error) {
            console.error('Error during command execution:', error.message);
            console.error('Error details:', error.stack);
            logEmbed.setColor(0xe35550);
            logEmbed.setTitle(`<:Failure:${emoji.Failure}> An error occurred while running this command!`);
            logEmbed.setDescription(`Log Stack: ${error}`);
            return message.reply({ embeds: [logEmbed], flags: MessageFlags.Ephemeral });
        }
    },
};
