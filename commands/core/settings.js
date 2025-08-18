const {
    SlashCommandBuilder,
    EmbedBuilder,
    AttachmentBuilder,
    MessageFlags,
    PermissionFlagsBits
} = require('discord.js');

const { getData, updateData } = require('../../src/Database');
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
            const basePath = `guildsettings/${guildId}/config`;
            const embed = new EmbedBuilder().setColor(0x2b2d31);

            if (subcommand === 'export') {
                const configData = await getData(basePath);
                console.log('Fetched configData:', configData);
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
                    console.error('Failed to stringify configData:', configData);
                    return interaction.reply({
                        content: `<:Failure:${botemoji.Failure}> Failed to export configuration: invalid data.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                // Overwrite ./settings.json as a temporary export file
                const settingsPath = path.resolve(__dirname, './settings.json'); //Only write to the local temp and not the important one in root.
                fs.writeFileSync(settingsPath, jsonString);

                // Use it as attachment
                const fileBuffer = fs.readFileSync(settingsPath);
                const file = new AttachmentBuilder(fileBuffer).setName(`${guildId}-NovaConfig.json`);


                embed
                    .setTitle(`<:Check:${botemoji.Check}> Configuration Export`)
                    .setDescription(`Here is your server's Nova configuration.`);

                return interaction.reply({
                    files: [file],
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });


            } else if (subcommand === 'get') {
                const keyPathRaw = interaction.options.getString('key');
                const keyPath = keyPathRaw.replace(/\./g, '/');
                const fullPath = `${basePath}/${keyPath}`;

                const configData = await getData(basePath);
                const value = keyPathRaw.split(/[./]/).reduce((acc, key) => acc?.[key], configData);

                if (value === null || value === undefined) {
                    embed.setColor(0xffcc00).setTitle(`<:Failure:${botemoji.Failure}> Key Not Found`)
                        .setDescription(`No value found for \`${keyPathRaw}\`.`);
                } else {
                    embed.setTitle(`<:Success:${botemoji.Success}> Retrieved Value`)
                        .addFields([
                            { name: 'Key', value: `\`${keyPathRaw}\`` },
                            { name: 'Value', value: `\`${JSON.stringify(value)}\`` }
                        ]);
                }
            
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } else if (subcommand === 'set') {
                const keyPathRaw = interaction.options.getString('key');
                const newValueRaw = interaction.options.getString('value');
                const keyPath = keyPathRaw.replace(/\./g, '/');
                const fullPath = `${basePath}/${keyPath}`;

                const blockedKeys = ['guildid', 'nirminiid', 'nirminiID'];
                if (blockedKeys.includes(keyPathRaw.toLowerCase().split(/[./]/).pop())) {
                    embed.setColor(0xff0000).setTitle(`<:Failure:${botemoji.Failure}> Restricted Key`)
                        .setDescription(`\`${keyPathRaw}\` is a protected key and cannot be edited.`);
                    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }
            
                // Get entire config object
                const configData = await getData(basePath);
            
                if (!configData) {
                    embed.setColor(0xff0000).setTitle(`<:Failure:${botemoji.Failure}> No Configuration Found`)
                        .setDescription(`This server doesn't have a configuration setup yet.`);
                    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }
            
                const pathArray = keyPathRaw.split(/[./]/);
            
                // Verify the key exists inside config
                const exists = checkNestedKeyExists(configData, pathArray);
                if (!exists) {
                    embed.setColor(0xffcc00).setTitle(`<:Failure:${botemoji.Failure}> Key Doesn't Exist`)
                        .setDescription(`Only existing keys can be set.\nMissing: \`${keyPathRaw}\``);
                    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }
            
                // Fetch current value
                const existingValue = pathArray.reduce((acc, key) => acc?.[key], configData);
            
                let parsed;
                try {
                    parsed = JSON.parse(newValueRaw);
                } catch {
                    parsed = newValueRaw;
                }
            
                await updateData(fullPath, parsed);
            
                embed.setTitle(`<:Success:${botemoji.Success}> Key Updated`)
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
                    .setTitle(`<:Failure:${botemoji.Failure}> Unexpected Error`)
                    .setDescription(`An unknown subcommand was triggered.`);
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

        } catch (error) {
            console.error('Settings command error:', error);
            return interaction.reply({
                content: `<:Failure:${botemoji.Failure}> An unexpected error occurred.`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
