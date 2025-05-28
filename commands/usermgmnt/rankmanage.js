const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { setData, getData, updateData, removeData } = require('../../src/firebaseAdmin'); // Admin SDK functions

module.exports = {
  id: '9141035', // Unique 6-digit command ID
  data: new SlashCommandBuilder()
    .setName('rankmanage')
    .setDescription('Add or remove ranks (roles) to be used with the /rank command.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a rank (role) to the guild.')
        .addStringOption(option =>
          option
            .setName('rolename')
            .setDescription('The name of the rank (role) to add.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a rank (role) from the guild.')
        .addStringOption(option =>
          option
            .setName('rolename')
            .setDescription('The name of the rank (role) to remove.')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const roleName = interaction.options.getString('rolename');
    const ranksPath = `ranks/${guildId}`;
    const role = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === roleName.toLowerCase());

    if (!role) {
      return interaction.reply({
        content: `No role found with the name "${roleName}". Please make sure you entered the correct role name.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      if (interaction.options.getSubcommand() === 'add') {
        // Get current ranks
        const currentRanks = await getData(ranksPath) || {};
        
        // Check if the rank already exists
        if (currentRanks[role.id]) {
          return interaction.reply({
            content: `The role "${roleName}" is already added.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // Check if there are > 25 ranks in the guild
        const currentRankCount = Object.keys(currentRanks).length;
        if (currentRankCount > 25) { //increased ranks cap so users can use the feature
          return interaction.reply({
            content: `You can only have up to 25 ranks in the guild. Please remove one before adding a new rank.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // Add the role to the guild's rank list
        currentRanks[role.id] = roleName;
        await setData(ranksPath, currentRanks);

        interaction.reply({
          content: `The role "${roleName}" has been added to the guild's ranks.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (interaction.options.getSubcommand() === 'remove') {
        const currentRanks = await getData(ranksPath) || {};
        if (!currentRanks[role.id]) {
          return interaction.reply({
            content: `The role "${roleName}" was not found in the guild's ranks.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // Remove the role from the guild's rank list
        delete currentRanks[role.id];
        await setData(ranksPath, currentRanks);

        interaction.reply({
          content: `The role "${roleName}" has been removed from the guild's ranks.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      console.error('Error handling /rankmanage command:', error);
      interaction.reply({
        content: `❌ An error occurred while processing your request. Please try again later.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
