const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
    id: '0000003',
    /**
     * Executes the ?coin command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        // Use local images or URLs for heads/tails (REDOING THE IMAGES SOON I SWEAR)
        const imageFile = result === 'Heads'
            ? new AttachmentBuilder('../Icos/cmds/coin_heads.png')
            : new AttachmentBuilder('../Icos/cmds/coin_tails.png');

        const embed = new EmbedBuilder()
            .setTitle('Coin Flip')
            .setDescription(`The coin landed on **${result}**!`)
            .setColor(result === 'Heads' ? 0xFFD700 : 0xAAAAAA)
            .setImage(`attachment://${result === 'Heads' ? 'coin_heads.png' : 'coin_tails.png'}`);

        await message.reply({ embeds: [embed], files: [imageFile] });
    },
};