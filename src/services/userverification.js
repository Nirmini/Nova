const noblox = require('noblox.js');
const { getUserData, getGuildConfig } = require('../Database');

/**
 * Assign roles to a member according to guild binds (basically  update.js)
 * @param {Guild} guild
 * @param {GuildMember} member
 * @param {number|string} robloxId
 */
async function assignRolesForMember(guild, member, robloxId) {
    try {
        const guildId = guild.id;
        const binds = (await getGuildConfig(guildId, 'Binds')) || [];
        for (const bind of binds) {
            try {
                const [typeAndId, minRank, maxRank, roleId] = bind.split(',');
                const [type, id] = typeAndId.split(':');
                if (type === 'group') {
                    const rank = await noblox.getRankInGroup(parseInt(id), robloxId);
                    if (rank >= parseInt(minRank) && rank <= parseInt(maxRank)) {
                        const role = guild.roles.cache.get(roleId);
                        if (role && member.manageable) {
                            await member.roles.add(roleId);
                        }
                    }
                }
            } catch (err) {
                console.error('Error processing bind', bind, err.message || err);
            }
        }
    } catch (err) {
        console.error('assignRolesForMember failed:', err.message || err);
    }
}

/**
 * Handler to run when a guild member joins. If the user has a linked Roblox account and
 * the guild has `roblox.auto_verify` enabled, this will assign the verified role (if set)
 * and run binds-based role assignment (same as /update).
 * @param {GuildMember} member
 */
async function handleGuildMemberAdd(member) {
    try {
        const userData = await getUserData(member.id);
        if (!userData || !userData.Roblox.userId) return;

        const guildId = member.guild.id;

        // Check guild setting for automatic verification
        let robloxCfg = {};
        try { robloxCfg = await getGuildConfig(guildId, 'roblox') || {}; } catch (e) { /* ignore */ }

        if (!robloxCfg.auto_verify) {
            // guild does not auto-verify on join; nothing to do
            return;
        }

        // Assign verified role if configured
        try {
            const verifiedRoleId = await getGuildConfig(guildId, 'config/verifiedroleid');
            if (verifiedRoleId) {
                const role = member.guild.roles.cache.get(verifiedRoleId);
                if (role && member.manageable) await member.roles.add(role);
            }
        } catch (err) {
            console.warn('Could not assign configured verified role on join:', err.message || err);
        }

        // Run the same update logic as /update: assign binds-based roles
        await assignRolesForMember(member.guild, member, userData.Roblox.userId);
        console.log(`Auto-updated roles for ${member.user.tag} on join (linked Roblox id ${userData.Roblox.userId}).`);
    } catch (err) {
        console.error('handleGuildMemberAdd error:', err.message || err);
    }
}

module.exports = {
    assignRolesForMember,
    handleGuildMemberAdd,
};
