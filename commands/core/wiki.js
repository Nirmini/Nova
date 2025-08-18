const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    id: '2000022', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('wiki')
        .setDescription('See the Nova Wiki.'),
    async execute(interaction) {
        const creditsEmbed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('Nova Wiki Info')
            .setAuthor({ name: 'Nova XDebug' })
            .setThumbnail('https://i.imgur.com/nhqjXCq.png')
            .addFields(
                { name: 'The Nova wiki is where you can find in-depth information on some of the following.', value: '\u200B' },
                { name: '▶ Nova Commands', value: '\u200B' },
                { name: '▶ Nova Guild Setup', value: '\u200B' },
                { name: '▶ Nova Support & FAQs', value: '\u200B' },
                { name: 'View it here:', value: 'https://thatwest7014.github.io/projects/nova/wiki' },
            )
            .setTimestamp()
            .setFooter({ text: 'Have an amazing rest of your day! *mewo* - Blitz' });

        await interaction.deferReply({ ephemeral: true });

        try {
            await interaction.user.send({ embeds: [creditsEmbed] });
            await interaction.editReply({
                content: 'Sent!',
                ephemeral: true
            });
        } catch (error) {
            console.error('Failed to send DM:', error);
            await interaction.editReply('I couldn’t DM you.');
        }
    },
};
