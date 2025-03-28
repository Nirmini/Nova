const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { getData } = require('../../src/firebaseAdmin'); // Admin SDK functions

module.exports = {
  id: '9101380', // Unique 6-digit command ID
  data: new SlashCommandBuilder()
    .setName('binds')
    .setDescription('View your server\'s active binds'),

  async execute(interaction) {
    try {
      const guildId = interaction.guild.id;

      // Retrieve RBXBinds from RTDB
      const binds = (await getData(`/guildsettings/${guildId}/RBXBinds`)) || [];
      const verifiedRoleId = await getData(`/guildsettings/${guildId}/config/verifiedroleid`);

      if (binds.length === 0 && !verifiedRoleId) {
        return interaction.reply({ content: 'No active binds or verified role found for this server.', flags: MessageFlags.Ephemeral });
      }

      // Format the binds for display in an embed
      const embed = new EmbedBuilder()
        .setTitle(`Nova Role Binds for ${interaction.guild.name}`)
        .setColor(0x00AE86) // Set a color for the embed
        .setFooter({ text: 'Nova Database' });

      // Add verified role to the embed if it exists
      if (verifiedRoleId) {
        embed.addFields({
          name: '\u200B',
          value: `**ID:** \`Verif\` **Role:** <@&${verifiedRoleId}> **Type:** default`,
          inline: false,
        });
      }

      // Add binds to the embed
      binds.forEach((bind, index) => {
        // Parse the bind string (format: type:id,min,max,roleid)
        const [typeAndId, minRank, maxRank, roleId] = bind.split(',');
        const [type, id] = typeAndId.split(':');

        // Determine the type of bind
        let bindType;
        if (type === 'group') bindType = 'group';
        else if (type === 'badge') bindType = 'badge';
        else if (type === 'pass') bindType = 'gamepass';
        else bindType = 'default';

        let IdType;
        if (type === 'group') IdType = 'GroupId';
        else if (type === 'badge') IdType = 'BadgeId';
        else if (type === 'pass') IdType = 'GamepassId';
        else IdType = 'OtherId';

        // Add the bind to the embed
        embed.addFields({
          name: '\u200B',
          value: `**ID:** ${index + 1} **Role:** <@&${roleId}> **Type:** ${bindType} **${IdType}:** ${id} **MinRank:** ${minRank} **MaxRank:** ${maxRank}`,
          inline: false,
        });
      });

      embed.setTimestamp();
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'An error occurred while retrieving the binds.', flags: MessageFlags.Ephemeral });
    }
  },
};
