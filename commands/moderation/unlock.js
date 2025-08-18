const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
    id: '6000022', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlocks a given channel.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to unlock')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        if (!channel) {
            return interaction.reply({ content: '❌ Invalid channel.', ephemeral: true });
        }

        const roles = interaction.guild.roles.cache
            .filter(role => channel.permissionOverwrites.cache.get(role.id)?.deny.has(PermissionsBitField.Flags.SendMessages))
            .sort((a, b) => a.position - b.position); // Sort by hierarchy (lowest first)

        const lowestRole = roles.first();

        if (!lowestRole) {
            return interaction.reply({ content: '❌ No locked roles found for this channel.', ephemeral: true });
        }

        try {
            await channel.permissionOverwrites.edit(lowestRole, {
                SendMessages: null // Reset permission to default
            });

            return interaction.reply({
                content: `🔓 Unlocked **${channel.name}** for **${lowestRole.name}**.`,
                ephemeral: false
            });

        } catch (error) {
            console.error('Error unlocking channel:', error);
            return interaction.reply({ content: '❌ Failed to unlock the channel.', ephemeral: true });
        }
    }
};
