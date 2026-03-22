const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
const { load } = require('cheerio'); // npm install cheerio

module.exports = {
    id: '4000009',
    data: new SlashCommandBuilder()
        .setName('scp')
        .setDescription('Fetch an SCP entry from the SCP Wiki.')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('The SCP ID (e.g. 173, 049, 123-j, 2317-ex)')
                .setRequired(true)
        ),

    async execute(interaction) {
        let rawId = interaction.options.getString('id').trim().toLowerCase();

        if (rawId === '1' || rawId === 'scp-1') {
            return interaction.reply({
                content: '❌ SCP-001 cannot be retrieved directly. Please specify a proposal.',
                flags: MessageFlags.Ephemeral
            });
        }

        if (rawId.endsWith('/j') || rawId.endsWith('-j')) {
            rawId = rawId.replace(/\/j|-j/i, '') + '-j';
        }
        if (rawId.endsWith('/ex') || rawId.endsWith('-ex')) {
            rawId = rawId.replace(/\/ex|-ex/i, '') + '-ex';
        }
        if (!rawId.startsWith('scp-')) rawId = `scp-${rawId}`;

        const url = `http://scp-wiki.wikidot.com/${rawId}`;

        try {
            const response = await axios.get(url);
            const $ = load(response.data);

            // Title cleanup
            let title = $('title').text().replace(' - SCP Foundation', '').trim();
            if (!title) title = rawId.toUpperCase();

            // Content extraction
            const contentDiv = $('#page-content');

            // Try to extract Object Class (found in first bold tag after "Object Class:")
            let objectClass = null;
            contentDiv.find('p, strong, b').each((i, el) => {
                const text = $(el).text();
                if (/object class/i.test(text)) {
                    objectClass = text.replace(/.*object class[: ]*/i, '').trim();
                    return false;
                }
            });

            // Extract first decent paragraph
            let summary = '';
            contentDiv.find('p').each((i, el) => {
                const text = $(el).text().trim();
                if (text.length > 40) { // skip short junk like "≡"
                    summary = text;
                    return false;
                }
            });

            if (!summary) summary = 'No summary available.';

            if (summary.length > 500) summary = summary.slice(0, 500) + '...';

            // Build embed
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setURL(url)
                .setDescription(summary)
                .setColor('DarkRed')
                .setFooter({ text: `Requested: ${rawId.toUpperCase()}` })
                .setTimestamp();

            if (objectClass) {
                embed.addFields({ name: 'Object Class', value: objectClass, inline: true });
            }

            await interaction.reply({ embeds: [embed] });

        } catch (err) {
            console.error('SCP fetch error:', err.message || err);
            await interaction.reply({
                content: `❌ Could not retrieve **${rawId.toUpperCase()}**.`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
