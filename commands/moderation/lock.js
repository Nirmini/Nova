const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    id: '6000005',
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Locks a given channel.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to lock')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Optional reason for locking the channel')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const reason = interaction.options.getString('reason') || 'No reason provided.';
        const everyoneRole = interaction.guild.roles.everyone;

        const emojis = require('../../emoji.json');

        if (!channel || channel.type !== ChannelType.GuildText) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`<:failure:${emojis.failure}> Invalid or unsupported channel.`)],
                ephemeral: true
            });
        }

        try {
            const rolesWithSend = interaction.guild.roles.cache
                .filter(role =>
                    channel.permissionsFor(role).has(PermissionsBitField.Flags.SendMessages) &&
                    role.id !== everyoneRole.id
                )
                .sort((a, b) => a.position - b.position); // Lowest role first

            const lowestRole = rolesWithSend.first();

            const overwrites = [];

            // Always lock @everyone
            overwrites.push(channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false
            }, { reason }));

            // Lock lowest role if any (besides @everyone)
            if (lowestRole) {
                overwrites.push(channel.permissionOverwrites.edit(lowestRole, {
                    SendMessages: false
                }, { reason }));
            }

            await Promise.all(overwrites);

            // Lock message to channel
            const lockEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`:lock: ${reason}`);
            await channel.send({ embeds: [lockEmbed] });

            // Confirmation to command invoker
            const confirmEmbed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(`<:check:${emojis.check}> Locked channel ${channel}`);

            await interaction.reply({ embeds: [confirmEmbed] });

        } catch (err) {
            console.error('Error during lock:', err);

            const failEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`<:failure:${emojis.failure}> Failed to lock channel ${channel}`);
            return interaction.reply({ embeds: [failEmbed], ephemeral: true });
        }
    }
};
