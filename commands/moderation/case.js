const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { getCaseData, updateUserCase } = require('../../src/NovaCases');

module.exports = {
    id: '6000025', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('case')
        .setDescription('View/Update Case Data')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View a case\'s data')
                .addStringOption(option =>
            option.setName('caseid')
                .setDescription('The ID of the case you want to view.')
                .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('update')
                .setDescription('Updates an existing case')
                .addStringOption(option =>
            option.setName('caseid')
                    .setDescription('The ID of the case you want to update.')
                    .setRequired(true))
                .addStringOption(option =>
            option.setName('newdesc')
                    .setDescription('The new description you want for the case.')
                    .setRequired(true))),
    async execute(interaction) {
        //
    }
};