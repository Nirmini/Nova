const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

const devPerms = require('../../devperms.json');

module.exports = {
    id: '1482716', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('testembed')
        .setDescription('Replies with an embed!'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
        
        // Permission check
        const userPerm = devPerms.usermap.find(u => u.userid === interaction.user.id);
        if (!userPerm || userPerm.level <= 100) {
            embed.setColor(0xff0000);
            embed.setTitle('You do not have permission to use this command.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        if (require('../../settings.json').devcmdsenabled != true) {
            embed.setColor(0xff0000);
            embed.setTitle('Developer commands are disabled in `settings.json`.');
            return interaction.reply({ embeds: [embed] });
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
