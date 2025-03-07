const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

module.exports = {
  id: '6076204', // Unique 6-digit command ID
  data: new SlashCommandBuilder()
    .setName('modstaff')
    .setDescription('Manage staff members.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('ls')
        .setDescription('List all users in the guild with Administrator permissions.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a user to the staff list.')
        .addUserOption(option =>
          option.setName('user').setDescription('The user to add.').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a user from the staff list.')
        .addUserOption(option =>
          option.setName('user').setDescription('The user to remove.').setRequired(true)
        )
    ),

  async execute(interaction) {
    // Check if the user has Administrator permissions to run the command
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: 'You need Administrator permissions to use this command!',
        flags: MessageFlags.Ephemeral,
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'ls') {
      // Ensure all members are fetched for accurate data
      await interaction.guild.members.fetch();

      // Filter members with Administrator permissions
      const adminMembers = interaction.guild.members.cache.filter(member =>
        member.permissions.has(PermissionsBitField.Flags.Administrator)
      );

      // Map members to mentions and join them into a readable list
      const adminList = adminMembers.map(member => `<@${member.user.id}>`).join('\n') || 'No users with Administrator permissions found.';
      return interaction.reply({
        content: `**Users with Administrator permissions:**\n${adminList}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // `add` and `remove` require a user to be specified
    const user = interaction.options.getUser('user');

    if (subcommand === 'add') {
      if (modUsers.has(user.id)) {
        return interaction.reply({
          content: `${user.username} is already in the staff list.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      modUsers.add(user.id);
      return interaction.reply({
        content: `${user.username} has been added to the staff list.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === 'remove') {
      if (!modUsers.has(user.id)) {
        return interaction.reply({
          content: `${user.username} is not in the staff list.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      modUsers.delete(user.id);
      return interaction.reply({
        content: `${user.username} has been removed from the staff list.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

// Temporary storage for staff (for demonstration purposes, replace with a database)
const modUsers = new Set();
