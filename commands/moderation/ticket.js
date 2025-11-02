const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType,
  MessageFlags
} = require('discord.js');
const service = require('../../tickets/service');
const { getGuildConfig, getGuildData } = require('../../src/Database');

/**
 * Subcommands:
 *  - new [category?]
 *  - assign <id> <staff>
 *  - close <id>   (requires confirmation)
 *  - lock <id>
 *  - reopen <id>
 */
function isStaff(member) {
  if (!member) return false;
  if (member.permissions?.has && member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return true;
  return member.roles?.cache?.some(r => {
    const n = (r.name || '').toLowerCase();
    return n.includes('staff') || n.includes('mod') || n.includes('admin'); // THIS IS TEMP I SWEAR
  });
}

module.exports = {
  id: '6000019',
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket management')
    .addSubcommand(subcommand => 
        subcommand
            .setName('new')
            .setDescription('Create a new ticket')
            .addStringOption(option => 
                option
                .setName('category')
                .setDescription('Category name')
                .setRequired(false)
            )
    )
    .addSubcommand(subcommand => 
        subcommand
            .setName('assign')
            .setDescription('Assign a ticket')
            .addIntegerOption(option => 
                option
                .setName('id')
                .setDescription('Ticket ID')
                .setRequired(true)
            )
            .addUserOption(option =>
                option
                .setName('staff')
                .setDescription('User to assign')
                .setRequired(true)
            )
    )
    .addSubcommand(subcommand => 
        subcommand
            .setName('close')
            .setDescription('Close a ticket')
            .addIntegerOption(option => 
                option
                .setName('id')
                .setDescription('Ticket ID')
                .setRequired(true))
    )
    .addSubcommand(subcommand => 
        subcommand
            .setName('lock')
            .setDescription('Lock a ticket')
            .addIntegerOption(option => 
                option
                .setName('id')
                .setDescription('Ticket ID')
                .setRequired(true)
            )
    )
    .addSubcommand(subcommand => 
        subcommand
            .setName('reopen')
            .setDescription('Reopen a ticket')
            .addIntegerOption(option => 
                option
                .setName('id')
                .setDescription('Ticket ID')
                .setRequired(true)
            )
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const member = interaction.member;

    // require ticket config present in both guild settings and guild data
    const guildConfig = await getGuildConfig(guildId) || {};
    const guildData = await getGuildData(guildId) || {};
    const ticketConfigs = Array.isArray(guildData.ticketdata?.ticket_configs) ? guildData.ticketdata.ticket_configs : [];

    if (!guildConfig.ticketconfig || !guildConfig.ticketconfig.enabled || ticketConfigs.length === 0) {
      return interaction.reply({ content: 'Tickets are not configured for this server. Configure ticket settings first.', flags: MessageFlags.Ephemeral });
    }

    // CREATE NEW TICKET
    if (sub === 'new') {
      await interaction.deferReply();
      let category = interaction.options.getString('category') || null;

      // treat ticket_configs as categories; if not provided default to first config
      const availableNames = ticketConfigs.map(tc => String(tc.name));
      if (!category) category = availableNames[0];
      if (!availableNames.includes(category)) {
        return interaction.editReply({ content: `Unknown category "${category}". Available categories: ${availableNames.join(', ')}` });
      }

      // pick type from ticket config if present
      const cfg = ticketConfigs.find(tc => String(tc.name) === String(category));
      const type = cfg && cfg.type ? cfg.type : 'nextgen';

      const res = await service.newticket({
        guildId,
        openerId: interaction.user.id,
        ticket_title: `${interaction.user.username}'s Ticket`,
        ticket_description: category ? `Category: ${category}` : null,
        type,
        ticket_json: { category },
      });

      if (res.status !== 'success') {
        return interaction.editReply({ content: `Failed to create ticket: ${res.message || 'unknown'}` });
      }

      const ticket = res.ticket;

      try {
        // create thread or channel per guild config & category cfg (service may signal createThread)
        const useThreads = !!guildConfig.ticketconfig?.use_threads;
        if (res.createThread || useThreads) {
          if (interaction.channel && interaction.channel.isText()) {
            const thr = await interaction.channel.threads.create({
              name: `ticket-${ticket.ticketId}`,
              autoArchiveDuration: 60,
              type: ChannelType.PrivateThread,
              reason: `Ticket ${ticket.ticketId} created`
            });

            // build action buttons
            const actionRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`ticket:close:${ticket.ticketId}`).setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji({ name: "⛔" }),
              new ButtonBuilder().setCustomId(`ticket:lock:${ticket.ticketId}`).setLabel('Lock').setStyle(ButtonStyle.Secondary).setEmoji({ name: "🔒" }),
              new ButtonBuilder().setCustomId(`ticket:assign:${ticket.ticketId}`).setLabel('Assign').setStyle(ButtonStyle.Primary).setEmoji({ name: "📥" })
            );

            // build embed (try nextgen formatted embed if available)
            let embed;
            try {
              if (ticket.ticketType === 'nextgen' && ticket.formresponse) {
                embed = await service.buildTicketEmbedForNextgen(guildId, ticket.ticketDesc?.replace(/^Category: /, '') || 'General', ticket.formresponse, ticket);
              } else {
                const cfg = await service.findTicketConfig(guildId, ticket.ticketDesc?.replace(/^Category: /, ''));
                const welcome = cfg?.welcome_message || null;
                embed = new EmbedBuilder()
                  .setTitle((welcome && welcome.title) ? welcome.title : (ticket.ticketName || `Ticket #${ticket.ticketId}`))
                  .setDescription((welcome && welcome.description) ? welcome.description : (ticket.ticketDesc || 'A ticket has been opened.'))
                  .setTimestamp();
              }
            } catch (e) {
              embed = new EmbedBuilder().setTitle(`Ticket #${ticket.ticketId}`).setDescription(ticket.ticketDesc || '').setTimestamp();
            }

            const msg = await thr.send({ embeds: [embed], components: [actionRow] });
            await service.updticket(guildId, ticket.ticketId, { channelId: thr.id, messageId: msg.id });

            // notify log channel if configured
            try {
              const logChId = guildConfig.ticketconfig?.logchannel || null;
              if (logChId) {
                const logCh = await interaction.guild.channels.fetch(logChId).catch(() => null);
                if (logCh) {
                  const notifyEmbed = new EmbedBuilder()
                    .setTitle(`New ticket opened — #${ticket.ticketId}`)
                    .setDescription(`Opened by <@${interaction.user.id}> in <#${thr.id}>\nCategory: ${ticket.ticketDesc || 'General'}`)
                    .setTimestamp();
                  await logCh.send({ embeds: [notifyEmbed] }).catch(() => {});
                }
              }
            } catch (e) {}

            return interaction.editReply({ content: `Ticket #${ticket.ticketId} created as a private thread: <#${thr.id}> Opened.` });
          }
        }

        const createdChannelId = (res.created && res.created.channelId) ? res.created.channelId : ticket.channelId || null;
        if (createdChannelId) {
          return interaction.editReply({ content: `Ticket #${ticket.ticketId} created. Channel: <#${createdChannelId}> Opened.` });
        }

        return interaction.editReply({ content: `Ticket created (#${ticket.ticketId}) but no channel was created due to configuration.` });
      } catch (err) {
        console.error('Error creating channel/thread for ticket:', err);
        return interaction.editReply({ content: `Ticket created (#${ticket.ticketId}) but failed to create channel/thread.` });
      }
    }

    // Following subcommands require staff
    if (!isStaff(member)) {
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle('Permission denied').setColor(0xff0000)], flags: MessageFlags.Ephemeral });
    }

    const id = interaction.options.getInteger('id');

    // ASSIGN
    if (sub === 'assign') {
      const staffUser = interaction.options.getUser('staff');
      const t = await service.getticket(guildId, id);
      if (!t) return interaction.reply({ content: `Ticket ${id} not found.`, flags: MessageFlags.Ephemeral });

      const users = t.usersInvolved || [];
      if (!users.some(u => u.uid === String(staffUser.id))) users.push({ uid: String(staffUser.id), perms: 'staff' });
      await service.updticket(guildId, id, { usersInvolved: users });

      return interaction.reply({ content: `Assigned ticket #${id} to <@${staffUser.id}>.`, flags: MessageFlags.Ephemeral });
    }

    // LOCK
    if (sub === 'lock') {
      const t = await service.getticket(guildId, id);
      if (!t) return interaction.reply({ content: `Ticket ${id} not found.`, flags: MessageFlags.Ephemeral });

      await service.updticket(guildId, id, { locked: true });
      return interaction.reply({ content: `Ticket #${id} locked.`, flags: MessageFlags.Ephemeral });
    }

    // REOPEN
    if (sub === 'reopen') {
      const t = await service.getticket(guildId, id);
      if (!t) return interaction.reply({ content: `Ticket ${id} not found.`, flags: MessageFlags.Ephemeral });

      await service.updticket(guildId, id, { status: 'open', locked: false });
      return interaction.reply({ content: `Ticket #${id} reopened.`, flags: MessageFlags.Ephemeral });
    }

    // CLOSE (confirmation required)
    if (sub === 'close') {
      const t = await service.getticket(guildId, id);
      if (!t) return interaction.reply({ content: `Ticket ${id} not found.`, flags: MessageFlags.Ephemeral });

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`ticket:confirmclose:${id}:yes`).setLabel('Confirm Close').setStyle(ButtonStyle.Danger).setEmoji({ name: "✔" }),
        new ButtonBuilder().setCustomId(`ticket:confirmclose:${id}:no`).setLabel('Cancel').setStyle(ButtonStyle.Secondary).setEmoji({ name: "❌" })
      );

      await interaction.reply({ content: `Are you sure you want to close ticket #${id}?`, components: [confirmRow], flags: MessageFlags.Ephemeral });
      const msg = await interaction.fetchReply();

      const filter = i => i.user.id === interaction.user.id && i.customId && i.customId.startsWith(`ticket:confirmclose:${id}:`);
      const collector = msg.createMessageComponentCollector({ filter, time: 20_000 });

      collector.on('collect', async i => {
        const parts = i.customId.split(':');
        const choice = parts[3];
        if (choice === 'yes') {
          await i.update({ content: `Closing ticket #${id}...`, components: [] });
          await service.closeticket(guildId, id);
          try { await i.followUp({ content: `Ticket #${id} closed.`, flags: MessageFlags.Ephemeral }); } catch {}
        } else {
          await i.update({ content: `Ticket close cancelled.`, components: [] });
        }
        collector.stop();
      });

      collector.on('end', async collected => {
        if (collected.size === 0) {
          try { await interaction.editReply({ content: 'Close confirmation timed out.', components: [] }); } catch {}
        }
      });

      return;
    }
  },

  // Properly declare modal handling
  buttonHandler: async function(interaction) {
    return await require('../../tickets/buttonhandler')(interaction);
  },

  selectMenuHandler: async function(interaction) {
    return await require('../../tickets/buttonhandler')(interaction);
  },

  modalHandler: async function(interaction) {
    return await require('../../tickets/buttonhandler')(interaction);
  }
};
