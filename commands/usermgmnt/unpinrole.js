const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { setData, getData, updateData, removeData } = require('../../src/firebaseAdmin'); // Admin SDK functions\

module.exports = {
    id: '9624766', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('unpinrole')
        .setDescription('Unpin a role from a user in the guild.')
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('The role to unpin from users')
                .setRequired(true)
        )
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to remove the pinned role from')
                .setRequired(true)
        ),
        
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const guildId = interaction.guild.id;
        
        // Fetch the existing pinned roles data for the guild
        const pinnedRoles = await getData(`pinnedroles/${guildId}`);

        if (!pinnedRoles || !pinnedRoles[role.id]) {
            return interaction.reply({ content: `No users are assigned the **${role.name}** role as part of the pinned roles.`, flags: MessageFlags.Ephemeral });
        }

        const roleData = pinnedRoles[role.id];

        // Check if the user has this pinned role
        if (!roleData.includes(user.id)) {
            return interaction.reply({ content: `This user does not have the **${role.name}** pinned role.`, flags: MessageFlags.Ephemeral });
        }

        // Remove the user from the list of pinned role users
        const updatedRoleData = roleData.filter(userId => userId !== user.id);

        // Update the pinned roles data in the database
        await updateData(`pinnedroles/${guildId}/${role.id}`, updatedRoleData);

        // Optionally remove the role from the user
        const member = await interaction.guild.members.fetch(user.id);
        await member.roles.remove(role);

        // Inform the user
        return interaction.reply({
            content: `Successfully unpinned the **${role.name}** role from **${user.username}**.`,
            flags: MessageFlags.Ephemeral
        });
    },
};
