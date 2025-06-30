const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    id: '1000001', // This is like, pretty important.
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('A command for testing various features.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('textmodal')
                .setDescription('Test a text input modal.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('form')
                .setDescription('Test a form with multiple inputs.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('buttons')
                .setDescription('Test buttons.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('embed')
                .setDescription('Test an embed message.')
        ),

    async execute(interaction) {
        const embed = new EmbedBuilder()
        
        // Permission check
        const userPerm = devPerms.usermap.find(u => u.userid === message.author.id);
        if (!userPerm || userPerm.level <= 100) {
            embed.setColor(0xff0000);
            embed.setTitle('You do not have permission to use this command.');
            return message.reply({ embeds: [embed] });
        }
        
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'textmodal') {
            // Create a modal for text input
            const modal = new ModalBuilder()
                .setCustomId('testTextModal')
                .setTitle('Test Text Modal');

            const textInput = new TextInputBuilder()
                .setCustomId('testTextInput')
                .setLabel('Enter some text')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const actionRow = new ActionRowBuilder().addComponents(textInput);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);
        } else if (subcommand === 'form') {
            // Create a modal for a form with multiple inputs
            const modal = new ModalBuilder()
                .setCustomId('testFormModal')
                .setTitle('Test Form Modal');

            const input1 = new TextInputBuilder()
                .setCustomId('formInput1')
                .setLabel('First Input')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const input2 = new TextInputBuilder()
                .setCustomId('formInput2')
                .setLabel('Second Input')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);

            const actionRow1 = new ActionRowBuilder().addComponents(input1);
            const actionRow2 = new ActionRowBuilder().addComponents(input2);

            modal.addComponents(actionRow1, actionRow2);

            await interaction.showModal(modal);
        } else if (subcommand === 'buttons') {
            // Create a message with buttons
            const button1 = new ButtonBuilder()
                .setCustomId('testButton1')
                .setLabel('Button 1')
                .setStyle(ButtonStyle.Primary);

            const button2 = new ButtonBuilder()
                .setCustomId('testButton2')
                .setLabel('Button 2')
                .setStyle(ButtonStyle.Secondary);

            const actionRow = new ActionRowBuilder().addComponents(button1, button2);

            await interaction.reply({
                content: 'Here are some test buttons:',
                components: [actionRow],
                ephemeral: true,
            });
        } else if (subcommand === 'embed') {
            // Create an embed message
            const embed = new EmbedBuilder()
                .setTitle('Test Embed')
                .setDescription('This is a test embed message.')
                .setColor(0x00AE86)
                .addFields(
                    { name: 'Field 1', value: 'This is the value for field 1.', inline: true },
                    { name: 'Field 2', value: 'This is the value for field 2.', inline: true }
                )
                .setFooter({ text: 'Test Embed Footer' })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                ephemeral: true,
            });
        }
    },

    async modalHandler(interaction) {
        if (interaction.customId === 'testTextModal') {
            const textInput = interaction.fields.getTextInputValue('testTextInput');
            await interaction.reply({
                content: `You entered: **${textInput}**`,
                ephemeral: true,
            });
        } else if (interaction.customId === 'testFormModal') {
            const input1 = interaction.fields.getTextInputValue('formInput1');
            const input2 = interaction.fields.getTextInputValue('formInput2') || 'No input provided';

            await interaction.reply({
                content: `Form submitted:\n- **First Input:** ${input1}\n- **Second Input:** ${input2}`,
                ephemeral: true,
            });
        }
    },

    async buttonHandler(interaction) {
        if (interaction.customId === 'testButton1') {
            await interaction.reply({
                content: 'You clicked **Button 1**!',
                ephemeral: true,
            });
        } else if (interaction.customId === 'testButton2') {
            await interaction.reply({
                content: 'You clicked **Button 2**!',
                ephemeral: true,
            });
        }
    },
};