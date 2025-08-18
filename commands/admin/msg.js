const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

const devPerms = require('../../devperms.json');

module.exports = {
    id: '1000007', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('msg')
        .setDescription('[DEPRECATED] Allows a specific user to pass a string for the bot to say in the channel.')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message for the bot to say')
                .setRequired(true)),
    async execute(interaction) {
        const message = interaction.options.getString('message');

        const embed = new EmbedBuilder()
        
        // Permission check
        const userPerm = devPerms.usermap.find(u => u.userid === interaction.user.id);
        if (!userPerm || userPerm.level <= 100) {
            embed.setColor(0xff0000);
            embed.setTitle('You do not have permission to use this command.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        if (require('../../settings.json').devcmdsenabled != true) {
            embed.setColor(0xff0000);
            embed.setTitle('Developer commands are disabled in `settings.json`.');
            return interaction.reply({ embeds: [embed] });
        }

        // Reply to the interaction to let the user know their message was sent
        await interaction.reply({ content: 'Message sent!', flags: MessageFlags.Ephemeral });

        // Send the message to the channel, interpreting any newlines, markdown, etc.
        await interaction.channel.send({
            content: message, // Send the message as-is, allowing \n and markdown like ```codeblocks```
        });
        console.log(interaction.user.id + " sent message :" + `"` + message + `"`);

    },
};
