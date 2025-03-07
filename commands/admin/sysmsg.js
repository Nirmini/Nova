const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '1244118', // Unique 6-digit command ID
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
        // Check if the user is authorized
        const authorizedUID = '600464355917692952';
        if (interaction.user.id !== authorizedUID) {
            await interaction.reply({
                content: '🟥 You are not authorized to use this command.',
                flags: MessageFlags.Ephemeral,
            });
            console.log(`Unauthorized access attempt by UID: ${interaction.user.id}`);
            return;
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
