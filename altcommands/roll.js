const { EmbedBuilder } = require('discord.js');

module.exports = {
    id: '0000015', // Unique 6-digit command ID
    /**
     * Executes the ?roll <die> command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     * @param {string[]} args - The arguments passed with the command.
     */
    execute: async (message, args) => {
        const validDice = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
        const die = args[0]?.toLowerCase();

        if (!validDice.includes(die)) {
            await message.reply(`Usage: \`?roll <d4/d6/d8/d10/d12/d20>\``);
            return;
        }

        const max = parseInt(die.slice(1), 10);
        const roll = Math.floor(Math.random() * max) + 1;

        const embed = new EmbedBuilder()
            .setTitle('🎲 Dice Roll')
            .setDescription(`You rolled a **${die}** and got **${roll}**!`)
            .setColor(0x5865F2);

        await message.reply({ embeds: [embed] });
    },
};