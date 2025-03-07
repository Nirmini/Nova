module.exports = {
    id: '0719221', // Unique 6-digit command ID
    /**
     * Executes the dice roll command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        const args = message.content.split(' ').slice(1); // Extract arguments (e.g., d20)
        
        if (args.length < 1) {
            return message.reply('Usage: `?dice <type>` (e.g., `?dice d20`)');
        }

        const diceType = args[0].toLowerCase(); // Normalize input
        const validDice = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20']; // Expandable list

        if (!validDice.includes(diceType)) {
            return message.reply(`Invalid dice type. Available options: ${validDice.join(', ')}`);
        }

        const sides = parseInt(diceType.replace('d', ''), 10); // Extract number of sides
        const result = Math.floor(Math.random() * sides) + 1; // Roll the dice

        return message.reply(`🎲 You rolled a **${diceType}** and got **${result}**!`);
    },
};
