const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { setData, getData } = require('../../src/Database'); // Admin SDK functions

module.exports = {
  id: '9000004', // Unique 6-digit command ID
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Toggle a rank (role) on or off for your profile.')
    .addStringOption(option =>
      option
        .setName('rolename')
        .setDescription('The name of the rank (role) to toggle.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const embed = new EmbedBuilder();
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const roleName = interaction.options.getString('rolename');
    const ranksPath = `ranks/${guildId}`;
    const userRolesPath = `userRoles/${guildId}/${userId}`; // Path for user's roles in Firebase

    try {
      const currentRanks = await getData(ranksPath) || {};
      const userRoles = await getData(userRolesPath) || [];

      const role = interaction.guild.roles.cache.find(
        role => role.name.toLowerCase() === roleName.toLowerCase()
      );

      if (!role) {
        return interaction.reply({
          content: `No role found with the name "${roleName}". Please make sure you entered the correct role name.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (!currentRanks[role.id]) {
        return interaction.reply({
          content: `The role "${roleName}" is not available for users in this guild. Ask an admin to add it using /rankmanage.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (userRoles.includes(role.id)) {
        const updatedUserRoles = userRoles.filter(roleId => roleId !== role.id);
        await setData(userRolesPath, updatedUserRoles);
        await interaction.member.roles.remove(role);

        return interaction.reply({
          content: `You have been removed from the "${roleName}" role.`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        userRoles.push(role.id);
        await setData(userRolesPath, userRoles);
        await interaction.member.roles.add(role);

        return interaction.reply({
          content: `You have been assigned the "${roleName}" role.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      console.error('Error handling /rank command:', error);
      return interaction.reply({
        content: `❌ An error occurred while processing your request. Please try again later.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
