const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    MessageFlags,
 } = require('discord.js');
const { getGuildConfig } = require('../../src/Database');
const noblox = require('noblox.js');
const emoji = require('../../emoji.json');

module.exports = {
    id: '9000003', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('group')
        .setDescription('Roblox Group utilities')
        .addSubcommand(subcommand =>
            subcommand
                .setName('rank')
                .setDescription('Adjust a member\'s Roblox rank in a group')
                .addStringOption(option =>
                    option 
                        .setName('username')
                        .setDescription('Who\'s rank to adjust')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('rank')
                        .setDescription('Choose an option')
                        .setRequired(true)
                        .addChoices( // Add ranks within the group as options
                            { name: 'Option A', value: 'value_a' },
                            { name: 'Option B', value: 'value_b' },
                            { name: 'Option C', value: 'value_c' }
                        ))
        )
        .addSubcommand( subcommand =>
            subcommand
                .setName('getrank')
                .setDescription('Get a member\'s Roblox rank in the group')
                .addStringOption(option =>
                    option
                        .setName('username')
                        .setDescription('Who\'s rank to get')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const userData = await getUserData(userId);

            if (!userData || !userData.Roblox.userId) {
                return interaction.reply({
                    content: 'You are not verified. Please use `/verify` to link your Roblox account.',
                    flags: MessageFlags.Ephemeral,
                });
            }
            const robloxId = userData.Roblox.userId;
            const guildId = interaction.guild.id;

            // Fetch binds from the guild
            const binds = (await getGuildConfig(guildId, 'Binds')) || [];
            const rolesToAdd = [];
            const managedRoles = new Set();

            for (const bind of binds) {
                const [typeAndId, minRank, maxRank, roleId] = bind.split(',');
                const [type, id] = typeAndId.split(':');
                if (roleId) managedRoles.add(roleId);

                if (type === 'group') {
                    const rank = await noblox.getRankInGroup(parseInt(id), robloxId);
                    if (rank >= parseInt(minRank) && rank <= parseInt(maxRank)) {
                        rolesToAdd.push(roleId);
                    }
                }
                // Add support for other types (badge, gamepass) if needed
            }

            // Perform role additions and removals safely
            const rolesAdded = [];
            const rolesRemoved = [];

            // Bot's highest role position (used to avoid removing roles above the bot)
            const botMember = interaction.guild.members.me;
            const botHighestPos = botMember?.roles?.highest?.position ?? 0;

            // Add roles the user qualifies for
            for (const roleId of rolesToAdd) {
                try {
                    if (!interaction.member.roles.cache.has(roleId)) {
                        const role = interaction.guild.roles.cache.get(roleId);
                        if (role) {
                            await interaction.member.roles.add(roleId);
                            rolesAdded.push(roleId);
                        }
                    }
                } catch (err) {
                    console.warn(`Failed to add role <:NovaCross2:${emoji.NovaCross2}>`, roleId, err.message || err);
                }
            }

            // Remove managed roles the user no longer qualifies for, but don't remove
            // roles that are higher or equal to the bot's highest role.
            for (const roleId of managedRoles) {
                try {
                    if (interaction.member.roles.cache.has(roleId) && !rolesToAdd.includes(roleId)) {
                        const role = interaction.guild.roles.cache.get(roleId);
                        if (!role) continue;
                        if (role.position >= botHighestPos) {
                            // Skip removal - role is higher or equal to the bot
                            continue;
                        }
                        await interaction.member.roles.remove(roleId);
                        rolesRemoved.push(roleId);
                    }
                } catch (err) {
                    console.warn(`Failed to remove role <:NovaCross2:${emoji.NovaCross2}>`, roleId, err.message || err);
                }
            }

            const embed = new EmbedBuilder()
                .setTitle(`Roles Updated <:NovaCheck2:${emoji.NovaCheck2}>`)
                .setColor(0x00FF00)
                .addFields(
                    { name: 'Roles Added', value: (rolesAdded.length ? rolesAdded.map(r => `<@&${r}>`).join(', ') : 'None'), inline: true },
                    { name: 'Roles Removed', value: (rolesRemoved.length ? rolesRemoved.map(r => `<@&${r}>`).join(', ') : 'None'), inline: true }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: 'An error occurred while updating your roles. Please try again later.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};