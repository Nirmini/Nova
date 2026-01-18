const { 
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
} = require('discord.js');

const devPerms = require('../../devperms.json');

module.exports = {
    id: '1000005',
    data: new SlashCommandBuilder()
        .setName('leaveserver')
        .setDescription('Make the bot leave the current server')
        .addStringOption(option =>
            option
                .setName('guildid')
                .setDescription('The ID of the guild to leave (optional, defaults to current server)')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('silentleave')
                .setDescription('Skip sending any message in the guild before leaving (default: true)')
                .setRequired(false)
        ),

    async execute(interaction) {
        const embed = new EmbedBuilder();

        // Permission check - restricted to devperm level 500+
        const userPerm = devPerms.usermap.find(u => u.userid === interaction.user.id);
        if (!userPerm || userPerm.level < 500) {
            embed.setColor(0xff0000);
            embed.setTitle('❌ Insufficient Permissions');
            embed.setDescription('You do not have permission to use this command. (Requires devperm level 500+)');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (require('../../settings.json').devcmdsenabled != true) {
            embed.setColor(0xff0000);
            embed.setTitle('⚠️ Developer Commands Disabled');
            embed.setDescription('Developer commands are disabled in `settings.json`.');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Get guild ID from option or use current guild
        const guildIdOption = interaction.options.getString('guildid');
        const targetGuildId = guildIdOption || interaction.guild.id;
        const silentLeave = interaction.options.getBoolean('silentleave') ?? true; // Default to true

        try {
            // Fetch the target guild
            const targetGuild = interaction.client.guilds.cache.get(targetGuildId);

            if (!targetGuild) {
                embed.setColor(0xff0000);
                embed.setTitle('❌ Guild Not Found');
                embed.setDescription(`Could not find a guild with ID: \`${targetGuildId}\``);
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            const guildName = targetGuild.name;
            const isCurrentGuild = targetGuildId === interaction.guild.id;

            // Send message in the guild before leaving if silentLeave is false
            if (!silentLeave && !isCurrentGuild) {
                try {
                    // Try to find a system channel or general channel to send goodbye message
                    const systemChannel = targetGuild.systemChannel;
                    const generalChannel = targetGuild.channels.cache.find(
                        channel => channel.name === 'general' && channel.isTextBased()
                    );
                    const anyTextChannel = targetGuild.channels.cache.find(
                        channel => channel.isTextBased() && 
                        channel.permissionsFor(targetGuild.members.me).has('SendMessages')
                    );
                    
                    const notificationChannel = systemChannel || generalChannel || anyTextChannel;
                    
                    if (notificationChannel) {
                        const goodbyeEmbed = new EmbedBuilder()
                            .setColor(0xffaa00)
                            .setTitle('👋 Leaving Server')
                            .setDescription('This bot is leaving the server. Thank you for having us!');
                        await notificationChannel.send({ embeds: [goodbyeEmbed] });
                    }
                } catch (messageError) {
                    console.error('Error sending leave message:', messageError);
                    // Continue with leaving even if message fails
                }
            }

            // Reply to the command user
            if (isCurrentGuild) {
                embed.setColor(0xffaa00);
                embed.setTitle('👋 Leaving Server');
                embed.setDescription(`Leaving **${guildName}** (ID: \`${targetGuildId}\`)${silentLeave ? ' silently' : ''}...`);
                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } else {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            }

            // Leave the guild
            await targetGuild.leave();

            // If we're leaving a different guild, send success message
            if (!isCurrentGuild) {
                embed.setColor(0x00aa00);
                embed.setTitle('✅ Left Server');
                embed.setDescription(`Successfully left **${guildName}** (ID: \`${targetGuildId}\`)${silentLeave ? ' silently' : ''}.`);
                await interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error leaving server:', error);
            embed.setColor(0xff0000);
            embed.setTitle('❌ Error');
            embed.setDescription(`Failed to leave the server. Error: ${error.message}`);
            
            // Try to edit reply if deferred, otherwise reply
            try {
                await interaction.editReply({ embeds: [embed] });
            } catch {
                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }
        }
    },
};