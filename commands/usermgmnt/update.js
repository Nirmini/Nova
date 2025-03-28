const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { getData } = require('../../src/firebaseAdmin');
const noblox = require('noblox.js');

module.exports = {
    id: '9742387', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Update your roles based on your Roblox account.'),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const userData = await getData(`/userdata/${userId}`);

            if (!userData || !userData.RobloxID) {
                return interaction.reply({
                    content: 'You are not verified. Please use `/verify` to link your Roblox account.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            const robloxId = userData.RobloxID;
            const guildId = interaction.guild.id;

            // Fetch binds from the guild
            const binds = (await getData(`/guildsettings/${guildId}/Binds`)) || [];
            const rolesToAdd = [];

            for (const bind of binds) {
                const [typeAndId, minRank, maxRank, roleId] = bind.split(',');
                const [type, id] = typeAndId.split(':');

                if (type === 'group') {
                    const rank = await noblox.getRankInGroup(parseInt(id), robloxId);
                    if (rank >= parseInt(minRank) && rank <= parseInt(maxRank)) {
                        rolesToAdd.push(roleId);
                    }
                }
                // Add support for other types (badge, gamepass) if needed
            }

            // Add roles to the user
            for (const roleId of rolesToAdd) {
                const role = interaction.guild.roles.cache.get(roleId);
                if (role) {
                    await interaction.member.roles.add(role);
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('Roles Updated')
                .setColor(0x00FF00)
                .setDescription('Your roles have been updated based on your Roblox account.')
                .addFields(
                    { name: 'Roles Added', value: rolesToAdd.map(roleId => `<@&${roleId}>`).join(', ') || 'None', inline: false }
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