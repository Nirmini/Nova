const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '1482716', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('testembed')
        .setDescription('Replies with an embed!'),
    async execute(interaction) {
        const authorizedUserId = '600464355917692952'; // The allowed UID

        // Check if the user executing the command is the authorized user
        if (interaction.user.id !== authorizedUserId) {
            await interaction.reply({ content: 'You are not authorized to use this command.', flags: MessageFlags.Ephemeral });
            return;
        }

        // Create the embed
        const exampleEmbed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('Some title')
            .setURL('https://discord.js.org/')
            .setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/BGPsW1F.png', url: 'https://discord.js.org' })
            .setDescription('Some description here')
            .setThumbnail('https://i.imgur.com/BGPsW1F.png')
            .addFields(
                { name: 'Regular field title', value: 'Some value here' },
                { name: '\u200B', value: '\u200B' },
                { name: 'Inline field title', value: 'Some value here', inline: true },
                { name: 'Inline field title', value: 'Some value here', inline: true },
                { name: 'Inline field title', value: 'Some value here', inline: true },
                { name: '\u200B', value: '\u200B' }
            )
            .addFields({ name: 'Non-Inline field title', value: 'Some value here', inline: false })
            .setImage('https://i.imgur.com/BGPsW1F.png')
            .setTimestamp()
            .setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/BGPsW1F.png' });

        // Reply with the embed
        await interaction.reply({ embeds: [exampleEmbed] });
    },
};
