const client = require('../core/global/Client');
const { getData, setData, updateData, removeData } = require('./Database'); // your unified DB layer
const log = (...a) => console.log('[NovaIPC]', ...a);

let ready = Boolean(client?.readyAt);
if (client && typeof client.on === 'function') {
    client.on('clientReady', () => { ready = true; });
    client.once('ready', () => { ready = true; });
}

if (process.send) {
    process.on('message', async (msg) => {
        try {
            if (!msg || typeof msg !== 'object') return;
            const { from, key, requestId, body = {} } = msg;
            if (!key) return;

            let value;

            if (!ready) {
                value = { error: 'Bot not ready yet' };
            } else {
                switch (key) {
                    // ===== STATUS =====
                    case 'GuildCount':
                        value = client.guilds?.cache?.size || 0;
                        break;

                    case 'UserCount':
                        try {
                            value = client.guilds?.cache?.reduce((acc, g) => acc + (g?.memberCount || 0), 0) || 0;
                        } catch (e) {
                            value = { error: 'Failed to compute UserCount', detail: e.message };
                        }
                        break;

                    case 'GetApp':
                        value = {
                            appName: client.user?.username,
                            appId: client.user?.id,
                            uptime: process.uptime(),
                            ping: client.ws?.ping || 0,
                            version: '2.0-internal'
                        };
                        break;

                    case 'GetShards':
                        // Placeholder for sharding info if using ShardingManager
                        value = client.ws?.shards?.map(s => ({
                            id: s.id,
                            status: s.status,
                            ping: s.ping
                        })) || [{ id: 0, status: 'active', ping: client.ws?.ping || 0 }];
                        break;

                    // ===== USERS =====
                    case 'GetUserData':
                        value = await getData(`userdata/${body.User}`);
                        if (body.Key && value) value = value[body.Key] ?? null;
                        break;

                    case 'SetUserData':
                        await setData(`userdata/${body.User}/${body.Key}`, body.Val);
                        value = { success: true };
                        break;

                    case 'GetUserSubs':
                        value = await getData(`userdata/${body.User}/subscriptions`) ?? [];
                        break;

                    case 'SetUserSubs':
                        if (!body.User || !body.Guild) throw new Error('Missing User or Guild');
                        await updateData(`userdata/${body.User}/subscriptions`, { [body.Guild]: true });
                        value = { success: true };
                        break;

                    case 'GetUserBirthday':
                        value = await getData(`userdata/${body.User}/birthday`) ?? null;
                        break;

                    case 'SetUserBirthday':
                        await setData(`userdata/${body.User}/birthday`, body.Day);
                        value = { success: true };
                        break;

                    // ===== SERVERS =====
                    case 'GetGuildConfig':
                        value = await getData(`serverdata/${body.Guild}/config`) ?? {};
                        break;

                    case 'SetGuildConfig':
                        await setData(`serverdata/${body.Guild}/config/${body.Key}`, body.Val);
                        value = { success: true };
                        break;

                    case 'DelGuildConfig':
                        await removeData(`serverdata/${body.Guild}/config`);
                        value = { deleted: true };
                        break;

                    case 'GetGuildData':
                        value = await getData(`serverdata/${body.Guild}/data`) ?? {};
                        break;

                    case 'SetGuildData':
                        await setData(`serverdata/${body.Guild}/data/${body.Key}`, body.Val);
                        value = { success: true };
                        break;

                    case 'DelGuildData':
                        await removeData(`serverdata/${body.Guild}/data`);
                        value = { deleted: true };
                        break;

                    case 'GetGuildSubs':
                        value = await getData(`serverdata/${body.Guild}/subscriptions`) ?? [];
                        break;

                    case 'Guilds':
                        value = client.guilds?.cache?.map(g => ({
                            id: g.id,
                            name: g.name,
                            memberCount: g.memberCount || 0
                        })) || [];
                        break;

                    // ===== AUTH / MSG =====
                    case 'Login':
                        value = { auth: 'ok', issued: Date.now() };
                        break;

                    case 'Onboarding':
                    case 'Invite':
                    case 'MFA':
                    case 'Email':
                        value = { acknowledged: true, key };
                        break;

                    default:
                        value = { error: `Unknown IPC key: ${key}` };
                }
            }

            // Respond safely
            if (requestId) {
                process.send?.({ from: 'Bot', responseId: requestId, value });
            } else {
                process.send?.({ from: 'Bot', to: from, key, value });
            }
        } catch (err) {
            const rid = msg?.requestId;
            const errObj = { error: 'Internal IPC handler error', detail: err?.message || err };
            if (rid) process.send?.({ from: 'Bot', responseId: rid, value: errObj });
            log('Unhandled IPC error:', err);
        }
    });
}

log('NovaIPC Bridge active.');
