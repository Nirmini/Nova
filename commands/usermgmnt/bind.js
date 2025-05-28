const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { setData, getData } = require('../../src/firebaseAdmin'); // Admin SDK functions
const noblox = require('noblox.js');

module.exports = {
  id: '9259806', // Unique 6-digit command ID
  data: new SlashCommandBuilder()
    .setName('bind')
    .setDescription('Connect ROBLOX ranks to roles')
    .addSubcommand(subcommand =>
      subcommand
        .setName('group')
        .setDescription('Group ID to bind to a role.')
        .addIntegerOption(option =>
          option
            .setName('minrank')
            .setDescription('Minimum rank')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('maxrank')
            .setDescription('Maximum rank')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('groupid') // use format group:<groupid>
            .setDescription('ID of the group.')
            .setRequired(true)
        )
        .addRoleOption(option =>
          option
            .setName('targetrole') // Automatically fetch role ID
            .setDescription('Role to bind')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('gamepass')
        .setDescription('Gamepass ID to bind to a role.')
        .addIntegerOption(option =>
          option
            .setName('minrank')
            .setDescription('Minimum rank')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('maxrank')
            .setDescription('Maximum rank')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('gamepassid') // use format pass:<gamepassid>
            .setDescription('ID of the gamepass')
            .setRequired(true)
        )
        .addRoleOption(option =>
          option
            .setName('targetrole') // Automatically fetch role ID
            .setDescription('Role to bind')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('badge')
        .setDescription('Badge ID to bind to a role.')
        .addIntegerOption(option =>
          option
            .setName('minrank')
            .setDescription('Minimum rank')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('maxrank')
            .setDescription('Maximum rank')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('badgeid') // use format badge:<BadgeID>
            .setDescription('ID of the badge')
            .setRequired(true)
        )
        .addRoleOption(option =>
          option
            .setName('targetrole') // Automatically fetch role ID
            .setDescription('Role to bind')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('verification')
        .setDescription('Role users should receive on verification')
        .addRoleOption(option =>
          option
            .setName('verifiedrole') // Automatically fetch role ID
            .setDescription('Your verified role')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      const guildId = interaction.guild.id;

      const currentBinds = (await getData(`/guildsettings/${guildId}/Binds`)) || [];

      const currentBindCount = Object.keys(currentBinds).length;
      if (currentBindCount > 50) {
        return interaction.reply({
          content: `You can only have 50 binds in a server. Please delete any unused binds before creating another.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (subcommand === 'group') {
        const groupId = interaction.options.getString('groupid');
        const minRank = interaction.options.getInteger('minrank');
        const maxRank = interaction.options.getInteger('maxrank');
        const targetRole = interaction.options.getRole('targetrole');
        const roleId = targetRole.id; // Automatically fetch role ID

        // Verify group ID using noblox.js
        const groupInfo = await noblox.getGroup(groupId);
        if (!groupInfo) {
          return interaction.reply({ content: 'Invalid group ID.', flags: MessageFlags.Ephemeral });
        }

        // Save to RTDB in the RBXBinds format
        const bindData = `group:${groupId},${minRank},${maxRank},${roleId}`;
        currentBinds.push(bindData);
        await setData(`/guildsettings/${guildId}/Binds`, currentBinds);

        // Send success embed
        const embed = new EmbedBuilder()
          .setTitle('Nova Database')
          .setFooter({ text: 'Nova Database' })
          .addFields({
            name: 'Successfully added a group bind',
            value: `Successfully added a group bind for <@&${roleId}> for Group ${groupId} at rank ${minRank} up to rank ${maxRank}.`,
          })
          .setColor(0x00AE86);

        return interaction.reply({ embeds: [embed] });
      }

      if (subcommand === 'gamepass') {
        const gamepassId = interaction.options.getString('gamepassid');
        const minRank = interaction.options.getInteger('minrank');
        const maxRank = interaction.options.getInteger('maxrank');
        const targetRole = interaction.options.getRole('targetrole');
        const roleId = targetRole.id; // Automatically fetch role ID

        // Verify gamepass ID using noblox.js
        const gamepassInfo = await noblox.getGamePass(gamepassId);
        if (!gamepassInfo) {
          return interaction.reply({ content: 'Invalid gamepass ID.', flags: MessageFlags.Ephemeral });
        }

        // Save to RTDB in the RBXBinds format
        const bindData = `pass:${gamepassId},${minRank},${maxRank},${roleId}`;
        currentBinds.push(bindData);
        await setData(`/guildsettings/${guildId}/Binds`, currentBinds);

        // Send success embed
        const embed = new EmbedBuilder()
          .setTitle('Nova Database')
          .setFooter({ text: 'Nova Database' })
          .addFields({
            name: 'Successfully added a gamepass bind',
            value: `Successfully added a gamepass bind for <@&${roleId}> for Gamepass ${gamepassId} Owners.`,
          })
          .setColor(0x00AE86);

        return interaction.reply({ embeds: [embed] });
      }

      if (subcommand === 'badge') {
        const badgeId = interaction.options.getString('badgeid');
        const minRank = interaction.options.getInteger('minrank');
        const maxRank = interaction.options.getInteger('maxrank');
        const targetRole = interaction.options.getRole('targetrole');
        const roleId = targetRole.id; // Automatically fetch role ID

        // Verify badge ID using noblox.js
        const badgeInfo = await noblox.getBadgeInfo(badgeId);
        if (!badgeInfo) {
          return interaction.reply({ content: 'Invalid badge ID.', flags: MessageFlags.Ephemeral });
        }

        // Save to RTDB in the RBXBinds format
        const bindData = `badge:${badgeId},${minRank},${maxRank},${roleId}`;
        currentBinds.push(bindData);
        await setData(`/guildsettings/${guildId}/Binds`, currentBinds);

        // Send success embed
        const embed = new EmbedBuilder()
          .setTitle('Nova Database')
          .setFooter({ text: 'Nova Database' })
          .addFields({
            name: 'Successfully added a badge bind',
            value: `Successfully added a badge bind for <@&${roleId}> for Badge ${badgeId}.`,
          })
          .setColor(0x00AE86);

        return interaction.reply({ embeds: [embed] });
      }

      if (subcommand === 'verification') {
        const verifiedRole = interaction.options.getRole('verifiedrole');
        const roleId = verifiedRole.id; // Automatically fetch role ID

        // Save to RTDB in the commandconfigs format
        await setData(`/guildsettings/${guildId}/configs/verifiedrole`, roleId);

        // Send success embed
        const embed = new EmbedBuilder()
          .setTitle('Nova Database')
          .setFooter({ text: 'Nova Database' })
          .addFields({
            name: 'Successfully added a verification role',
            value: `Successfully added a verification role for <@&${roleId}> for Verified server members.`,
          })
          .setColor(0x00AE86);

        return interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'An error occurred while processing your request.', flags: MessageFlags.Ephemeral });
    }
  },
};
