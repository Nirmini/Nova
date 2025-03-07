const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const admin = require('firebase-admin');
const { getDatabase } = require('firebase-admin/database');

// Initialize Firebase for the Roblox Project
const robloxApp = admin.initializeApp(
    {
        credential: admin.credential.cert(require('../../keys/roblox-serviceAccountKey.json')),
        databaseURL: '[REMOVED]', // Replace with your RTDB URL
    },
    'RobloxApp'
);
const robloxDB = getDatabase(robloxApp);

module.exports = {
    id: '8469589', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('rblx')
        .setDescription('Manage Roblox warnings and bans')
        .addSubcommand(subcommand =>
            subcommand
                .setName('warn')
                .setDescription('Warn a Roblox user')
                .addStringOption(option =>
                    option
                        .setName('userid')
                        .setDescription('Roblox User ID')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for the warning')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a Roblox user')
                .addStringOption(option =>
                    option
                        .setName('userid')
                        .setDescription('Roblox User ID')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for the ban')
                        .setRequired(true))),
    async execute(interaction) {
        try {
            // Check for required permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                await interaction.reply({
                    content: '❌ You lack the permissions to use this command.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const subcommand = interaction.options.getSubcommand();
            const userId = interaction.options.getString('userid');
            const reason = interaction.options.getString('reason');
            const mod = interaction.user.tag;
            const timestamp = new Date().toISOString();

            if (subcommand === 'warn') {
                // Handle warnings
                const warningsPath = `warnings/${userId}`;
                const snapshot = await robloxDB.ref(warningsPath).get();
                const warnings = snapshot.exists() ? snapshot.val() : [];

                warnings.push({ reason, mod, timestamp });
                await robloxDB.ref(warningsPath).set(warnings);

                await interaction.reply({
                    content: `✅ Warned Roblox user \`${userId}\` for: **${reason}**`,
                    flags: MessageFlags.Ephemeral,
                });
            } else if (subcommand === 'ban') {
                // Handle bans
                const banPath = `bans/${userId}`;
                await robloxDB.ref(banPath).set({ reason, mod, timestamp });

                await interaction.reply({
                    content: `✅ Banned Roblox user \`${userId}\` for: **${reason}**`,
                    flags: MessageFlags.Ephemeral,
                });
            }
        } catch (error) {
            console.error('Error executing /rblx command:', error);
            await interaction.reply({
                content: '❌ An error occurred while executing this command.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
