const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { setData, getData, updateData, removeData } = require('../../src/firebaseAdmin'); // Admin SDK functions

module.exports = {
  id: '6465805', // Unique 6-digit command ID
  data: new SlashCommandBuilder()
    .setName('note')
    .setDescription('Add or remove a note/tag for a user.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a note/tag to a user.')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to add the note/tag to.')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('note')
            .setDescription('The note/tag to add (Max 20 characters).')
            .setRequired(true)
            .setMaxLength(20) // Limit input length to 20 characters
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a note/tag from a user.')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to remove the note/tag from.')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('note')
            .setDescription('The note/tag to remove.')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.options.getUser('user').id;
    const note = interaction.options.getString('note');
    const tagsPath = `tags/${guildId}/${userId}/Tags`; // Path to store tags in Firebase

    try {
      // Add note/tag
      if (interaction.options.getSubcommand() === 'add') {
        // Fetch current tags for the user
        const currentTags = await getData(tagsPath) || [];

        // Check if the user already has the maximum of 10 tags
        if (currentTags.length >= 10) {
          return interaction.reply({
            content: `You can only have a maximum of 10 tags. Please remove a tag before adding a new one.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // Add the new tag if it's not already present
        if (!currentTags.includes(note)) {
          currentTags.push(note);
          await setData(tagsPath, currentTags); // Update tags in Firebase
          interaction.reply({
            content: `Successfully added the tag "${note}" to <@${userId}>.`,
            flags: MessageFlags.Ephemeral,
          });
        } else {
          interaction.reply({
            content: `This tag "${note}" is already assigned to <@${userId}>.`,
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      // Remove note/tag
      if (interaction.options.getSubcommand() === 'remove') {
        // Fetch current tags for the user
        const currentTags = await getData(tagsPath) || [];

        // Check if the tag exists
        if (!currentTags.includes(note)) {
          return interaction.reply({
            content: `This tag "${note}" doesn't exist for <@${userId}>.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // Remove the tag from the list
        const updatedTags = currentTags.filter(tag => tag !== note);
        await setData(tagsPath, updatedTags); // Update tags in Firebase
        interaction.reply({
          content: `Successfully removed the tag "${note}" from <@${userId}>.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      console.error('Error handling /note command:', error);
      interaction.reply({
        content: `❌ An error occurred while processing your request. Please try again later.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
