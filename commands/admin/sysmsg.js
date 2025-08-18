const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

const devPerms = require('../../devperms.json');

module.exports = {
    id: '1000010', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('sysmsg')
        .setDescription('Send a system message as an embed.')
        .addStringOption(option =>
            option
                .setName('title')
                .setDescription('Title of the message.')
                .setRequired(true)) // Required option first
        .addStringOption(option =>
            option
                .setName('contentline1')
                .setDescription('First line of content.')
                .setRequired(true)) // Required option second
        .addStringOption(option =>
            option
                .setName('author')
                .setDescription('Author of the message.')
                .setRequired(false)) // Optional option
        .addStringOption(option =>
            option
                .setName('contentline2')
                .setDescription('Second line of content.')
                .setRequired(false)) // Optional option
        .addStringOption(option =>
            option
                .setName('contentline3')
                .setDescription('Third line of content.')
                .setRequired(false)) // Optional option
        .addStringOption(option =>
            option
                .setName('footer')
                .setDescription('Footer of the message.')
                .setRequired(false)) // Optional option
        .addBooleanOption(option =>
            option
                .setName('timestamp')
                .setDescription('Include a timestamp? (true/false)')
                .setRequired(false)), // Restricts to true/false as a BooleanOption

    async execute(interaction) {
        const embed2 = new EmbedBuilder()
        
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

        // Collect options
        const title = interaction.options.getString('title');
        const contentLine1 = interaction.options.getString('contentline1');
        const author = interaction.options.getString('author') || '\u200B';
        const contentLine2 = interaction.options.getString('contentline2') || '';
        const contentLine3 = interaction.options.getString('contentline3') || '';
        const footer = interaction.options.getString('footer') || '\u200B';
        const includeTimestamp = interaction.options.getBoolean('timestamp') ?? false; // Explicitly handle null as false

        // Create the embed
        const embed = new EmbedBuilder()
            .setColor(0x0099ff) // Adjust as needed
            .setTitle(title)
            .setDescription(`${contentLine1}\n${contentLine2}\n${contentLine3}`);

        if (author) embed.setAuthor({ name: author });
        if (footer) embed.setFooter({ text: footer });
        if (includeTimestamp) embed.setTimestamp();

        // Send the embed
        await interaction.reply({ content: 'Message sent!', flags: MessageFlags.Ephemeral });
        await interaction.channel.send({ embeds: [embed] });
        console.log(`UID: ${interaction.user.id} successfully sent a system message.`);
    },
};
