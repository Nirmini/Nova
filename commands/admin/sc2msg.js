const {
    SlashCommandBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    MessageFlags,
} = require('discord.js');

const devPerms = require('../../devperms.json');

module.exports = {
    id: '1244119',
    data: new SlashCommandBuilder()
        .setName('sc2msg')
        .setDescription('Send a system message using Components v2.')
        .addStringOption(option =>
            option.setName('title').setDescription('Title of the message.').setRequired(true))
        .addStringOption(option =>
            option.setName('contentline1').setDescription('First line of content.').setRequired(true))
        .addStringOption(option =>
            option.setName('contentline2').setDescription('Second line of content.').setRequired(false))
        .addStringOption(option =>
            option.setName('contentline3').setDescription('Third line of content.').setRequired(false))
        .addStringOption(option =>
            option.setName('buttonlabel').setDescription('Button label (optional)').setRequired(false))
        .addStringOption(option =>
            option.setName('buttonurl').setDescription('Button URL (optional, must start with http)').setRequired(false)),

    async execute(interaction) {
        // Permission check (replace with your own logic as needed)
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

        // Collect options
        const title = interaction.options.getString('title');
        const contentLine1 = interaction.options.getString('contentline1');
        const contentLine2 = interaction.options.getString('contentline2') || '';
        const contentLine3 = interaction.options.getString('contentline3') || '';
        const buttonLabel = interaction.options.getString('buttonlabel');
        const buttonUrl = interaction.options.getString('buttonurl');

        // Build the main container
        const container = new ContainerBuilder();

        // Title as a header
        const titleText = new TextDisplayBuilder().setContent(`# ${title}`);
        container.addTextDisplayComponents(titleText);

        // Content lines
        const contentLines = [contentLine1, contentLine2, contentLine3].filter(Boolean).join('\n');
        const contentText = new TextDisplayBuilder().setContent(contentLines);
        container.addTextDisplayComponents(contentText);

        // Add a button if both label and URL are provided
        if (buttonLabel && buttonUrl && buttonUrl.startsWith('http')) {
            const button = new ButtonBuilder()
                .setLabel(buttonLabel)
                .setStyle(ButtonStyle.Link)
                .setURL(buttonUrl);

            const section = new SectionBuilder().setButtonAccessory(button);
            container.addSectionComponents(section);
        }

        await interaction.reply({
            content: 'System message sent!',
            flags: MessageFlags.Ephemeral,
        });

        await interaction.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};