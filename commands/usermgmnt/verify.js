const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, InteractionType, MessageFlags, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const noblox = require('noblox.js');
const { getData, setData } = require('../../src/Database');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
    id: '9000010', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify your Roblox account with Nova'),

    async execute(interaction) {
        try {
            console.log(`${interaction.user.username}@${interaction.user.id} Ran /verify`);

            // Check if the user is already verified
            const existingUserData = await getData(`/userdata/${interaction.user.id}`);
            if (existingUserData) {
                console.log(`User ${interaction.user.username}@${interaction.user.id} is already verified.`);

                // Create an embed for already verified users
                const alreadyVerifiedEmbed = new EmbedBuilder()
                    .setTitle('Already Verified')
                    .setColor(0xFFA500) // Orange color
                    .setDescription(
                        `You are already verified as **${existingUserData.RobloxUName}**.\n` +
                        `If you want to re-verify, click **Continue** below.`
                    )
                    .setTimestamp();

                // Create buttons for Cancel and Continue
                const actionRow = {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: 'Cancel',
                            style: 4, // Red button
                            custom_id: 'verify-cancelVerification', // Updated custom ID
                        },
                        {
                            type: 2,
                            label: 'Continue',
                            style: 1, // Blue button
                            custom_id: 'verify-continueVerification', // Updated custom ID
                        },
                    ],
                };
                
                return interaction.reply({
                    embeds: [alreadyVerifiedEmbed],
                    components: [actionRow],
                    flags: MessageFlags.Ephemeral, // Use flags instead of ephemeral
                });
            }

            // If the user is not already verified, show the modal
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
                flags: MessageFlags.Ephemeral, // Use flags instead of ephemeral
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
        if (interaction.customId === 'verify-continueVerification') {
            try {
                console.log(`${interaction.user.username}@${interaction.user.id} Clicked Continue Button`);

                // Show the modal for re-verification
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
                console.error('Error in /verify buttonHandler (Continue):', error);
                await interaction.reply({
                    content: 'Something went wrong while processing your request. Please try again later.',
                    flags: MessageFlags.Ephemeral, // Use flags instead of ephemeral
                });
            }
        } else if (interaction.customId === 'verify-cancelVerification') {
            // Handle cancel button
            try {
                console.log(`${interaction.user.username}@${interaction.user.id} Clicked Cancel Button`);

                // Create a cancellation embed
                const cancelEmbed = new EmbedBuilder()
                    .setTitle('Verification Canceled')
                    .setColor(0xFF0000) // Red color
                    .setDescription('The verification process has been canceled.')
                    .setTimestamp();

                 // Edit the original message with the cancellation embed
                await interaction.update({
                    embeds: [cancelEmbed],
                    components: [], // Remove buttons
                });
            } catch (error) {
                console.error('Error in /verify buttonHandler (Cancel):', error);
                await interaction.reply({
                    content: 'Something went wrong while canceling the verification process. Please try again later.',
                    flags: MessageFlags.Ephemeral, // Use flags instead of ephemeral
                });
            }
        } else if (interaction.customId.startsWith('verifyCode')) {
            try {
                console.log(`${interaction.user.username}@${interaction.user.id} Clicked Verify Button`);

                await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Use flags instead of ephemeral

                const [_, robloxUsername, verificationCode] = interaction.customId.split('-');
                const userId = await noblox.getIdFromUsername(robloxUsername);
                const profileInfo = await noblox.getPlayerInfo(userId);

                console.log(`Fetched Roblox user data for ${robloxUsername}:`, profileInfo);

                // Check if the user is already verified
                const existingUserData = await getData(`/userdata/${interaction.user.id}`);
                if (existingUserData) {
                    console.log(`User ${interaction.user.username}@${interaction.user.id} is already verified.`);

                    // Create an embed for already verified users
                    const alreadyVerifiedEmbed = new EmbedBuilder()
                        .setTitle('Already Verified')
                        .setColor(0xFFA500) // Orange color
                        .setDescription(
                            `You are already verified as **${existingUserData.RobloxUName}**.\n` +
                            `If you want to re-verify, click **Continue** below.`
                        )
                        .setTimestamp();

                    // Create buttons for Cancel and Continue
                    const actionRow = {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: 'Cancel',
                                style: 4, // Red button
                                custom_id: 'cancelVerification',
                            },
                            {
                                type: 2,
                                label: 'Continue',
                                style: 1, // Blue button
                                custom_id: `continueVerification-${robloxUsername}-${verificationCode}`,
                            },
                        ],
                    };

                    return interaction.editReply({
                        embeds: [alreadyVerifiedEmbed],
                        components: [actionRow],
                    });
                }

                // Proceed with verification if the user is not already verified
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

                    // Generate a unique NovaUID
                    const allUsers = await getData('/userdata') || {};
                    const novaUID = Object.keys(allUsers).length + 1;

                    // Save user data to Firebase
                    const userData = {
                        UserID: interaction.user.id,
                        Username: interaction.user.username,
                        Email: null, // To be handled by OAuth2
                        TimeZ: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        RobloxID: userId,
                        RobloxUName: robloxUsername,
                        RobloxName: profileInfo.displayName,
                        VerifiedAt: new Date().toISOString(), // Add verification timestamp
                        NovaUID: novaUID, // Add unique NovaUID
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
                            { name: 'Roblox Display Name', value: profileInfo.displayName, inline: true },
                            { name: 'NovaUID', value: novaUID.toString(), inline: true }, // Display NovaUID
                            { name: 'Verified At', value: new Date().toLocaleString(), inline: true } // Display verification timestamp
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
