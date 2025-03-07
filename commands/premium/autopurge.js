const { SlashCommandBuilder, PermissionsBitField, ChannelType, MessageFlags } = require('discord.js');

module.exports = {
  id: '7321307', // Unique 6-digit command ID
  data: new SlashCommandBuilder()
    .setName('autopurge')
    .setDescription('Schedule a purge of messages in a channel.')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel to purge messages from.')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addStringOption(option =>
      option
        .setName('time')
        .setDescription('Time to execute the purge in UTC (format: HH:mm).')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Ensure the user has Administrator permissions
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: 'You need Administrator permissions to use this command!',
        flags: MessageFlags.Ephemeral,
      });
    }

    const channel = interaction.options.getChannel('channel');
    const timeInput = interaction.options.getString('time');

    // Validate time format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(timeInput)) {
      return interaction.reply({
        content: 'Invalid time format! Please provide a time in the format HH:mm (24-hour UTC).',
        flags: MessageFlags.Ephemeral,
      });
    }

    const [hours, minutes] = timeInput.split(':').map(Number);
    const now = new Date();
    const targetTime = new Date();
    targetTime.setUTCHours(hours, minutes, 0, 0);

    // Ensure the target time is at least 12 hours and no more than 3 days in the future
    const timeDiff = targetTime - now;
    const minTime = 12 * 60 * 60 * 1000; // 12 hours in ms
    const maxTime = 3 * 24 * 60 * 60 * 1000; // 3 days in ms

    if (timeDiff < minTime || timeDiff > maxTime) {
      return interaction.reply({
        content: `The specified time must be at least 12 hours and no more than 3 days from now. Please adjust the time.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // Confirm the purge scheduling
    interaction.reply({
      content: `Scheduled a purge in <#${channel.id}> at **${timeInput} UTC**.`,
      flags: MessageFlags.Ephemeral,
    });

    // Schedule the purge (temporary in-memory storage)
    setTimeout(async () => {
      try {
        const fetchedMessages = await channel.messages.fetch({ limit: 100 });
        await channel.bulkDelete(fetchedMessages, true);
        console.log(`Purged messages in channel ${channel.name} (${channel.id}) as scheduled.`);
      } catch (err) {
        console.error(`Failed to purge messages in channel ${channel.id}:`, err);
        channel.send('Failed to purge messages due to an error. Please check the bot permissions.');
      }
    }, timeDiff);
  },
};
