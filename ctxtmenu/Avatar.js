const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Avatar')
        .setType(ApplicationCommandType.User),

    async execute(interaction) {
        const targetUser = interaction.targetUser;
        const avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });

        const embed = new EmbedBuilder()
            .setTitle(`${targetUser.username}'s Global Avatar`)
            .setDescription(
                `[PNG](${avatarURL.replace('.webp', '.png')}) // ` +
                `[WEBP](${avatarURL}) // ` +
                `[JPG](${avatarURL.replace('.webp', '.jpg')}) `
            )
            .setImage(avatarURL)
            .setFooter({ text: 'NovaBot: Discord Functions' })
            .setColor(0x2ecc71);

        await interaction.reply({ embeds: [embed]});
    }
};