const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    id: '0000005', // Unique 6-digit command ID
    /**
     * Executes the credits command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        const NirminiDevLogo = new AttachmentBuilder('./Icos/Nirmini/ND/NirminiDevelopment-v2Logo-Text.png');
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
- Dyno by [Flexlabs](https://github.com/Flexlabs)
- Bloxlink by [Bloxlink](https://blox.link)
- Tickets by [rxdn (GitHub)](https://github.com/rxdn)
- Ticket Tool by [BattleEye](https://tickettool.xyz/)
- Guardsman by [Bunker Bravo Interactive](https://bunkerbravointeractive.com)
` }
            )
            .setTimestamp()
            .setImage('attachment://NirminiDevelopment-Banner.png')
            .setFooter({ text: '\"Unbound Potential.\"' });
        await message.reply({ embeds: [creditsEmbed],  files: [NirminiDevLogo]  });
    },
};
