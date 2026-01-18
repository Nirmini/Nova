const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { setGuildConfig, getGuildConfig } = require('../../src/Database'); // Admin SDK functions

module.exports = {
  id: '9000006', // Unique 6-digit command ID
  data: new SlashCommandBuilder()
    .setName('rankmanage')
    .setDescription('Add or remove ranks (roles) to be used with the /rank command.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a rank (role) to the guild.')
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('The role to add as a rank.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a rank (role) from the guild.')
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('The role to remove from ranks.')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const role = interaction.options.getRole('role');
    const rankName = role.name.toLowerCase();

    try {
      if (interaction.options.getSubcommand() === 'add') {
        // Get current ranks
        const currentRanks = await getGuildConfig(guildId, 'ranks') || {};
        
        // Check if the rank already exists
        if (currentRanks[role.id]) {
          return interaction.reply({
            content: `The role "${role.name}" is already added as a rank.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // Check if there are > 25 ranks in the guild
        const currentRankCount = Object.keys(currentRanks).length;
        if (currentRankCount >= 25) {
          return interaction.reply({
            content: `You can only have up to 25 ranks in the guild. Please remove one before adding a new rank.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // Add the role to the guild's rank list (stored as lowercase)
        currentRanks[role.id] = rankName;
        await setGuildConfig(guildId, 'ranks', currentRanks);

        interaction.reply({
          content: `The role "${role.name}" has been added to the guild's ranks as "${rankName}".`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (interaction.options.getSubcommand() === 'remove') {
        const currentRanks = await getGuildConfig(guildId, 'ranks') || {};
        if (!currentRanks[role.id]) {
          return interaction.reply({
            content: `The role "${role.name}" was not found in the guild's ranks.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // Remove the role from the guild's rank list
        delete currentRanks[role.id];
        await setGuildConfig(guildId, 'ranks', currentRanks);

        interaction.reply({
          content: `The role "${role.name}" has been removed from the guild's ranks.`,
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
