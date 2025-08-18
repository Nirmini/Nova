const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    id: '0000010',

    /**
     * Locks a specified channel by denying SendMessages to @everyone and the lowest role with that permission.
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const args = message.content.split(' ').slice(1);
        const emojis = {
            check: '✅', // Replace with custom emoji IDs if needed
            failure: '❌'
        };

        if (args.length < 1) {
            const embed = new EmbedBuilder()
                .setTitle('Lock Command Help')
                .setDescription('Usage: `?lock <#channel> <optional reason>`')
                .setColor('Blue')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const channelMention = args[0];
        const reason = args.slice(1).join(' ').trim();

        // Channel parsing: mentions only like <#1234567890>
        const channelId = channelMention.replace(/[<#>]/g, '');
        const channel = message.guild.channels.cache.get(channelId);

        if (!channel || channel.type !== 0) { // 0 = GUILD_TEXT in raw form
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`<:failure:${emojis.failure}> Invalid or unsupported channel.`);
            return message.reply({ embeds: [embed] });
        }

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('❌ You do not have permission to lock channels.');
        }

        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('❌ I am missing the Manage Channels permission.');
        }

        const everyoneRole = message.guild.roles.everyone;

        try {
            // Get lowest role that currently has SendMessages in that channel
            const rolesWithSend = message.guild.roles.cache
                .filter(role =>
                    role.id !== everyoneRole.id &&
                    channel.permissionsFor(role)?.has(PermissionsBitField.Flags.SendMessages)
                )
                .sort((a, b) => a.position - b.position);

            const lowestRole = rolesWithSend.first();

            const promises = [];

            promises.push(channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false
            }, { reason: reason || 'No reason provided' }));

            if (lowestRole) {
                promises.push(channel.permissionOverwrites.edit(lowestRole, {
                    SendMessages: false
                }, { reason: reason || 'No reason provided' }));
            }

            await Promise.all(promises);

            // Send lock message into the locked channel only if reason is provided
            if (reason.length > 0) {
                const lockEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`:lock: ${reason}`);
                await channel.send({ embeds: [lockEmbed] });
            }

            const confirmEmbed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(`<:check:${emojis.check}> Locked channel ${channel}`);
            return message.reply({ embeds: [confirmEmbed] });

        } catch (err) {
            console.error('Error locking channel:', err);
            const failEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`<:failure:${emojis.failure}> Failed to lock ${channel}`);
            return message.reply({ embeds: [failEmbed] });
        }
    }
};
