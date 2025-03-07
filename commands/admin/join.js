const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, ChannelType, MessageFlags } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

module.exports = {
    id: '1947382', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join the voice channel or stage channel where the user is currently in'),
    
    async execute(interaction) {
        // Get the member and their voice channel
        const member = interaction.guild.members.cache.get(interaction.user.id);
        const channel = member.voice.channel;

        // Validate if the user is in a voice channel
        if (!channel || (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice)) {
            return interaction.reply({
                content: 'You must be in a voice channel or stage channel to use this command.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Check if the user has permission to move members (if needed)
        if (!member.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Get the bot's member object
        const botMember = interaction.guild.members.me;

        // Ensure the bot has permission to connect and speak
        if (!botMember.permissionsIn(channel).has(PermissionsBitField.Flags.Connect)) {
            return interaction.reply({
                content: 'I do not have permission to connect to this voice channel.',
                flags: MessageFlags.Ephemeral
            });
        }
        if (!botMember.permissionsIn(channel).has(PermissionsBitField.Flags.Speak)) {
            return interaction.reply({
                content: 'I do not have permission to speak in this voice channel.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Attempt to join the channel
        try {
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            connection.on(VoiceConnectionStatus.Ready, async () => {
                await interaction.reply({
                    content: `Successfully joined **${channel.name}**.`,
                    flags: MessageFlags.Ephemeral
                });
            });

            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                await interaction.followUp({
                    content: `Disconnected from **${channel.name}**.`,
                    flags: MessageFlags.Ephemeral
                });
            });

        } catch (error) {
            console.error('Error joining voice channel:', error);
            await interaction.reply({
                content: 'An error occurred while trying to join the voice channel.',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
