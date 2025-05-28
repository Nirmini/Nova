const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, InteractionType, MessageFlags, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const noblox = require('noblox.js');
const { getData, setData } = require('../../src/firebaseAdmin');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

/*
sudo bash -c 'cat > /etc/systemd/system/novalyte.service' <<EOF
[Unit]
Description=Nova Lyte Discord Bot
After=network.target

[Service]
Type=simple
User=azureuser
WorkingDirectory=/home/azureuser/NovaLyte
ExecStart=/home/azureuser/novalyte-starter.sh
Restart=always
RestartSec-5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
*/
module.exports = {
    id: '9688368', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify your Roblox account with Nova'),

    async execute(interaction) {
        try {
            console.log(`${interaction.user.username}@${interaction.user.id} Ran /verify`);

            const modal = new ModalBuilder()
                .setCustomId('verifyModal')
                .setTitle('Roblox Verification');

            const robloxUsernameInput = new TextInputBuilder()
                .setCustomId('robloxUsername')
                .setLabel('Enter your Roblox Username')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const actionRow = new ActionRowBuilder().addComponents(robloxUsernameInput);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);
        } catch (error) {
            console.error('Error in /verify execute:', error);
            await interaction.reply({
                content: 'Something went wrong while starting the verification process. Please try again later.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },

    async modalHandler(interaction) {
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'verifyModal') {
            try {
                console.log(`${interaction.user.username}@${interaction.user.id} Submitted Roblox Username`);

                // Acknowledge the modal submission immediately
                await interaction.deferReply({ ephemeral: true });

                const robloxUsername = interaction.fields.getTextInputValue('robloxUsername');
                const verificationCode = Math.floor(100000000000000 + Math.random() * 900000000000000);

                console.log(`Generated verification code for ${robloxUsername}: ${verificationCode}`);

                // Send the verification instructions
                await interaction.editReply({
                    content: `Please update your Roblox "About Me" section with the following code: \`${verificationCode}\`.\nAfter updating, click **Verify** below.`,
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
            } catch (error) {
                console.error('Error in /verify modalHandler:', error);
                await interaction.editReply({
                    content: 'Something went wrong while processing your verification request. Please try again later.',
                });
            }
        }
    },

    async buttonHandler(interaction) {
        if (interaction.customId.startsWith('verifyCode')) {
            try {
                console.log(`${interaction.user.username}@${interaction.user.id} Clicked Verify Button`);

                await interaction.deferReply({ ephemeral: true });

                const [_, robloxUsername, verificationCode] = interaction.customId.split('-');
                const userId = await noblox.getIdFromUsername(robloxUsername);
                const profileInfo = await noblox.getPlayerInfo(userId);

                console.log(`Fetched Roblox user data for ${robloxUsername}:`, profileInfo);

                if (profileInfo.blurb.includes(verificationCode)) {
                    const guildId = interaction.guild.id;

                    // Check for verified role in the guild
                    let verifiedRoleId = await getData(`/guildsettings/${guildId}/config/verifiedroleid`);
                    let verifiedRole;

                    if (verifiedRoleId) {
                        verifiedRole = interaction.guild.roles.cache.get(verifiedRoleId);
                    }

                    // If no verified role exists, create one
                    if (!verifiedRole) {
                        console.log('Creating new Verified role...');
                        verifiedRole = await interaction.guild.roles.create({
                            name: 'Verified',
                            hoist: true,
                            color: null,
                            reason: 'Automatically created Verified role for user verification.',
                        });

                        // Save the new role ID to the database
                        await setData(`/guildsettings/${guildId}/config/verifiedroleid`, verifiedRole.id);
                    }

                    // Assign the verified role to the user
                    await interaction.member.roles.add(verifiedRole);

                    // Save user data to Firebase
                    const userData = {
                        UserID: interaction.user.id,
                        Username: interaction.user.username,
                        Email: null, // To be handled by OAuth2
                        TimeZ: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        RobloxID: userId,
                        RobloxUName: robloxUsername,
                        RobloxName: profileInfo.displayName,
                        Birthday: {
                            date: null, // Optional, can be added later
                            UIDping: interaction.user.id,
                        },
                    };

                    console.log(`Saving user data for ${interaction.user.username}@${interaction.user.id}:`, userData);
                    await setData(`/userdata/${interaction.user.id}`, userData);

                    // Send success embed
                    const embed = new EmbedBuilder()
                        .setTitle('Verification Successful')
                        .setColor(0x00FF00)
                        .setDescription(`You have been successfully verified as **${robloxUsername}**.`)
                        .addFields(
                            { name: 'Assigned Role', value: `<@&${verifiedRole.id}>`, inline: true },
                            { name: 'Roblox Display Name', value: profileInfo.displayName, inline: true }
                        )
                        .setTimestamp();

                    return interaction.editReply({ embeds: [embed] });
                } else {
                    console.warn(`Verification failed for ${robloxUsername}: Code not found in blurb.`);
                    await interaction.editReply({
                        content: `Verification failed! The code was not found in your "About Me" section. Please update it correctly.`,
                    });
                }
            } catch (error) {
                console.error('Error in /verify buttonHandler:', error);
                await interaction.editReply({
                    content: `There was an error verifying your Roblox account. Please try again.`,
                });
            }
        }
    },
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
