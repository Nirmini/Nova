const { 
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
} = require('discord.js');

const devPerms = require('../../devperms.json');

module.exports = {
    id: '1000012',
    data: new SlashCommandBuilder()
        .setName('lookup')
        .setDescription('Returns information about all guilds the bot is currently in.'),

    async execute(interaction) {
        const embed = new EmbedBuilder();

        // Permission check - restricted to devperm level 500+
        const userPerm = devPerms.usermap.find(u => u.userid === interaction.user.id);
        if (!userPerm || userPerm.level < 500) {
            embed.setColor(0xff0000);
            embed.setTitle('❌ Insufficient Permissions');
            embed.setDescription('You do not have permission to use this command. (Requires devperm level 500+)');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Defer reply to prevent timeout
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const guilds = interaction.client.guilds.cache;
            
            if (guilds.size === 0) {
                embed.setColor(0xffaa00);
                embed.setTitle('⚠️ No Guilds Found');
                embed.setDescription('The bot is not currently in any guilds.');
                return interaction.editReply({ embeds: [embed] });
            }

            embed.setColor(0x00aa00);
            embed.setTitle('🔍 Guild Lookup');
            embed.setDescription(`The bot is currently in **${guilds.size}** guild${guilds.size !== 1 ? 's' : ''}.`);

            // Add a field for each guild with name, id, member count, and channel count
            guilds.forEach(guild => {
                const memberCount = guild.memberCount || 'Unknown';
                const channelCount = guild.channels.cache.size || 'Unknown';
                
                embed.addFields({
                    name: `📋 ${guild.name}`,
                    value: `**Guild ID:** \`${guild.id}\`\n**Members:** ${memberCount}\n**Channels:** ${channelCount}`,
                    inline: false
                });
            });

            // Discord embeds have a limit of 25 fields
            if (guilds.size > 25) {
                embed.setFooter({ text: `⚠️ Showing first 25 of ${guilds.size} guilds due to Discord embed limitations.` });
            }

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Lookup command error:', error);
            embed.setColor(0xff0000);
            embed.setTitle('❌ Error');
            embed.setDescription(`Failed to retrieve guild information. Error: ${error.message}`);
            return interaction.editReply({ embeds: [embed] });
        }
    },
};