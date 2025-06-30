const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { setData, getData } = require('../../src/firebaseAdmin'); // Admin SDK functions
const birthdayModule = require('../../core/modules/birthday');
const Client = require('../../core/global/Client');
const cfg = require('../../settings.json')

module.exports = {
    id: '1735921', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('devrun')
        .setDescription('Run a specific module remotely. Intended for developers to use for debugging.'),
    async execute(interaction) {
        try {
            const embed = new EmbedBuilder()
            
            // Permission check
            const userPerm = devPerms.usermap.find(u => u.userid === message.author.id);
            if (!userPerm || userPerm.level <= 100) {
                embed.setColor(0xff0000);
                embed.setTitle('You do not have permission to use this command.');
                return message.reply({ embeds: [embed] });
            }
            if (!interaction.user.id === cfg.operator.userId) return await interaction.reply({ content: 'You are not authorized to use this command.', flags: MessageFlags.Ephemeral });
            birthdayModule.sendBirthdayPing(Client);
        } catch (error) {
            console.error('Error during command execution:', error.message);
            await interaction.reply({ content: 'An error occurred while processing the command.', flags: MessageFlags.Ephemeral });
        }
    },
};
