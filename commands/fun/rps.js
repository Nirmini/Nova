const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    id: '4000008', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Play Rock, Paper, Scissors (or something else) with the bot!')
        .addStringOption(option =>
            option.setName('choice')
                .setDescription('Enter your choice (rock, paper, scissors, or anything else)')
                .setMaxLength(45)
                .setRequired(true)
        ),
    async execute(interaction) {
        const userChoice = interaction.options.getString('choice');
        const validChoices = ['rock', 'paper', 'scissors'];
        const botChoice = validChoices[Math.floor(Math.random() * validChoices.length)]; // Bot randomly chooses
        let resultMessage;

        // Handle logic for valid choices
        if (validChoices.includes(userChoice.toLowerCase())) {
            if (userChoice.toLowerCase() === botChoice) {
                resultMessage = "It's a tie!";
            } else if (
                (userChoice.toLowerCase() === 'rock' && botChoice === 'scissors') ||
                (userChoice.toLowerCase() === 'paper' && botChoice === 'rock') ||
                (userChoice.toLowerCase() === 'scissors' && botChoice === 'paper')
            ) {
                resultMessage = `\`${userChoice}\` beats \`${botChoice}\`! You win!`;
            } else {
                resultMessage = `\`${botChoice}\` beats \`${userChoice}\`! I win!`;
            }
        } else {
            // Treat non-standard inputs as a loss
            resultMessage = `\`${botChoice}\` beats \`${userChoice}\`! I win!`;
        }

        // Create the embed response
        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle('Rock, Paper, Scissors (or something else)!')
            .addFields(
                { name: 'I chose:', value: botChoice.charAt(0).toUpperCase() + botChoice.slice(1), inline: true },
                { name: 'You chose:', value: userChoice, inline: true },
                { name: 'Result:', value: resultMessage, inline: false }
            )
            .setFooter({ text: 'Thanks for playing!' });

        // Reply to the interaction
        await interaction.reply({ embeds: [embed] });
    },
};
