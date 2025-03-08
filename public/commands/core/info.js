const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    id: '2159245', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Info About Nova.'),
    async execute(interaction) {
        const creditsEmbed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('Nova Information')
            .setAuthor({ name: 'Nova 22' })
            .setThumbnail('https://i.imgur.com/nhqjXCq.png')
            .addFields(
                { name: '**What is Nova?**', value: '\u200B' },
                { name: '\u200B', value: 'Nova is a powerful moderation bot intended to be able to work with communities on multiple platforms.', inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: '\u200B', value: 'Please see \`/setup\` for community setup tools.', inline: true },
                { name: '\u200B', value: '\u200B' }
            )
            .setTimestamp()
            .setFooter({ text: 'Nova - Nirmini Development' });

        await interaction.user.send({ embeds: [creditsEmbed] });
    },
};
// TO BE UPDATED