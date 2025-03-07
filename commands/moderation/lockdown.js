const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '6739556', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Manage lockdown state for all text channels.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a lockdown by removing "Send Messages" permission.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End a lockdown by restoring "Send Messages" permission.')),
    async execute(interaction) {
        try {
            // Check if the user has "Manage Channels" permission
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return interaction.reply({
                    content: 'You need the "Manage Channels" permission to use this command.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            // Check if the bot has necessary permissions
            if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                return interaction.reply({
                    content: 'I need the "Manage Roles" permission to execute this command.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            const subcommand = interaction.options.getSubcommand();
            const botHighestRolePosition = interaction.guild.members.me.roles.highest.position;

            // Filter channels the bot can manage
            const channels = interaction.guild.channels.cache.filter(channel => 
                channel.isTextBased() && 
                channel.viewable &&
                channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.ManageRoles)
            );

            if (channels.size === 0) {
                return interaction.reply({
                    content: 'I could not find any text channels I have permission to modify.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            const affectedChannels = [];
            const updates = [];

            for (const channel of channels.values()) {
                const rolesBelowBot = interaction.guild.roles.cache.filter(role => role.position < botHighestRolePosition);

                for (const role of rolesBelowBot.values()) {
                    const overwrite = channel.permissionOverwrites.cache.get(role.id);

                    if (subcommand === 'start') {
                        // Lock down: Deny "Send Messages" permission
                        if (!overwrite || !overwrite.deny.has(PermissionsBitField.Flags.SendMessages)) {
                            updates.push(channel.permissionOverwrites.edit(role, {
                                SendMessages: false,
                            }, { reason: `Lockdown started by ${interaction.user.tag}` }));
                            affectedChannels.push(channel.name);
                        }
                    } else if (subcommand === 'end') {
                        // End lockdown: Reset "Send Messages" permission
                        if (overwrite && overwrite.deny.has(PermissionsBitField.Flags.SendMessages)) {
                            updates.push(channel.permissionOverwrites.edit(role, {
                                SendMessages: null,
                            }, { reason: `Lockdown ended by ${interaction.user.tag}` }));
                            affectedChannels.push(channel.name);
                        }
                    }
                }
            }

            // Apply all updates concurrently
            await Promise.all(updates);

            const embed = new EmbedBuilder()
                .setTitle(subcommand === 'start' ? 'Lockdown Started' : 'Lockdown Ended')
                .setColor(subcommand === 'start' ? 0xff0000 : 0x00ff00)
                .setDescription(
                    `${subcommand === 'start' ? 'Locked' : 'Unlocked'} ${
                        affectedChannels.length
                    } channels.`
                )
                .addFields({
                    name: `${subcommand === 'start' ? 'Locked' : 'Unlocked'} Channels`,
                    value: affectedChannels.join(', ') || 'None',
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing /lockdown command:', error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'An error occurred while executing the lockdown. Please try again later.',
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                await interaction.reply({
                    content: 'An error occurred while executing the lockdown. Please try again later.',
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    },
};
