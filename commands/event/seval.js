const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

const botEmojiId = '1319480831303225354';

module.exports = {
    id: '3763760', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('seval')
        .setDescription('Start an evaluation')
        .addStringOption(option =>
            option.setName('place')
                .setDescription('Location of the eval')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('pingrole')
                .setDescription('Role to ping')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('sendchannel')
                .setDescription('Channel to announce in')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const guildId = interaction.guildId;
            const user = interaction.user;
            const placeURL = interaction.options.getString('place');
            const pingRole = interaction.options.getString('pingrole');
            const channel = interaction.options.getChannel('sendchannel'); // Resolves the channel object

            // Check if the user has the required permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.CreateEvents)) {
                await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Check if the resolved channel is valid
            if (!channel || !channel.isTextBased()) {
                await interaction.reply({ content: 'The specified channel is not a valid text channel.', flags: MessageFlags.Ephemeral });
                return;
            }

            const tryoutEmbed = new EmbedBuilder()
                .setColor(0x264a78)
                .setTitle('Evaluation Notice.')
                .setDescription(`An evaluation has been started by ${user.tag}.`)
                .addFields(
                    { name: 'Location: ', value: placeURL },
                    { name: '\u200B', value: 'When you join follow all given instructions. You will be unable to join after \`5min\`.' },
                    { name: 'Additional Info:', value: 'We reserve the right to blacklist you as we see fit.' },
                )
                .setTimestamp();

            // Send the ping role and embed
            await channel.send(pingRole); // Sends the role mention
            const embedMessage = await channel.send({ embeds: [tryoutEmbed] });

            // Confirm successful scheduling to the user
            await interaction.reply({ content: 'Eval has been scheduled.', flags: MessageFlags.Ephemeral });
        } catch (error) {
            // Log the error for debugging
            console.error('Error during /seval command execution:', error);

            // Reply with a friendly error message
            if (!interaction.replied) {
                await interaction.reply({ content: 'There was an error scheduling the eval. Please try again later.', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.followUp({ content: 'An unexpected error occurred.', flags: MessageFlags.Ephemeral });
            }
        }
    },
};
