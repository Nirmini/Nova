const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { setData, getData, updateData, removeData } = require('../../src/Database'); // Admin SDK functions

module.exports = {
    id: '9000003', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('pinrole')
        .setDescription('Pin a role for users in the guild.')
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('The role to pin to users')
                .setRequired(true)
        )
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to assign the pinned role')
                .setRequired(true)
        ),
        
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const guildId = interaction.guild.id;
        
        // Fetch the existing pinned roles data for the guild
        const pinnedRoles = await getData(`pinnedroles/${guildId}`);

        if (!pinnedRoles) {
            await setData(`pinnedroles/${guildId}`, {});
        }

        const roleData = pinnedRoles[role.id] || [];
        
        // Check if the role already has at least 30 pinned users
        if (roleData.length >= 30) { //Increased from 7 to 30 to allow for users to utilize the feature more than once.
            return interaction.reply({ content: `This role already has 30 pinned users. Please unpin a user first.`, flags: MessageFlags.Ephemeral });
        }

        // Check if the user already has this pinned role
        if (roleData.includes(user.id)) {
            return interaction.reply({ content: `This user is already assigned this pinned role.`, flags: MessageFlags.Ephemeral });
        }

        // Add the user to the list of pinned role users
        roleData.push(user.id);

        // Update the pinned roles data in the database
        await updateData(`pinnedroles/${guildId}/${role.id}`, roleData);

        // Assign the role to the user in the guild (optional, if you want to add the role)
        const member = await interaction.guild.members.fetch(user.id);
        await member.roles.add(role);

        // Inform the user
        return interaction.reply({
            content: `Successfully assigned the **${role.name}** role to **${user.username}** as part of the pinned roles.`,
            flags: MessageFlags.Ephemeral
        });
    },
};
