const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, ChannelType, MessageFlags, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, getVoiceConnection } = require('@discordjs/voice');
const devPerms = require('../../devperms.json');

module.exports = {
    id: '1000004', 
    data: new SlashCommandBuilder()
        .setName('vc')
        .setDescription('Voice channel management commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('Join the voice channel where you are currently in')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('Make the bot leave the voice channel it is currently in')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('tmute')
                .setDescription('Temporarily mute yourself in voice chat')
                .addIntegerOption(option =>
                    option
                        .setName('duration')
                        .setDescription('Duration in seconds to remain muted')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(3600)
                )
        ),
    
    async execute(interaction) {
        const embed = new EmbedBuilder();
        
        // Permission check
        const userPerm = devPerms.usermap.find(u => u.userid === interaction.user.id);
        if (!userPerm || userPerm.level <= 100) {
            embed.setColor(0xff0000);
            embed.setTitle('❌ Insufficient Permissions');
            embed.setDescription('You do not have permission to use this command.');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        
        if (require('../../settings.json').devcmdsenabled != true) {
            embed.setColor(0xff0000);
            embed.setTitle('⚠️ Developer Commands Disabled');
            embed.setDescription('Developer commands are disabled in `settings.json`.');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'join') {
            return this.handleJoin(interaction, embed);
        } else if (subcommand === 'leave') {
            return this.handleLeave(interaction, embed);
        } else if (subcommand === 'tmute') {
            return this.handleTMute(interaction, embed);
        }
    },
    
    async handleJoin(interaction, embed) {
        // Get the member and their voice channel
        const member = interaction.guild.members.cache.get(interaction.user.id);
        const channel = member.voice.channel;
        
        // Validate if the user is in a voice channel
        if (!channel || (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice)) {
            embed.setColor(0xff0000);
            embed.setTitle('❌ Not in Voice Channel');
            embed.setDescription('You must be in a voice channel or stage channel to use this command.');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        
        // Check if the user has permission to move members
        if (!member.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            embed.setColor(0xff0000);
            embed.setTitle('❌ Insufficient Permissions');
            embed.setDescription('You do not have permission to use this command.');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        
        // Get the bot's member object
        const botMember = interaction.guild.members.me;
        
        // Ensure the bot has permission to connect and speak
        if (!botMember.permissionsIn(channel).has(PermissionsBitField.Flags.Connect)) {
            embed.setColor(0xff0000);
            embed.setTitle('❌ Missing Permissions');
            embed.setDescription('I do not have permission to connect to this voice channel.');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        
        if (!botMember.permissionsIn(channel).has(PermissionsBitField.Flags.Speak)) {
            embed.setColor(0xff0000);
            embed.setTitle('❌ Missing Permissions');
            embed.setDescription('I do not have permission to speak in this voice channel.');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        
        // Attempt to join the channel
        try {
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            
            connection.on(VoiceConnectionStatus.Ready, async () => {
                embed.setColor(0x00aa00);
                embed.setTitle('✅ Joined Voice Channel');
                embed.setDescription(`Successfully joined **${channel.name}**.`);
                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            });
            
            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                const disconnectEmbed = new EmbedBuilder()
                    .setColor(0xffaa00)
                    .setTitle('🔌 Disconnected')
                    .setDescription(`Disconnected from **${channel.name}**.`);
                await interaction.followUp({ embeds: [disconnectEmbed], flags: MessageFlags.Ephemeral });
            });
        } catch (error) {
            console.error('Error joining voice channel:', error);
            embed.setColor(0xff0000);
            embed.setTitle('❌ Error');
            embed.setDescription('An error occurred while trying to join the voice channel.');
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    },
    
    async handleLeave(interaction, embed) {
        // Fetch the bot's voice connection
        const connection = getVoiceConnection(interaction.guild.id);
        
        // Check if the bot is connected
        if (!connection) {
            embed.setColor(0xffaa00);
            embed.setTitle('⚠️ Not Connected');
            embed.setDescription('I am not connected to any voice channel.');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        
        // Get the bot's current voice channel
        const botChannel = interaction.guild.channels.cache.get(connection.joinConfig.channelId);
        
        // Validate the user's permissions
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (!member.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            embed.setColor(0xff0000);
            embed.setTitle('❌ Insufficient Permissions');
            embed.setDescription('You do not have permission to use this command.');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        
        try {
            // Disconnect from the voice channel
            connection.destroy();
            embed.setColor(0x00aa00);
            embed.setTitle('✅ Left Voice Channel');
            embed.setDescription(`Disconnected from **${botChannel.name}**.`);
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error leaving voice channel:', error);
            embed.setColor(0xff0000);
            embed.setTitle('❌ Error');
            embed.setDescription('An error occurred while trying to leave the voice channel.');
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    },
    
    async handleTMute(interaction, embed) {
        const member = interaction.guild.members.cache.get(interaction.user.id);
        const duration = interaction.options.getInteger('duration');
        
        // Check if user is in a voice channel
        if (!member.voice.channel) {
            embed.setColor(0xff0000);
            embed.setTitle('❌ Not in Voice Channel');
            embed.setDescription('You must be in a voice channel to use this command.');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        
        try {
            // Mute the user
            await member.voice.setMute(true, 'Temporary self-mute');
            
            embed.setColor(0x00aa00);
            embed.setTitle('🔇 Temporarily Muted');
            embed.setDescription(`You have been muted for **${duration}** second${duration !== 1 ? 's' : ''}.`);
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            
            // Unmute after duration
            setTimeout(async () => {
                try {
                    await member.voice.setMute(false, 'Temporary mute expired');
                    const unmuteEmbed = new EmbedBuilder()
                        .setColor(0x00aa00)
                        .setTitle('🔊 Unmuted')
                        .setDescription('Your temporary mute has expired.');
                    await interaction.followUp({ embeds: [unmuteEmbed], flags: MessageFlags.Ephemeral });
                } catch (err) {
                    console.error('Error unmuting user:', err);
                }
            }, duration * 1000);
        } catch (error) {
            console.error('Error muting user:', error);
            embed.setColor(0xff0000);
            embed.setTitle('❌ Error');
            embed.setDescription('An error occurred while trying to mute you.');
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    },
};