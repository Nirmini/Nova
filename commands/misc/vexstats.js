const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');

const API_KEY = process.env.RBT_EVNTS;

module.exports = {
    id: '5723849', // Unique ID for the command
    data: new SlashCommandBuilder()
        .setName('vexstats')
        .setDescription('Fetches VEX team stats from RobotEvents')
        .addSubcommand(subcommand =>
            subcommand
                .setName('team')
                .setDescription('Fetch team details')
                .addStringOption(option =>
                    option.setName('competition')
                        .setDescription('Competition type (IQ or V5)')
                        .setRequired(true)
                        .addChoices(
                            { name: 'VEX IQ', value: 'VIQRC' },
                            { name: 'VEX V5', value: 'VRC' }
                        ))
                .addStringOption(option =>
                    option.setName('teamid')
                        .setDescription('The VEX Team ID (e.g., 11466D)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('awards')
                .setDescription('Fetch team awards')
                .addStringOption(option =>
                    option.setName('competition')
                        .setDescription('Competition type (IQ or V5)')
                        .setRequired(true)
                        .addChoices(
                            { name: 'VEX IQ', value: 'VIQRC' },
                            { name: 'VEX V5', value: 'VRC' }
                        ))
                .addStringOption(option =>
                    option.setName('teamid')
                        .setDescription('The VEX Team ID (e.g., 11466D)')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const competition = interaction.options.getString('competition'); // 'VIQRC' or 'VRC'
        const teamID = interaction.options.getString('teamid').toUpperCase(); // Convert to uppercase

        await interaction.deferReply({ ephemeral: true });

        try {
            // Fetch Team Data First (Needed for Awards Too)
            const teamResponse = await axios.get(`https://www.robotevents.com/api/v2/teams`, {
                headers: { 'Authorization': `Bearer ${API_KEY}` },
                params: {
                    'number[]': teamID,
                    registered: true,
                    myTeams: false,
                }
            });

            // Ensure the team exists
            if (!teamResponse.data || teamResponse.data.data.length === 0) {
                return interaction.followUp({
                    content: `No registered team found with ID **${teamID}**.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const team = teamResponse.data.data[0]; // First team found

            // Handle Subcommands
            if (subcommand === 'team') {
                const embed = new EmbedBuilder()
                    .setTitle(`VEX Team Stats - ${team.number}`)
                    .setColor(0x0099ff)
                    .setDescription(`Information for **${team.team_name}** (${team.program.name})`)
                    .addFields(
                        { name: 'Team ID', value: team.id.toString(), inline: true },
                        { name: 'Organization', value: team.organization || 'N/A', inline: true },
                        { name: 'Location', value: `${team.location.city}, ${team.location.region}, ${team.location.country}`, inline: true },
                        { name: 'Grade Level', value: team.grade || 'N/A', inline: true },
                        { name: 'Registered', value: team.registered ? '✅ Yes' : '❌ No', inline: true }
                    )
                    .setFooter({ text: 'Data from RobotEvents API' });

                return interaction.followUp({ embeds: [embed] });

            } else if (subcommand === 'awards') {
                // Fetch Awards Data Using the Team ID
                const awardsResponse = await axios.get(`https://www.robotevents.com/api/v2/teams/${team.id}/awards`, {
                    headers: { 'Authorization': `Bearer ${API_KEY}` }
                });

                const awards = awardsResponse.data.data;

                // If no awards found
                if (!awards || awards.length === 0) {
                    return interaction.followUp({
                        content: `No awards found for team **${teamID}**.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                // Create Embed with Awards List
                const embed = new EmbedBuilder()
                    .setTitle(`🏆 Awards for ${team.number} - ${team.team_name}`)
                    .setColor(0xf1c40f)
                    .setDescription(`Showing awards for **${team.team_name}** in **${team.program.name}**`)
                    .setFooter({ text: 'Data from RobotEvents API' });

                // Limit to 10 awards to avoid exceeding embed limits
                awards.slice(0, 10).forEach(award => {
                    embed.addFields({
                        name: `🏅 ${award.title}`,
                        value: `Event: **${award.event.name}**\nCode: \`${award.event.code}\``,
                        inline: false
                    });
                });

                return interaction.followUp({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error fetching VEX stats:', error.response?.data || error.message);
            await interaction.followUp({
                content: 'Error fetching data. Try again later.',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
