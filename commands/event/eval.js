const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, MessageFlags } = require('discord.js');

const emoji = require('../../emoji.json');

module.exports = {
    id: '3000001', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('eval')
        .setDescription('Schedule a evaluation')
        .addStringOption(option =>
            option.setName('datetime')
                .setDescription('Timestamp of the eval')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('pingrole')
                .setDescription('Role to ping (e.g., @RoleName)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('sendchannel')
                .setDescription('Channel to announce in')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('eventchannel')
                .setDescription('Stage channel for the event')
                .addChannelTypes(ChannelType.GuildStageVoice)), // Restricts to stage channels
    async execute(interaction) {
        try {
            const guildId = interaction.guildId;
            const user = interaction.user;
            const dateTime = interaction.options.getString('datetime');
            const pingRole = interaction.options.getString('pingrole');
            const sendChannel = interaction.options.getChannel('sendchannel');
            const eventChannel = interaction.options.getChannel('eventchannel'); // Optional stage channel

            // Check user permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.CreateEvents)) {
                await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Validate the send channel
            if (!sendChannel || !sendChannel.isTextBased()) {
                await interaction.reply({ content: 'The specified announcement channel is not a valid text channel.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Build the embed message
            const evalEmbed = new EmbedBuilder()
                .setColor(0x264a78)
                .setAuthor({ name: 'Scheduled Evaluation' })
                .addFields(
                    {
                        name: `<:Info:${emoji.NovaInfo}> Eval Details`,
                        value: `A eval has been scheduled by **${interaction.member?.nickname || user.username}**.\n\n` +
                               `- **When?** ${dateTime} (your local time).\n` +
                               `- **Where?** Join the ${eventChannel ? `"${eventChannel.name}"` : '**designated channel**'} stage.\n` +
                               `- **Attendance:** React to the <:Check:${emoji.Check}> below to confirm.`,
                    },
                    {
                        name: `<:Info:${emoji.NovaInfo}> Rules`,
                        value: `- Follow all instructions from the event host.\n` +
                               `- Do not speak unless given permission.\n` +
                               `- Notify staff if you need to go AFK.\n` +
                               `- Use proper grammar unless instructed otherwise.\n` +
                               `- Sharing event details is prohibited.`,
                    },
                    {
                        name: `<:Info:${emoji.NovaInfo}> Dress Code`,
                        value: `- Remove all items from your ROBLOX avatar:\n` +
                               `  - No shirts, pants, or accessories.\n` +
                               `  - No hats or animated faces.\n` +
                               `  - Use default "blocky" avatars only.`,
                    },
                    {
                        name: `<:ShieldDenied:${emoji.NovaFailure}> Dismissal Policy`,
                        value: `- Dismissed participants may attend another evaluation without penalty.\n` +
                               `- Complaining about dismissal will result in consequences.\n` +
                               `- Leave the stage if dismissed.`,
                    },
                    {
                        name: `<:Warning:${emoji.NovaWarning}> Disclosure`,
                        value: `The hosting group reserves the right to pass, fail, or blacklist participants at its discretion.`,
                    }
                )
                .setTimestamp();

            // Send the embed and add reactions
            await sendChannel.send(pingRole); // Send the role mention directly
            const embedMessage = await sendChannel.send({ embeds: [evalEmbed] });

            // React with custom emoji
            await embedMessage.react(emoji.Check);

            // Confirm the command execution
            await interaction.reply({ content: 'Evaluation has been scheduled.', flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error during /eval command execution:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'There was an error scheduling the evaluation. Please try again later.', flags: MessageFlags.Ephemeral });
            }
        }
    },
};
