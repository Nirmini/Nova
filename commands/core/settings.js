const {
    SlashCommandBuilder,
    EmbedBuilder,
    AttachmentBuilder,
    MessageFlags,
    PermissionFlagsBits
} = require('discord.js');

const { getGuildConfig, setGuildConfig } = require('../../src/Database');
const botemoji = require('../../emoji.json');
const cfg = require('../../settings.json');
const path = require('path');
const fs = require('fs');

function checkNestedKeyExists(obj, pathArray) {
    return pathArray.reduce((acc, key) => {
        return (acc && Object.prototype.hasOwnProperty.call(acc, key)) ? acc[key] : undefined;
    }, obj) !== undefined;
}

module.exports = {
    id: '2000017',
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Configure your server\'s Nova configuration.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('export')
                .setDescription('Get a copy of your server\'s JSON Configuration.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('import')
                .setDescription('Import a Nova JSON Server configuration.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('get')
                .setDescription('Get the value of the provided key.')
                .addStringOption(option =>
                    option.setName('key')
                        .setDescription('The key to fetch the value of.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set a configuration Key-Value pair value.')
                .addStringOption(option =>
                    option.setName('key')
                        .setDescription('The key to set the value of.')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('value')
                        .setDescription('The value to set.')
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();
            const guildId = interaction.guildId;
            const embed = new EmbedBuilder().setColor(0x2b2d31);

            if (subcommand === 'export') {
                const configData = await getGuildConfig(guildId);
                if (!configData) {
                    return interaction.reply({
                        content: `<:Failure:${botemoji.Failure}> No configuration found for this guild.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                let jsonString;
                try {
                    jsonString = JSON.stringify(configData, null, 4);
                    if (!jsonString || jsonString === 'null') throw new Error('Invalid config content.');
                } catch (err) {
                    return interaction.reply({
                        content: `<:Failure:${botemoji.Failure}> Failed to export configuration: invalid data.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                const settingsPath = path.resolve(__dirname, './settings.json');
                fs.writeFileSync(settingsPath, jsonString);

                const fileBuffer = fs.readFileSync(settingsPath);
                const file = new AttachmentBuilder(fileBuffer).setName(`${guildId}-NovaConfig.json`);


                embed
                    .setTitle(`<:NovaSuccess:${botemoji.NovaSuccess}> Configuration Export`)
                    .setDescription(`Here is your server's Nova configuration.`);

                return interaction.reply({
                    files: [file],
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });


            } else if (subcommand === 'get') {
                let keyPathRaw = interaction.options.getString('key');
                let configData = await getGuildConfig(guildId);
                let value;
                if (configData) {
                    let pathArr = keyPathRaw.split(/[./]/);
                    value = pathArr.reduce((acc, key) => acc?.[key], configData);
                    if (value === undefined && configData['%' + pathArr[0]]) {
                        pathArr[0] = '%' + pathArr[0];
                        value = pathArr.reduce((acc, key) => acc?.[key], configData);
                    }
                }

                if (value === null || value === undefined) {
                    embed.setColor(0xffcc00).setTitle(`<:Failure:${botemoji.Failure}> Key Not Found`)
                        .setDescription(`No value found for \`${keyPathRaw}\`.`);
                } else {
                    embed.setTitle(`<:NovaSuccess:${botemoji.NovaSuccess}> Retrieved Value`)
                        .addFields([
                            { name: 'Key', value: `\`${keyPathRaw}\`` },
                            { name: 'Value', value: `\`${JSON.stringify(value)}\`` }
                        ]);
                }
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

            } else if (subcommand === 'set') {
                let keyPathRaw = interaction.options.getString('key');
                let newValueRaw = interaction.options.getString('value');
                let pathArr = keyPathRaw.split(/[./]/);
                        
                // Block writes to keys starting with a percent sign
                if (pathArr[0].startsWith('%')) {
                    embed.setColor(0xff0000).setTitle(`<:NovaFailure:${botemoji.NovaFailure}> Restricted Key`)
                        .setDescription(`Keys starting with '%' are protected and cannot be edited.`);
                    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }
            
                const configData = await getGuildConfig(guildId);
                if (!configData) {
                    embed.setColor(0xff0000).setTitle(`<:NovaFailure:${botemoji.NovaFailure}> No Configuration Found`)
                        .setDescription(`This server doesn't have a configuration setup yet.`);
                    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }
            
                // --- NEW: Block writes if a %key exists ---
                if (configData['%' + pathArr[0]] !== undefined) {
                    embed.setColor(0xff0000).setTitle(`<:NovaFailure:${botemoji.NovaFailure}> Protected Key`)
                        .setDescription(`A protected key "%${pathArr[0]}" exists. You cannot set "${pathArr[0]}".`);
                    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }
            
                // Only allow setting existing keys (do not allow creation of new keys)
                let exists = checkNestedKeyExists(configData, pathArr);
                if (!exists && configData['%' + pathArr[0]]) {
                    pathArr[0] = '%' + pathArr[0];
                    exists = checkNestedKeyExists(configData, pathArr);
                }
                if (!exists) {
                    embed.setColor(0xffcc00).setTitle(`<:NovaFailure:${botemoji.NovaFailure}> Key Doesn't Exist`)
                        .setDescription(`Only existing keys can be set.\nMissing: \`${keyPathRaw}\``);
                    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }
            
                const existingValue = pathArr.reduce((acc, key) => acc?.[key], configData);
            
                let parsed;
                try {
                    parsed = JSON.parse(newValueRaw);
                } catch {
                    parsed = newValueRaw;
                }
            
                await setGuildConfig(guildId, keyPathRaw, parsed);
            
                embed.setTitle(`<:NovaSuccess:${botemoji.NovaSuccess}> Key Updated`)
                    .addFields([
                        { name: 'Key', value: `\`${keyPathRaw}\`` },
                        { name: 'Old Value', value: `\`${JSON.stringify(existingValue)}\`` },
                        { name: 'New Value', value: `\`${JSON.stringify(parsed)}\`` }
                    ]);
                
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } else if (subcommand === 'import') {
                return interaction.reply({
                    content: `<:Warning:${botemoji.Warning}> Import coming soon.`,
                    flags: MessageFlags.Ephemeral
                });

            } else {
                embed.setColor(0xff0000)
                    .setTitle(`<:NovaFailure:${botemoji.NovaFailure}> Unexpected Error`)
                    .setDescription(`An unknown subcommand was triggered.`);
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

        } catch (error) {
            console.error('Settings command error:', error);
            return interaction.reply({
                content: `<:NovaFailure:${botemoji.NovaFailure}> An unexpected error occurred.`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
