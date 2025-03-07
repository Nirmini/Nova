const { PermissionsBitField } = require('discord.js');

module.exports = {
    id: '0836592', // Unique 6-digit command ID
    /**
     * Locks a specified channel by modifying the lowest role's permissions.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        try {
            const args = message.content.split(' ').slice(1);
            const channel = message.mentions.channels.first() || message.channel;

            // Check if the user has Manage Channels permission
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return message.reply('You do not have permission to lock channels.');
            }

            // Check if the bot has Manage Channels permission
            if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return message.reply('I am missing the required permissions to lock channels.');
            }

            // Get all roles except @everyone, sorted by position (ascending)
            const roles = message.guild.roles.cache
                .filter(role => role.id !== message.guild.id) // Exclude @everyone
                .sort((a, b) => a.position - b.position); // Sort by hierarchy

            const lowestRole = roles.first(); // Get the lowest non-everyone role

            if (!lowestRole) {
                return message.reply('No valid role found to lock.');
            }

            // Lock the channel for the lowest role
            await channel.permissionOverwrites.edit(lowestRole, {
                SendMessages: false
            });

            message.reply(`🔒 Locked ${channel}. Members with **${lowestRole.name}** can no longer send messages.`);
        } catch (error) {
            console.error('Error executing lock command:', error);
            message.reply('An error occurred while trying to lock the channel.');
        }
    },
};
