const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { getData } = require('../../src/firebaseAdmin'); // Admin SDK function

module.exports = {
  id: '9439092', // Unique 6-digit command ID
  data: new SlashCommandBuilder()
    .setName('ranks')
    .setDescription('View the list of ranks (roles) in the guild.'),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const ranksPath = `ranks/${guildId}`;

    try {
      // Fetch the ranks from Firebase
      const currentRanks = await getData(ranksPath);

      // If no ranks are found, send an ephemeral message
      if (!currentRanks || Object.keys(currentRanks).length === 0) {
        return interaction.reply({
          content: 'There are no ranks set for this guild.',
          flags: MessageFlags.Ephemeral, // Send an ephemeral message
        });
      }

      // Create an embed to show the list of ranks
      const rankEmbed = new EmbedBuilder()
        .setTitle('Guild Ranks')
        .setColor('BLUE')
        .setDescription('Here are the current ranks in this guild:')
        .setTimestamp();

      // Add each rank to the embed
      Object.keys(currentRanks).forEach((roleId, index) => {
        const rankName = currentRanks[roleId];
        rankEmbed.addFields({
          name: `Rank ${index + 1}: ${rankName}`,
          value: `Role ID: ${roleId}`,
          inline: false,
        });
      });

      // Send the embed to the channel where the command was issued
      return interaction.reply({
        embeds: [rankEmbed],
      });
    } catch (error) {
      console.error('Error handling /ranks command:', error);
      interaction.reply({
        content: '❌ An error occurred while fetching the ranks. Please try again later.',
        flags: MessageFlags.Ephemeral, // Send an ephemeral message on error
      });
    }
  },
};
