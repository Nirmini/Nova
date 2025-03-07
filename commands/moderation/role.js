const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    id: '6126481', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage roles in the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles) // Requires Manage Roles permission
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new role.')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name of the new role.')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('colour')
                        .setDescription('Color of the new role in HEX (e.g., #FF5733).')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing role.')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to edit.')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('New name for the role.'))
                .addStringOption(option =>
                    option
                        .setName('colour')
                        .setDescription('New color for the role in HEX (e.g., #FF5733).')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role.')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to remove.')
                        .setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const name = interaction.options.getString('name');
            const colour = interaction.options.getString('colour') || '#000000'; // Default black if no color provided

            try {
                const role = await interaction.guild.roles.create({
                    name,
                    color: colour,
                    reason: `Role created by ${interaction.user.tag}`,
                });

                await interaction.reply({ content: `✅ Role **${role.name}** created successfully.`, flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.error('Error creating role:', error);
                await interaction.reply({ content: '❌ Failed to create role. Ensure I have the necessary permissions.', flags: MessageFlags.Ephemeral });
            }
        } else if (subcommand === 'edit') {
            const role = interaction.options.getRole('role');
            const newName = interaction.options.getString('name');
            const newColour = interaction.options.getString('colour');

            if (!newName && !newColour) {
                return interaction.reply({ content: '❌ You must provide either a new name or a new color to edit.', flags: MessageFlags.Ephemeral });
            }

            try {
                await role.edit({
                    name: newName || role.name,
                    color: newColour || role.color,
                    reason: `Role edited by ${interaction.user.tag}`,
                });

                await interaction.reply({ content: `✅ Role **${role.name}** updated successfully.`, flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.error('Error editing role:', error);
                await interaction.reply({ content: '❌ Failed to edit role. Ensure I have the necessary permissions.', flags: MessageFlags.Ephemeral });
            }
        } else if (subcommand === 'remove') {
            const role = interaction.options.getRole('role');

            try {
                await role.delete(`Role removed by ${interaction.user.tag}`);
                await interaction.reply({ content: `✅ Role **${role.name}** removed successfully.`, flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.error('Error removing role:', error);
                await interaction.reply({ content: '❌ Failed to remove role. Ensure I have the necessary permissions.', flags: MessageFlags.Ephemeral });
            }
        }
    },
};
