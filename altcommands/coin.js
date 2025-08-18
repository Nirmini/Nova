const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
    id: '0000003', // Unique 6-digit command ID
    /**
     * Executes the ?coin command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        // Randomly pick Heads or Tails
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        // Use local images or URLs for heads/tails
        const imageFile = result === 'Heads'
            ? new AttachmentBuilder('../Icos/cmds/coin_heads.png')
            : new AttachmentBuilder('../Icos/cmds/coin_tails.jpg');

        const embed = new EmbedBuilder()
            .setTitle('🪙 Coin Flip')
            .setDescription(`The coin landed on **${result}**!`)
            .setColor(result === 'Heads' ? 0xFFD700 : 0xAAAAAA)
            .setImage(`attachment://${result === 'Heads' ? 'coin_heads.png' : 'coin_tails.jpg'}`);

        await message.reply({ embeds: [embed], files: [imageFile] });
    },
};