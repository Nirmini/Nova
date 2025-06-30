const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, MessageFlags } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

const EXEMPT_USER_ID = '600464355917692952'; // The exempted user ID

module.exports = {
    id: '1947383', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Make the bot leave the voice channel it is currently in'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
        
        // Permission check
        const userPerm = devPerms.usermap.find(u => u.userid === message.author.id);
        if (!userPerm || userPerm.level <= 200) {
            embed.setColor(0xff0000);
            embed.setTitle('You do not have permission to use this command.');
            return message.reply({ embeds: [embed] });
        }
        // Fetch the bot's voice connection
        const connection = getVoiceConnection(interaction.guild.id);

        // Check if the bot is connected
        if (!connection) {
            return interaction.reply({
                content: 'I am not connected to any voice channel.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Get the bot's current voice channel
        const botChannel = interaction.guild.channels.cache.get(connection.joinConfig.channelId);

        // Validate the user’s permissions
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (interaction.user.id !== EXEMPT_USER_ID && !member.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            // Disconnect from the voice channel
            connection.destroy();

            await interaction.reply({
                content: `Disconnected from **${botChannel.name}**.`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Error leaving voice channel:', error);
            await interaction.reply({
                content: 'An error occurred while trying to leave the voice channel.',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
