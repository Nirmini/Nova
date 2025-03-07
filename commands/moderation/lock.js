const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
    id: '6673834', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Locks a given channel.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to lock')
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
            .filter(role => channel.permissionsFor(role).has(PermissionsBitField.Flags.SendMessages))
            .sort((a, b) => a.position - b.position); // Sort by hierarchy (lowest first)

        const lowestRole = roles.first();

        if (!lowestRole) {
            return interaction.reply({ content: '❌ No role has Send Messages enabled in this channel.', ephemeral: true });
        }

        try {
            await channel.permissionOverwrites.edit(lowestRole, {
                SendMessages: false
            });

            return interaction.reply({
                content: `🔒 Locked **${channel.name}** for **${lowestRole.name}**.`,
                ephemeral: false
            });

        } catch (error) {
            console.error('Error locking channel:', error);
            return interaction.reply({ content: '❌ Failed to lock the channel.', ephemeral: true });
        }
    }
};
