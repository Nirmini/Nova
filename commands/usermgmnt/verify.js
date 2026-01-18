const { 
    ButtonBuilder, 
    ButtonStyle, 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    MessageFlags, 
    EmbedBuilder, 
    AttachmentBuilder,
    PermissionsBitField,
} = require('discord.js');
const noblox = require('noblox.js');
const fs = require('node:fs');
const path = require('node:path');
const { getUserData, getGuildConfig } = require('../../src/Database');
const { drawImage } = require('../../src/services/verificationimages');
const settings = require('../../settings.json');
const emoji = require('../../emoji.json');
const { JoinDate, GetUserRankingRP } = require('../../core/APIs/Roblox');
const axios = require('axios');

module.exports = {
    id: '9000011',
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify your Roblox account with Nova'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Nova Verification')
            .setColor(0x5865F2)
            .setTimestamp();

        try {
            if (settings.extended_logs) console.log(`[/verify]: ${interaction.user.username}@${interaction.user.id} Ran /verify`);

            const existingUserData = await getUserData(interaction.user.id, "Roblox"); 

            if (existingUserData) {
                if (settings.extended_logs) console.log(`[/verify]: User ${interaction.user.username}@${interaction.user.id} is already verified.`);

                embed.setDescription(
                    `You are already verified as **${existingUserData.username}**.\n` +
                    `If you want to re-verify, click **Re-verify** below.`
                );

                const actionRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`verify-cancelVerification`)
                            .setLabel(`Cancel`)
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId(`verify-continueVerification`)
                            .setLabel(`Re-verify`)
                            .setStyle(ButtonStyle.Primary)
                    );

                return interaction.reply({
                    embeds: [embed],
                    components: [actionRow],
                    flags: MessageFlags.Ephemeral,
                });
            }

            embed.setDescription(`To verify with Nova, please visit [__this website__](https://nirmini.dev/Nova/Auth/Roblox) and follow the on-screen instructions.`)
                .setURL(`https://nirmini.dev/Nova/Auth/Roblox`)
                .setFooter({ text: `Nova Verification` });

            const verificationRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`verify-cancelVerification`)
                        .setLabel(`Cancel`)
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`verify-userPipelineFinished`)
                        .setLabel(`I've Verified`)
                        .setStyle(ButtonStyle.Success)
                );

            await interaction.reply({
                embeds: [embed],
                components: [verificationRow],
                flags: MessageFlags.Ephemeral,
            });
        } catch (error) {
            console.error('Error in /verify execute:', error);
            embed.setTitle(`${emoji.FormattedEmoji.NovaFailure} An Error Occurred With \`/verify\`.`)
                .setColor(0xFF0000)
                .setDescription(`An error occurred while starting verification.\n**Error(*Report this to Nirmini*)**:\n\`\`\`\n${error}\n\`\`\``);
            
            if (!interaction.replied) {
                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } else {
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }
        }
    },

    async buttonHandler(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Nova Verification')
            .setColor(0x5865F2)
            .setTimestamp();

        try {
            if (interaction.customId === 'verify-continueVerification') {
                embed.setDescription(`To re-verify with Nova, please visit [__this website__](https://nirmini.dev/Nova/Auth/Roblox) and follow the on-screen instructions.`)
                    .setURL(`https://nirmini.dev/Nova/Auth/Roblox`)
                    .setFooter({ text: `Nova Verification` });

                const verificationRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`verify-cancelVerification`)
                            .setLabel(`Cancel`)
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId(`verify-userPipelineFinished`)
                            .setLabel(`I've Verified`)
                            .setStyle(ButtonStyle.Success)
                    );

                return interaction.update({
                    embeds: [embed],
                    components: [verificationRow],
                });
            }

            if (interaction.customId === 'verify-userPipelineFinished') {
                await interaction.deferUpdate();

                const verificationUserData = await getUserData(interaction.user.id, "Roblox");
                if (!verificationUserData) {
                    embed.setDescription(`Failed to get user data. Try running \`/verify\` again.\nIf this continues, contact Nirmini.`)
                        .setColor(0xFF0000);
                    return interaction.editReply({
                        embeds: [embed],
                        components: [],
                    });
                }
            
                const guildRobloxConfig = await getGuildConfig(interaction.guild.id, 'roblox') || {};
                const guildVerificationConfig = guildRobloxConfig.verify_username || 'default';
            
                // Safely set nickname without blocking
                try {
                    const botMember = interaction.guild.members.me;
                    const botHighestPos = botMember?.roles?.highest?.position ?? 0;
                    const targetHighestPos = interaction.member.roles?.highest?.position ?? 0;
                    const isOwner = interaction.guild.ownerId === interaction.user.id;
                    const hasManageNick = typeof botMember?.permissions?.has === 'function' ? botMember.permissions.has(PermissionsBitField.Flags.ManageNicknames) : false;
                    const canSetNick = hasManageNick && (botHighestPos > targetHighestPos) && !isOwner;
                    switch (guildVerificationConfig) {
                        case 'default':
                        case 'roblox-name':
                            if (canSetNick) {
                                interaction.member.setNickname(verificationUserData.username).catch(err => {
                                    console.warn(`Cannot set nickname for ${interaction.user.tag}:`, err.message);
                                });
                            } else if (settings.extended_logs) {
                                console.warn(`Skipping nickname change for ${interaction.user.tag}: insufficient permissions or role hierarchy.`);
                            }
                            break;
                        case 'display-name':
                            if (canSetNick) {
                                interaction.member.setNickname(verificationUserData.nickname).catch(err => {
                                    console.warn(`Cannot set nickname for ${interaction.user.tag}:`, err.message);
                                });
                            } else if (settings.extended_logs) {
                                console.warn(`Skipping nickname change for ${interaction.user.tag}: insufficient permissions or role hierarchy.`);
                            }
                            break;
                        case 'smart-name':
                            if (canSetNick) {
                                interaction.member.setNickname(`${verificationUserData.nickname}(@${verificationUserData.username})`).catch(err => {
                                    console.warn(`Cannot set nickname for ${interaction.user.tag}:`, err.message);
                                });
                            } else if (settings.extended_logs) {
                                console.warn(`Skipping nickname change for ${interaction.user.tag}: insufficient permissions or role hierarchy.`);
                            }
                            break;
                        case 'roblox-id':
                            if (canSetNick) {
                                interaction.member.setNickname(verificationUserData.userId.toString()).catch(err => {
                                    console.warn(`Cannot set nickname for ${interaction.user.tag}:`, err.message);
                                });
                            } else if (settings.extended_logs) {
                                console.warn(`Skipping nickname change for ${interaction.user.tag}: insufficient permissions or role hierarchy.`);
                            }
                            break;
                        case 'roblox-age': {
                            const currentDate = new Date();
                            const joinDate = new Date(await JoinDate(verificationUserData.userId));
                            let years = currentDate.getUTCFullYear() - joinDate.getUTCFullYear();
                            let months = currentDate.getUTCMonth() - joinDate.getUTCMonth();
                            let days = currentDate.getUTCDate() - joinDate.getUTCDate();
                            if (days < 0) { months--; days += new Date(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 0).getUTCDate(); }
                            if (months < 0) { years--; months += 12; }
                            if (canSetNick) {
                                interaction.member.setNickname(`${years} Years, ${months} Months, ${days} Days`).catch(err => {
                                    console.warn(`Cannot set nickname for ${interaction.user.tag}:`, err.message);
                                });
                            } else if (settings.extended_logs) {
                                console.warn(`Skipping nickname change for ${interaction.user.tag}: insufficient permissions or role hierarchy.`);
                            }
                            break;
                        }
                        case 'roblox-join-date':
                            if (canSetNick) {
                                interaction.member.setNickname(await JoinDate(verificationUserData.userId)).catch(err => {
                                    console.warn(`Cannot set nickname for ${interaction.user.tag}:`, err.message);
                                });
                            } else if (settings.extended_logs) {
                                console.warn(`Skipping nickname change for ${interaction.user.tag}: insufficient permissions or role hierarchy.`);
                            }
                            break;
                        case 'group-rank':
                            (async () => {
                                try {
                                    const groupId = await getGuildConfig(interaction.guild.id, 'rbxgroup');
                                    const rank = await GetUserRankingRP(verificationUserData.userId, groupId);
                                    if (canSetNick) {
                                        interaction.member.setNickname(rank).catch(err => {
                                            console.warn(`Cannot set nickname for ${interaction.user.tag}:`, err.message);
                                        });
                                    } else if (settings.extended_logs) {
                                        console.warn(`Skipping nickname change for ${interaction.user.tag}: insufficient permissions or role hierarchy.`);
                                    }
                                } catch (innerErr) {
                                    console.warn(`Cannot compute group rank for ${interaction.user.tag}:`, innerErr.message);
                                }
                            })();
                            break;
                        case 'disabled':
                        default:
                            break;
                    }
                } catch (err) {
                    console.warn(`Nickname update failed for ${interaction.user.tag}:`, err.message);
                }

                // Role updates
                const binds = (await getGuildConfig(interaction.guild.id, 'Binds')) || [];
                const rolesToAdd = [];
                const managedRoles = new Set();

                for (const bind of binds) {
                    const [typeAndId, minRank, maxRank, roleId] = bind.split(',');
                    const [type, id] = typeAndId.split(':');
                    if (roleId) managedRoles.add(roleId);

                    if (type === 'group') {
                        const rank = await noblox.getRankInGroup(parseInt(id), verificationUserData.userId);
                        if (rank >= parseInt(minRank) && rank <= parseInt(maxRank)) rolesToAdd.push(roleId);
                    } else if (type === 'badge') {
                        try {
                            const res = await axios.get(`https://badges.roblox.com/v1/users/${verificationUserData.userId}/badges/${id}/awarded-date`);
                            if (res.data.awardedDate) rolesToAdd.push(roleId);
                        } catch (err) {
                            console.error(`[/verify]: ${err}`);
                        }
                    } else if (type === 'gamepass') {
                        try {
                            const res = await axios.get(`https://inventory.roblox.com/v1/users/${verificationUserData.userId}/items/1/${id}`);
                            if (res.data[0]?.id) rolesToAdd.push(roleId);
                        } catch (err) {
                            console.error(`[/verify]: ${err}`);
                        }
                    }
                }

                const rolesAdded = [];
                const rolesRemoved = [];
                const botMember = interaction.guild.members.me;
                const botHighestPos = botMember?.roles?.highest?.position ?? 0;

                for (const roleId of rolesToAdd) {
                    try {
                        if (!interaction.member.roles.cache.has(roleId)) {
                            const role = interaction.guild.roles.cache.get(roleId);
                            if (role) {
                                await interaction.member.roles.add(roleId);
                                rolesAdded.push(roleId);
                            }
                        }
                    } catch (err) {
                        console.warn(`Failed to add role ${roleId}:`, err.message || err);
                    }
                }

                for (const roleId of managedRoles) {
                    try {
                        if (interaction.member.roles.cache.has(roleId) && !rolesToAdd.includes(roleId)) {
                            const role = interaction.guild.roles.cache.get(roleId);
                            if (!role || role.position >= botHighestPos) continue;
                            await interaction.member.roles.remove(roleId);
                            rolesRemoved.push(roleId);
                        }
                    } catch (err) {
                        console.warn(`Failed to remove role ${roleId}:`, err.message || err);
                    }
                }

                const altVerificationUserData = await getUserData(interaction.user.id, "Roblox");
                console.log(`[Verify]: DBD: ${JSON.stringify(altVerificationUserData)} (${altVerificationUserData?.userId})`);
                
                // Verification image
                let userImage;
                try {
                    const res = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${altVerificationUserData.userId}&size=352x352&format=Png&isCircular=true`);
                    userImage = res.data?.data?.[0]?.imageUrl || null;
                } catch (err) {
                    console.error(err);
                }

                const avatarURL = interaction.member.displayAvatarURL({ dynamic: true, size: 1024 }).replace('.webp', '.jpg');
                console.log(`Requested verification image!`);
                console.log(`[Verify]: Discord URL: ${avatarURL}`);
                console.log(`[Verify]: Roblox URL: ${userImage}`);
                
                const drawResult = await drawImage(avatarURL, userImage);
                let verificationBuffer = null;
                let generatedPath = null;
                if (drawResult && typeof drawResult === 'object') {
                    verificationBuffer = drawResult.buffer || null;
                    generatedPath = drawResult.tempFilePath || null;
                } else if (Buffer.isBuffer(drawResult)) {
                    verificationBuffer = drawResult;
                }

                console.log(`Returned verification image!`, {
                    hasBuffer: Buffer.isBuffer(verificationBuffer),
                    bufferLength: verificationBuffer ? verificationBuffer.length : null,
                    generatedPath: generatedPath || null,
                });

                let VerificationImage = null;
                let tempFilePath = null;

                if (generatedPath) {
                    tempFilePath = generatedPath;
                    VerificationImage = tempFilePath;
                } else if (verificationBuffer && Buffer.isBuffer(verificationBuffer) && verificationBuffer.length > 0) {
                    try {
                        const tempDir = path.join(__dirname, '../../temp');
                        await fs.promises.mkdir(tempDir, { recursive: true });
                        const userIdKey = String(interaction.user.id);
                        const files = await fs.promises.readdir(tempDir).catch(() => []);
                        const used = new Set();
                        for (const f of files) {
                            const m = f.match(new RegExp(`^${userIdKey}-(\\d+)\\.png$`));
                            if (m) used.add(parseInt(m[1], 10));
                        }
                        let nextIndex = 1;
                        while (used.has(nextIndex)) nextIndex++;
                        tempFilePath = path.join(tempDir, `${userIdKey}-${nextIndex}.png`);
                        await fs.promises.writeFile(tempFilePath, verificationBuffer);
                        VerificationImage = tempFilePath;
                    } catch (err) {
                        console.warn('Failed to write verification image to temp file:', err?.message || err);
                        VerificationImage = null;
                        tempFilePath = null;
                    }
                } else {
                    console.warn('Verification image invalid or empty; skipping attachment.');
                }

                embed.setDescription(`Verification & Role Update completed! See details below. ${emoji.FormattedEmoji.NovaCheck2}`)
                    .setColor(0x00FF00)
                    .addFields(
                        { name: `**Roles Added(${rolesAdded.length})**`, value: rolesAdded.length ? rolesAdded.map(r => `<@&${r}>`).join(', ') : '*None*', inline: true },
                        { name: `**Roles Removed(${rolesRemoved.length})**`, value: rolesRemoved.length ? rolesRemoved.map(r => `<@&${r}>`).join(', ') : '*None*', inline: true }
                    );
                
                let attachmentName = null;
                if (tempFilePath) {
                    if (!path.isAbsolute(tempFilePath)) tempFilePath = path.join(__dirname, '../../temp', tempFilePath);
                    attachmentName = path.basename(tempFilePath);
                    embed.setImage(`attachment://${attachmentName}`);
                }

                try {
                    console.log(`[Verify]: Embed content: ${JSON.stringify(embed)}`);
                    const options = { embeds: [embed], components: [] };
                    let attachment = null;
                    if (tempFilePath) {
                        try {
                            const exists = fs.existsSync(tempFilePath);
                            const stats = exists ? fs.statSync(tempFilePath) : null;
                            console.log(`[Verify]: Attaching temp file ${tempFilePath} (exists=${exists}, size=${stats ? stats.size : 'n/a'})`);
                            attachment = new AttachmentBuilder(tempFilePath, { name: attachmentName });
                            console.log(`[Verify]: Image path: ${JSON.stringify(tempFilePath)}`);
                            options.files = [attachment];
                        } catch (fileErr) {
                            console.warn('Failed to prepare temp verification image for upload:', fileErr?.message || fileErr);
                            options.files = undefined;
                        }
                    }
                    console.log(`[Verify]: Options ${JSON.stringify(options)}`);
                    const resp = await interaction.editReply(options);
                    return resp;
                } catch (err) {
                    console.error('Failed to edit reply with verification result:', err?.message || err);
                    try {
                        await interaction.editReply({ 
                            embeds: [embed.setImage(null)], 
                            components: [],
                            files: []
                        }).catch(() => {});
                    } catch (inner) {
                        console.error('Failed to recover from editReply error:', inner?.message || inner);
                    }
                    if (tempFilePath) {
                        try {
                            await fs.promises.unlink(tempFilePath);
                        } catch (delErr) {
                            console.warn('Failed to delete temp verification image after error:', delErr?.message || delErr);
                        }
                    }
                    return null;
                }
            }

            if (interaction.customId === 'verify-cancelVerification') {
                if (settings.extended_logs) console.log(`${interaction.user.username}@${interaction.user.id} Clicked Cancel Button`);

                embed.setTitle(`${emoji.FormattedEmoji.Failure} Verification Canceled`)
                    .setColor(0xFF0000)
                    .setDescription(`User verification was canceled by the user.`);

                return interaction.update({ embeds: [embed], components: [] });
            }
        } catch (error) {
            console.error('Error in /verify buttonHandler:', error);
            embed.setTitle(`${emoji.FormattedEmoji.NovaFailure} An Error Occurred With \`/verify\`.`)
                .setColor(0xFF0000)
                .setDescription(`An error occurred while processing the verification interaction.\n**Error(*Report this to Nirmini*)**:\n\`\`\`\n${error}\n\`\`\``);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } else {
                await interaction.editReply({ embeds: [embed], components: [] }).catch(() => 
                    interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral })
                );
            }
        }
    },
};