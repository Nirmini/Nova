const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    id: '2876459', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('credits')
        .setDescription('NovaBot Credits.'),
    async execute(interaction) {
        const NirminiDevLogo = new AttachmentBuilder('./Icos/Nirmini/NirminiDevelopment-Banner.png');
        const NovaLogo = new AttachmentBuilder('./Icos/NirminiDevelopment.png');
        const creditsEmbed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('Nova Credits')
            .setAuthor({ name: 'Nova' })
            .setThumbnail('https://i.imgur.com/fEQIChj.png')
            .addFields(
                { name: '**TECHNICAL STAFF**', value: 'West7014 - Lead Developer and Project Manager' },
                { name: '**ARTISTIC STAFF**', value: 'West7014 - Graphic Designer' },
                { name: '**SUPPORTING DEVELOPERS**', value: '.aaron227 - Former Internal Bug Testing & QA Support Staff\nZacharyeb17 - Former Internal Bug Testing' },
                { name: '**INSPIRATION**', 
value: `
- Dyno by Flexlabs
- Bloxlink by Bloxlink
- Tickets by rxdn (GitHub)
- Ticket Tool by BattleEye
- Guardsman by Bunker Bravo Interactive
` }
            )
            .setTimestamp()
            .setImage('attachment://NirminiDevelopment-Banner.png')
            .setFooter({ text: '\"Unbound Potential.\"' });

        await interaction.reply({ embeds: [creditsEmbed], files: [NirminiDevLogo] });
    },
};