const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '6000008', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('massunlock')
        .setDescription('Unlock a channel to allow messages to be sent.')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to unlock.')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const channel = interaction.options.getChannel('channel');

            // Check if the user has permission to manage the channel
            if (!interaction.member.permissionsIn(channel).has(PermissionsBitField.Flags.ManageChannels)) {
                await interaction.reply({ content: 'You do not have permission to manage this channel.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Check if the bot has permission to manage the channel
            if (!interaction.guild.members.me.permissionsIn(channel).has(PermissionsBitField.Flags.ManageChannels)) {
                await interaction.reply({ content: 'I do not have permission to manage this channel.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Defer the reply to avoid timeout
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const errors = [];

            // Iterate over all roles in the guild
            for (const role of interaction.guild.roles.cache.values()) {
                // Skip roles with Administrator permission
                if (role.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    continue;
                }

                try {
                    await channel.permissionOverwrites.edit(role, {
                        SendMessages: null, // Reset permission to inherit from category/server
                    }, { reason: `Unlock command executed by ${interaction.user.tag}` });
                } catch (error) {
                    // If it fails (e.g., role is above the bot), add the role name to the error list
                    errors.push(role.name);
                    console.error(`Failed to update permissions for role ${role.name}:`, error);
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('Channel Unlocked')
                .setDescription(`The channel <#${channel.id}> has been successfully unlocked.`)
                .setColor(0x00ff00)
                .setTimestamp();

            let replyContent = { embeds: [embed] };

            // If any errors occurred, include them in the response
            if (errors.length > 0) {
                replyContent.content = `Some roles could not be updated: ${errors.join(', ')}`;
            }

            await interaction.editReply(replyContent);
        } catch (error) {
            console.error('Error unlocking channel:', error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'An error occurred while trying to unlock the channel.', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: 'An error occurred while trying to unlock the channel.', flags: MessageFlags.Ephemeral });
            }
        }
    },
};
