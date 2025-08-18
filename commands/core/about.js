const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    id: '2000001', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('About NovaBot'),
    async execute(interaction) {
        const NirminiDevLogo = new AttachmentBuilder('./Icos/NirminiDevelopment.png');
        const NovaLogo = new AttachmentBuilder('./Icos/NovaPubPFP.png');
        const creditsEmbed = new EmbedBuilder()
            .setColor(0x50b9ff)
            .setTitle('About Nova')
            .setAuthor({ name: 'NovaBot: About Nova' })
            .setThumbnail('attachment://NovaPubPFP.png')
            .addFields(
                { name: '**About Nova:**', value: "\u200B" },
                { name: '\u200B', value: 'Nova and the NovaBot project is made and maintained by Nirmini Development with the goal of keeping a lot of features well-maintained so that users only need one bot instead of 10 or so.'},
                { name: '\u200B', value: 'Nova originally began life as a games bot being ported from BotGhost to Discord.js. Over time it\'s naturally evolved into a large project built to handle quite a bit of wear.' },
                { name: '\u200B', value: 'Nirmini still maintains this bot even thoughout our journey and various contracting work.' },
                { name: '**Inspiration for Nova is form the following**', 
value: `
- Dyno by Flexlabs (GitHub)
- Bloxlink by Bloxlink
- Tickets by rxdn (GitHub)
- Ticket Tool by BattleEye
- Guardsman by Bunker Bravo Interactive
` }
            )
            .setTimestamp()
            .setImage('attachment://NirminiDevelopment.png')
            .setFooter({ text: '\"Creativity Unbound.\"' });

        await interaction.reply({ embeds: [creditsEmbed], files: [NirminiDevLogo, NovaLogo] });
    },
};