const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { setUserData, getUserData, setGuildConfig, getGuildConfig } = require('../../src/Database'); // Admin SDK functions

module.exports = {
  id: '9000005', // Unique 6-digit command ID
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

    try {
      const currentRanks = await getGuildConfig(guildId, 'ranks') || {};
      const userRoles = await getUserData(userId, `guild_roles/${guildId}`) || [];

      // Find the role by lowercase name match
      const role = Object.entries(currentRanks).find(
        ([roleId, rankName]) => rankName.toLowerCase() === roleName.toLowerCase()
      );

      if (!role) {
        return interaction.reply({
          content: `The rank "${roleName}" is not available in this guild. Ask an admin to add it using /rankmanage.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const [roleId, rankName] = role;
      const discordRole = interaction.guild.roles.cache.get(roleId);

      if (!discordRole) {
        return interaction.reply({
          content: `The role associated with rank "${roleName}" no longer exists.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (userRoles.includes(roleId)) {
        const updatedUserRoles = userRoles.filter(id => id !== roleId);
        await setUserData(userId, `guild_roles/${guildId}`, updatedUserRoles);
        await interaction.member.roles.remove(discordRole);

        return interaction.reply({
          content: `You have been removed from the "${rankName}" rank.`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        userRoles.push(roleId);
        await setUserData(userId, `guild_roles/${guildId}`, userRoles);
        await interaction.member.roles.add(discordRole);

        return interaction.reply({
          content: `You have been assigned the "${rankName}" rank.`,
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
