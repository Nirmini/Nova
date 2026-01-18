// DEPREACTION WARNING!! : This command is no longer needed due to automatic and manual systems being added.
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getGuildConfig, setGuildConfig } = require('../../src/Database'); // Use Admin SDK
const DB_PATH = 'guildsettings';

const devPerms = require('../../devperms.json');

module.exports = {
    id: '1000008',
    data: new SlashCommandBuilder()
        .setName('serverconfig')
        .setDescription('Manage server settings for the bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Get, set, or setup a guild config')
                .setRequired(true)
                .addChoices(
                    { name: 'Get', value: 'get' },
                    { name: 'Set', value: 'set' },
                    { name: 'Setup', value: 'setup' }
                ))
        .addStringOption(option =>
            option.setName('key')
                .setDescription('The config key to get or modify')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('value')
                .setDescription('The new value (for setting only)')
                .setRequired(false)),

    async execute(interaction) {
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

        const guildId = interaction.guild.id;

        const action = interaction.options.getString('action');
        const key = interaction.options.getString('key');
        const value = interaction.options.getString('value');

        if (action === 'setup') {
            try {
                const existingConfig = await getGuildConfig(guildId, 'config');
                if (existingConfig) {
                    return interaction.reply({ content: '⚠️ This guild is already set up.', flags: MessageFlags.Ephemeral });
                }

                // For NirminiID generation, we'll use a simple counter approach
                const defaultConfig = getDefaultConfig();

                await setGuildConfig(guildId, 'config', defaultConfig);
                return interaction.reply({ content: `✅ This server has been set up!`, flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.error('Error setting up guild:', error);
                return interaction.reply({ content: '❌ Failed to set up the server configuration.', flags: MessageFlags.Ephemeral });
            }
        }

        if (action === 'get') {
            try {
                const config = await getGuildConfig(guildId, 'config');
                if (!config) {
                    return interaction.reply({ content: '⚠️ No configuration found for this server.', flags: MessageFlags.Ephemeral });
                }

                if (!key) {
                    return interaction.reply({
                        content: `🛠 **Server Configuration:**\n\`\`\`json\n${JSON.stringify(config, null, 2)}\n\`\`\``,
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (!(key in config)) {
                    return interaction.reply({ content: `⚠️ Key **${key}** does not exist in the config.`, flags: MessageFlags.Ephemeral });
                }

                let responseValue = config[key];
                return interaction.reply({ content: `🔍 **${key}**: \`${responseValue}\``, flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.error('Error fetching config:', error);
                return interaction.reply({ content: '❌ Failed to retrieve server configuration.', flags: MessageFlags.Ephemeral });
            }
        }

        if (action === 'set') {
            if (!key || value === null) {
                return interaction.reply({ content: '⚠️ You must specify both a key and a value.', flags: MessageFlags.Ephemeral });
            }

            try {
                const config = await getGuildConfig(guildId, 'config') || getDefaultConfig();

                if (!(key in config)) {
                    return interaction.reply({ content: `⚠️ Key **${key}** does not exist in the config.`, flags: MessageFlags.Ephemeral });
                }

                let newValue = value;
                if (typeof config[key] === 'boolean') {
                    newValue = value.toLowerCase() === 'true';
                } else if (!isNaN(value) && typeof config[key] === 'number') {
                    newValue = parseFloat(value);
                }

                await setGuildConfig(guildId, `config/${key}`, newValue);

                return interaction.reply({ content: `✅ **${key}** has been updated to \`${newValue}\`!`, flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.error('Error updating config:', error);
                return interaction.reply({ content: '❌ Failed to update server configuration.', flags: MessageFlags.Ephemeral });
            }
        }
    }
};

function getDefaultConfig() {
    return {
        disabledcommands: ["00000", "00001"],
        substat: "L0/L1/L2",
        rbxgroup: "<GID>",
        GroupName: "<GNME>",
        NirminiID: encodeBase64("1"), // Start from ID 1
        commandconfigs: {
            verifiedrole: "<VerifiedRoleId>"
        },
        RBXBinds: {
            "1-1": "<RoleIdHere>",
            "2-2": "<RoleIdHere>"
        },
        colours: {
            custom: false
        }
    };
}

// Base64 Encoding & Decoding to properly store NirminiID
function encodeBase64(str) {
    return Buffer.from(str).toString('base64');
}

function decodeBase64(encoded) {
    return Buffer.from(encoded, 'base64').toString('utf8');
}
