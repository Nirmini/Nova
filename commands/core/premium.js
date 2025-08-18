const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '2000014', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('premium')
        .setDescription('Info About Nova Premium.'),
    async execute(interaction) {
        const creditsEmbed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('Nova Premium Info')
            .setAuthor({ name: 'Nova smth or smth' })
            .setThumbnail('https://i.imgur.com/nhqjXCq.png')
            .addFields(
                { name: 'Premium is the way to support Nova\'s development and it\'s developers.', value: '\u200B' },  // Added valid text here
                { name: 'Features', value: '\u200B' },
                { name: '▶ ROBLOX Moderation Integration', value: '\u200B' },
                { name: '▶ Longer storage on certain items.', value: '\u200B' },
                { name: '▶ Recognisiation as a project supporter.', value: '\u200B' },
                { name: 'Additional Info:', value: '\u200B' },
                { name: 'https://thatwest7014.github.io/nova/wiki/plus', value: '\u200B' },
            )
            .setTimestamp()
            .setFooter({ text: 'much mewo\'s - thatWest7014' });

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            try {
                await interaction.user.send({ embeds: [creditsEmbed] });
                await interaction.editReply({
                    content: 'Sent!',
                    flags: MessageFlags.Ephemeral
                });
            } catch (error) {
                console.error('Failed to send DM:', error);
                await interaction.editReply('I couldn’t DM you.');
            }
        },
    };
// This is currently canceled.