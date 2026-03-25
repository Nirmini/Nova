const { PermissionsBitField, EmbedBuilder, MessageFlags } = require('discord.js');
const { setUserData, getUserData, getGuildConfig } = require('../src/Database');
const emoji = require('../emoji.json');

module.exports = {
    id: '0000015',
    name: 'rank',
    description: 'Toggle a rank on/off for your profile',
    usage: '?rank <rank_name>',
    /**
     * Executes the rank command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     * @param {string[]} args - The arguments passed with the command.
     */
    async execute(message, args) {
        const logEmbed = new EmbedBuilder();
        const guildId = message.guild.id;
        const userId = message.author.id;

        try {
            // Validate arguments
            if (args.length === 0) {
                logEmbed.setColor(0x5086e3);
                logEmbed.setDescription(`<:Info:${emoji.Info}> Usage: \`${this.usage}\``);
                return message.reply({ embeds: [logEmbed], flags: MessageFlags.Ephemeral });
            }

            // ?rank <rank_name> - Toggle rank
            const rankName = args.join(' ').toLowerCase();
            const currentRanks = await getGuildConfig(guildId, 'ranks') || {};
            const userRoles = await getUserData(userId, `guild_roles/${guildId}`) || [];

            const rank = Object.entries(currentRanks).find(
                ([roleId, rName]) => rName.toLowerCase() === rankName.toLowerCase()
            );

            if (!rank) {
                logEmbed.setColor(0xe35550);
                logEmbed.setDescription(`<:NovaFailure:${emoji.NovaFailure}> The rank "${rankName}" is not available in this guild.`);
                return message.reply({ embeds: [logEmbed], flags: MessageFlags.Ephemeral });
            }

            const [roleId, displayRankName] = rank;
            const discordRole = message.guild.roles.cache.get(roleId);

            if (!discordRole) {
                logEmbed.setColor(0xe35550);
                logEmbed.setDescription(`<:NovaFailure:${emoji.NovaFailure}> The role for rank "${displayRankName}" no longer exists.`);
                return message.reply({ embeds: [logEmbed], flags: MessageFlags.Ephemeral });
            }

            if (userRoles.includes(roleId)) {
                const updatedUserRoles = userRoles.filter(id => id !== roleId);
                await setUserData(userId, `guild_roles/${guildId}`, updatedUserRoles);
                await message.member.roles.remove(discordRole);

                logEmbed.setColor(0x50e355);
                logEmbed.setDescription(`<:NovaSuccess:${emoji.NovaSuccess}> You have been removed from the "${displayRankName}" rank.`);
                return message.reply({ embeds: [logEmbed] });
            } else {
                userRoles.push(roleId);
                await setUserData(userId, `guild_roles/${guildId}`, userRoles);
                await message.member.roles.add(discordRole);

                logEmbed.setColor(0x50e355);
                logEmbed.setDescription(`<:NovaSuccess:${emoji.NovaSuccess}> You have been assigned the "${displayRankName}" rank.`);
                return message.reply({ embeds: [logEmbed] });
            }
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
