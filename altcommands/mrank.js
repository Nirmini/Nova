const { PermissionsBitField, EmbedBuilder, MessageFlags } = require('discord.js');
const { setGuildConfig, getGuildConfig } = require('../src/Database');
const emoji = require('../emoji.json');

module.exports = {
    id: '0000011',
    name: 'mrank',
    description: 'Add or remove ranks (roles) for the guild',
    usage: '?mrank add <@role> | ?mrank del <@role>',
    /**
     * Executes the mrank command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     * @param {string[]} args - The arguments passed with the command.
     */
    async execute(message, args) {
        const logEmbed = new EmbedBuilder();
        const guildId = message.guild.id;

        try {
            // Check if the user has the necessary permissions
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                logEmbed.setColor(0xe35550);
                logEmbed.setDescription(`<:ShieldDenied:${emoji.ShieldDenied}> You don't have permission to manage ranks!`);
                return message.reply({ embeds: [logEmbed], flags: MessageFlags.Ephemeral });
            }

            // Validate arguments
            if (args.length < 2) {
                logEmbed.setColor(0x5086e3);
                logEmbed.setDescription(`<:Info:${emoji.Info}> Usage: \`${this.usage}\``);
                return message.reply({ embeds: [logEmbed], flags: MessageFlags.Ephemeral });
            }

            const action = args[0].toLowerCase();
            const role = message.mentions.roles.first();

            if (!role) {
                logEmbed.setColor(0xe35550);
                logEmbed.setDescription(`<:NovaFailure:${emoji.NovaFailure}> Please mention a valid role!`);
                return message.reply({ embeds: [logEmbed], flags: MessageFlags.Ephemeral });
            }

            const currentRanks = await getGuildConfig(guildId, 'ranks') || {};

            // ?mrank add <@role> - Add a rank
            if (action === 'add') {
                if (currentRanks[role.id]) {
                    logEmbed.setColor(0xe35550);
                    logEmbed.setDescription(`<:NovaFailure:${emoji.NovaFailure}> The role "${role.name}" is already added as a rank.`);
                    return message.reply({ embeds: [logEmbed], flags: MessageFlags.Ephemeral });
                }

                const currentRankCount = Object.keys(currentRanks).length;
                if (currentRankCount >= 25) {
                    logEmbed.setColor(0xe35550);
                    logEmbed.setDescription(`<:NovaFailure:${emoji.NovaFailure}> You can only have up to 25 ranks. Please remove one first.`);
                    return message.reply({ embeds: [logEmbed], flags: MessageFlags.Ephemeral });
                }

                const rankName = role.name.toLowerCase();
                currentRanks[role.id] = rankName;
                await setGuildConfig(guildId, 'ranks', currentRanks);

                logEmbed.setColor(0x50e355);
                logEmbed.setDescription(`<:NovaSuccess:${emoji.NovaSuccess}> The role "${role.name}" has been added as rank "${rankName}".`);
                return message.reply({ embeds: [logEmbed] });
            }

            // ?mrank del <@role> - Remove a rank
            if (action === 'del') {
                if (!currentRanks[role.id]) {
                    logEmbed.setColor(0xe35550);
                    logEmbed.setDescription(`<:NovaFailure:${emoji.NovaFailure}> The role "${role.name}" was not found in ranks.`);
                    return message.reply({ embeds: [logEmbed], flags: MessageFlags.Ephemeral });
                }

                delete currentRanks[role.id];
                await setGuildConfig(guildId, 'ranks', currentRanks);

                logEmbed.setColor(0x50e355);
                logEmbed.setDescription(`<:NovaSuccess:${emoji.NovaSuccess}> The role "${role.name}" has been removed from ranks.`);
                return message.reply({ embeds: [logEmbed] });
            }

            // Invalid action
            logEmbed.setColor(0x5086e3);
            logEmbed.setDescription(`<:Info:${emoji.Info}> Usage: \`${this.usage}\``);
            return message.reply({ embeds: [logEmbed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error during command execution:', error.message);
            console.error('Error details:', error.stack);
            logEmbed.setColor(0xe35550);
            logEmbed.setTitle(`<:Failure:${emoji.Failure}> An error occurred while running this command!`);
            logEmbed.setDescription(`Log Stack: ${error}`);
            return message.reply({ embeds: [logEmbed], flags: MessageFlags.Ephemeral });
        }
    },
};
