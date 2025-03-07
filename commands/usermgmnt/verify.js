const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, InteractionType, MessageFlags, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const noblox = require('noblox.js');
const { getData, setData } = require('../../src/firebaseAdmin');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
    id: '9688368', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify your Roblox account to get the verified role.'),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('robloxVerifyModal')
            .setTitle('Roblox Verification');

        const robloxUsernameInput = new TextInputBuilder()
            .setCustomId('robloxUsername')
            .setLabel('Enter your Roblox Username')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(robloxUsernameInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    },

    async modalHandler(interaction) {
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'robloxVerifyModal') {
            const robloxUsername = interaction.fields.getTextInputValue('robloxUsername');
            const verificationCode = Math.floor(100000000000000 + Math.random() * 900000000000000);

            await interaction.reply({
                content: `Please update your Roblox "About Me" section with the following code: \`${verificationCode}\`.\nAfter updating, click **Verify** below.`,
                flags: MessageFlags.Ephemeral,
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: "Verify",
                                style: 1,
                                custom_id: `verifyCode-${robloxUsername}-${verificationCode}`,
                            }
                        ]
                    }
                ]
            });
        }
    },

    async buttonHandler(interaction) {
        if (interaction.customId.startsWith('verifyCode')) {
            const [_, robloxUsername, verificationCode] = interaction.customId.split('-');

            try {
                const userId = await noblox.getIdFromUsername(robloxUsername);
                const profileInfo = await noblox.getPlayerInfo(userId);

                if (profileInfo.blurb.includes(verificationCode)) {
                    const verifiedRole = interaction.guild.roles.cache.find(role => 
                        role.name.toLowerCase().includes('employee')
                    );

                    if (!verifiedRole) {
                        return interaction.reply({
                            content: `Could not find a role containing "Employee" in this server. Please contact an admin.`,
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    // Store user verification in Firebase
                    const userPath = `linkedusers/${interaction.user.id}/${userId}`;
                    await setData(`${userPath}/username`, robloxUsername);

                    // Track role changes
                    const hadRole = interaction.member.roles.cache.has(verifiedRole.id);
                    if (!hadRole) {
                        await interaction.member.roles.add(verifiedRole);
                    }

                    // Fetch user avatars
                    const discordAvatar = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });
                    const robloxAvatar = await noblox.getPlayerThumbnail([userId], 420, 'png', false);
                    const robloxAvatarURL = robloxAvatar[0]?.imageUrl || "https://via.placeholder.com/420";

                    // Generate verification embed
                    const embed = new EmbedBuilder()
                        .setTitle('Verification Successful')
                        .setColor(0x00FF00)
                        .setDescription(`You have been successfully verified as **${robloxUsername}**.`)
                        .addFields(
                            { name: 'Added Role', value: hadRole ? 'Already had role' : verifiedRole.name, inline: true },
                            { name: 'Removed Role', value: hadRole ? 'None' : 'N/A', inline: true }
                        )
                        .setTimestamp();

                    // Generate verification image
                    const verificationImage = await createVerificationImage(discordAvatar, robloxAvatarURL);

                    // Send response with embed and verification image
                    await interaction.reply({
                        embeds: [embed],
                        files: [{ attachment: verificationImage, name: 'link_verification.png' }],
                        flags: MessageFlags.Ephemeral
                    });

                } else {
                    await interaction.reply({
                        content: `Verification failed! The code was not found in your "About Me" section. Please update it correctly.`,
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: `There was an error verifying your Roblox account. Please try again.`,
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};

/**
 * Generates a verification image with Discord & Roblox avatars.
 * @param {string} discordAvatarURL - The URL of the user's Discord avatar.
 * @param {string} robloxAvatarURL - The URL of the user's Roblox avatar.
 * @returns {Promise<Buffer>} - A buffer containing the generated image.
 */
async function createVerificationImage(discordAvatarURL, robloxAvatarURL) {
    const canvas = createCanvas(800, 300); // Adjust canvas size as needed
    const ctx = canvas.getContext('2d');

    // Load images
    const bgImage = await loadImage(path.resolve(__dirname, '../../Icos/LinkBg.png'));
    const linkIcon = await loadImage(path.resolve(__dirname, '../../Icos/LinkIco.png'));
    const discordAvatar = await loadImage(discordAvatarURL);
    const robloxAvatar = await loadImage(robloxAvatarURL);

    // Draw background
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    // Draw Discord avatar (left side)
    ctx.beginPath();
    ctx.arc(175, 150, 100, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(discordAvatar, 75, 50, 200, 200);
    ctx.restore();

    // Draw link icon (center)
    ctx.drawImage(linkIcon, 350, 75, 100, 150);

    // Draw Roblox avatar (right side)
    ctx.beginPath();
    ctx.arc(625, 150, 100, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(robloxAvatar, 525, 50, 200, 200);
    ctx.restore();

    // Convert to buffer
    return canvas.toBuffer();
}
