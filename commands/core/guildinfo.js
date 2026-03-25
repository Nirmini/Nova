const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

const verificationLevelMap = {
    NONE: 'None',
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    VERY_HIGH: 'Highest'
};

module.exports = {
    id: '2000008', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Get information about the server'),
    async execute(interaction) {
        try {
            const guild = interaction.guild;

            if (!guild) {
                return interaction.reply({
                    content: 'This command must be used within a server.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            const owner = await guild.fetchOwner();

            // General Guild Info
            const serverName = guild.name;
            const serverCreationDate = guild.createdAt.toLocaleDateString();
            const memberCount = guild.memberCount.toLocaleString();
            const boostLevel = guild.premiumTier ? `Level ${guild.premiumTier}` : 'No Boosts';
            const boostCount = guild.premiumSubscriptionCount || 0;
            const verificationLevel = verificationLevelMap[guild.verificationLevel] || 'Unknown';
            const totalRoles = guild.roles.cache.size;

            // Channel Info
            const categoryChannels = guild.channels.cache.filter(c => c.type === 4).size;
            const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
            const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
            const threadChannels = guild.channels.cache.filter(c => c.isThread()).size;

            const embed = new EmbedBuilder()
                .setTitle('Server Information')
                .setColor(0x3498db)
                .setThumbnail(guild.iconURL({ dynamic: true }) || '')
                .addFields(
                    { name: 'Server Name', value: serverName, inline: true },
                    { name: 'Owner', value: owner.user.tag, inline: true },
                    { name: 'Total Members', value: memberCount, inline: true },
                    { name: 'Boost Level', value: `${boostLevel} (${boostCount} Boosts)`, inline: true },
                    { name: 'Verification Level', value: verificationLevel, inline: true },
                    { name: 'Total Roles', value: totalRoles.toString(), inline: true },
                    { name: 'Text Channels', value: textChannels.toString(), inline: true },
                    { name: 'Voice Channels', value: voiceChannels.toString(), inline: true },
                    { name: 'Category Channels', value: categoryChannels.toString(), inline: true },
                    { name: 'Threads', value: threadChannels.toString(), inline: true }
                )
                .setFooter({ text: `Server ID: ${guild.id} | Created on: ${serverCreationDate}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing /serverinfo:', error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'An error occurred while fetching server information.',
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                await interaction.reply({
                    content: 'An error occurred while fetching server information.',
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    },
};
