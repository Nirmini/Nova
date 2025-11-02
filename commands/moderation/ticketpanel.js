const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionsBitField,
    MessageFlags,
    StringSelectMenuBuilder,
} = require('discord.js');
const { getGuildConfig, getGuildData } = require('../../src/Database');

/**
 * ticketpanel
 * Modes:
 *  - A: dropdown select of categories
 *  - B: buttons (max 4) for categories
 *  - C: simple embed promoting /ticket
 */
module.exports = {
  id: '6000020',
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Create a ticket panel (A/B/C)')
    .addStringOption(option =>
      option
        .setName('mode')
        .setDescription('Panel mode: A (dropdown), B (buttons), C (link to /ticket)')
        .setRequired(true)
        .addChoices(
          { name: 'A - dropdown', value: 'A' },
          { name: 'B - buttons', value: 'B' },
          { name: 'C - promote /ticket', value: 'C' }
        ))
    .addStringOption(option =>
      option
        .setName('panel')
        .setDescription('Optional panel name or type to use from guild multi-panels or ticket configs')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),
  async execute(interaction) {
    // Liability Insurance if the perms set above fail.
    if (!interaction.memberPermissions?.has || !interaction.memberPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.reply({ content: 'You need Manage Channels permission to run this.', ephemeral: true });
    }

    const mode = interaction.options.getString('mode');

    // require both guild settings and guild data ticket configuration
    const guildConfig = await getGuildConfig(interaction.guildId) || {};
    const guildData = await getGuildData(interaction.guildId) || {};
    const ticketConfigs = Array.isArray(guildData.ticketdata?.ticket_configs) ? guildData.ticketdata.ticket_configs : [];
  const multiPanels = Array.isArray(guildData.ticketdata?.['ticket_multipanels']) ? guildData.ticketdata['ticket_multipanels'] : [];

    if (!guildConfig.ticketconfig || !guildConfig.ticketconfig.enabled || ticketConfigs.length === 0) {
      return interaction.reply({ content: 'Tickets are not configured for this server. Configure ticket settings first.', ephemeral: true });
    }

    // If a specific panel name/type provided, try to use it
    const panelName = interaction.options.getString('panel') || null;
    let categories = ticketConfigs.map(tc => String(tc.name));
    let panelMeta = null;
    if (panelName) {
      // find a multipanel by name
      panelMeta = multiPanels.find(p => String(p.name).toLowerCase() === String(panelName).toLowerCase());
      if (panelMeta && Array.isArray(panelMeta.panels)) {
        // map connected_config names to categories
        categories = panelMeta.panels.map(p => String(p.connected_config));
      } else {
        // attempt to treat panelName as a config name
        const directCfg = ticketConfigs.find(tc => String(tc.name).toLowerCase() === String(panelName).toLowerCase());
        if (directCfg) categories = [String(directCfg.name)];
      }
    }

    // MODE A: dropdown/select
    if (mode === 'A') {
      const title = panelMeta?.name ? String(panelMeta.name) : 'Open a Ticket';
      const description = panelMeta?.description ? String(panelMeta.description) : 'Choose a category from the dropdown below to open a ticket.';
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0x00AE86);

      const select = new StringSelectMenuBuilder()
        .setCustomId('ticket:select')
        .setPlaceholder('Select ticket category')
        .addOptions(categories.map(c => ({ label: c, value: c })));

      const row = new ActionRowBuilder().addComponents(select);
      await interaction.reply({ embeds: [embed], components: [row] });
      return;
    }

    // MODE B: buttons (max 4)
    if (mode === 'B') {
      const title = panelMeta?.name ? String(panelMeta.name) : 'Open a Ticket';
      const description = panelMeta?.description ? String(panelMeta.description) : 'Click a button for the category to open a ticket.';
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0x00AE86);

      // If panelMeta provides button metadata, use that
      const panelButtons = (panelMeta && Array.isArray(panelMeta.panels)) ? panelMeta.panels.map(p => ({ label: p.button_text || p.connected_config, emoji: p.button_emoji, connected: p.connected_config })) : categories.map(c => ({ label: c, connected: c }));

      const buttons = panelButtons.slice(0, 4).map(b => {
        const btn = new ButtonBuilder()
          .setCustomId(`ticket:create:nextgen:${encodeURIComponent(b.connected)}`)
          .setLabel(b.label)
          .setStyle(ButtonStyle.Primary);
        if (b.emoji) btn.setEmoji(b.emoji);
        return btn;
      });

      const row = new ActionRowBuilder().addComponents(buttons);
      await interaction.reply({ embeds: [embed], components: [row] });
      return;
    }

    // MODE C: promote /ticket usage
    if (mode === 'C') {
      const embed = new EmbedBuilder()
        .setTitle('Open a Ticket via Command')
        .setDescription('Use /ticket new to create a ticket, or /ticket help for more options.')
        .setColor(0x00AE86);

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // fallback aka 'oh shit'
    await interaction.reply({ content: 'Invalid panel mode.', ephemeral: true });
  }
};
