const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getData, setData, updateData } = require('../../src/firebaseAdmin'); // Use Admin SDK
const DB_PATH = 'guildsettings';

module.exports = {
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
        const userPerm = devPerms.usermap.find(u => u.userid === message.author.id);
        if (!userPerm || userPerm.level <= 300) {
            embed.setColor(0xff0000);
            embed.setTitle('You do not have permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        const guildId = interaction.guild.id;
        const guildConfigPath = `${DB_PATH}/${guildId}/config`;

        const action = interaction.options.getString('action');
        const key = interaction.options.getString('key');
        const value = interaction.options.getString('value');

        if (action === 'setup') {
            try {
                const existingConfig = await getData(guildConfigPath);
                if (existingConfig) {
                    return interaction.reply({ content: '⚠️ This guild is already set up.', flags: MessageFlags.Ephemeral });
                }

                // Fetch the highest NirminiID
                const allGuilds = await getData(DB_PATH) || {};
                let highestNirminiID = 0;

                for (const guild in allGuilds) {
                    const currentID = decodeBase64(allGuilds[guild].config?.NirminiID || 'MA=='); // Default "MA==" = 0
                    highestNirminiID = Math.max(highestNirminiID, parseInt(currentID) || 0);
                }

                const newNirminiID = encodeBase64((highestNirminiID + 1).toString());

                const defaultConfig = getDefaultConfig();
                defaultConfig.NirminiID = newNirminiID;

                await setData(guildConfigPath, defaultConfig);
                return interaction.reply({ content: `✅ This server has been set up! NirminiID: \`${highestNirminiID + 1}\``, flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.error('Error setting up guild:', error);
                return interaction.reply({ content: '❌ Failed to set up the server configuration.', flags: MessageFlags.Ephemeral });
            }
        }

        if (action === 'get') {
            try {
                const config = await getData(guildConfigPath);
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
                if (key === 'NirminiID') responseValue = decodeBase64(responseValue); // Decode NirminiID properly

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
                const config = await getData(guildConfigPath) || getDefaultConfig();

                if (!(key in config)) {
                    return interaction.reply({ content: `⚠️ Key **${key}** does not exist in the config.`, flags: MessageFlags.Ephemeral });
                }

                let newValue = value;
                if (typeof config[key] === 'boolean') {
                    newValue = value.toLowerCase() === 'true';
                } else if (!isNaN(value) && typeof config[key] === 'number') {
                    newValue = parseFloat(value);
                } else if (key === 'NirminiID') {
                    newValue = encodeBase64(value); // Ensure it's encoded
                }

                await updateData(guildConfigPath, { [key]: newValue });

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
