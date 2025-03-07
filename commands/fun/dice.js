const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    id: '4288538', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Roll a dice with the specified number of sides.')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of dice to roll (e.g., d4, d6, d8, d10, d12, d20).')
                .setRequired(true)
                .addChoices(
                    { name: 'd4', value: '4' },
                    { name: 'd6', value: '6' },
                    { name: 'd8', value: '8' },
                    { name: 'd10', value: '10' },
                    { name: 'd12', value: '12' },
                    { name: 'd20', value: '20' }
                )),
    async execute(interaction) {
        const type = interaction.options.getString('type');
        const sides = parseInt(type, 10);

        // Roll the dice by generating a random number between 1 and the number of sides
        const result = Math.floor(Math.random() * sides) + 1;

        await interaction.reply(`🎲 You rolled a d${sides} and got **${result}**!`);
    },
};
// Might add d28, d50, and d100