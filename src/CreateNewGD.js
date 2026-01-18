const fs = require('fs');
const path = require('path');
const { getGuildConfig, setGuildConfig, setGuildData, updateNirminiId, updateNovaworksId } = require('./Database');
const settings = require('../settings.json');
require('../mainapp/sentry');

async function initGuild(guild) {
  // Lets not overwrite existing data
  const existingConfig = await getGuildConfig(guild.id);
  if (existingConfig && Object.keys(existingConfig).length > 0) {
    console.log(existingConfig);
    if (settings.extended_logs) {
      console.log(`Config already exists for ${guild.name} (${guild.id}).`);
    }
    return;
  }

  console.log(`No config found for ${guild.name}. Creating new GS3 & GD3 entries...`);

  // Get new IDs from the global counter system
  const newNirminiID = await updateNirminiId();
  const newNovaworksID = await updateNovaworksId();

  // GS3 Config Build (following NovaGS3 format)
  const newGuildConfig = {
    "%GroupName": guild.name,
    "%GuildName": guild.name,
    "%GuildId": guild.id,
    "%NirminiID": String(newNirminiID),
    "%NovaworksId": String(newNovaworksID),
    "%format": "NovaGS3",
    "%BlacklistedGuild": false,
    "commandconfigs": {},
    "roblox": {
      "sync_moderation": false,
      "Rank_API_Token": "",
      "auto_verify": false,
      "verify_username": "default"
    },
    "Binds": [],
    "disabledcommands": [],
    "rbxgroup": "0",
    "reports": {
      "enabled": false,
      "reports_fallback_channel": "",
      "slashcomamnd_reports_enabled": false,
      "slashcomamnd_reports_channel": "",
      "contextmenu_reports_enabled": false,
      "contextmenu_reports_channel": "",
      "tickets_reports_enabled": false,
      "tickets_reports_channel": "",
      "type": "primary"
    },
    "bancfg": {
      "first_appeal": 30,
      "second_appeal": 40,
      "other_appeals": 45,
      "dm_notification": {
        "embed_title": "default",
        "embed_description": "default"
      }
    },
    "rankconfig": { "enabled": true },
    "commands": {
      "admin": {
        "enabled": true,
        "hidden": true,
        "commands": [
          { "CommandId": "1000001", "CommandName": "devrun", "CommandEnabled": true },
          { "CommandId": "1000002", "CommandName": "testembed", "CommandEnabled": true },
          { "CommandId": "1000003", "CommandName": "format", "CommandEnabled": true },
          { "CommandId": "1000004", "CommandName": "join", "CommandEnabled": true },
          { "CommandId": "1000005", "CommandName": "leave", "CommandEnabled": true },
          { "CommandId": "1000006", "CommandName": "msg", "CommandEnabled": true },
          { "CommandId": "1000007", "CommandName": "sc2msg", "CommandEnabled": true },
          { "CommandId": "1000008", "CommandName": "serverconfig", "CommandEnabled": true },
          { "CommandId": "1000009", "CommandName": "sysmsg", "CommandEnabled": true },
          { "CommandId": "1000010", "CommandName": "test", "CommandEnabled": true }
        ]
      },
      "core": {
        "enabled": true,
        "hidden": false,
        "commands": [
          { "CommandId": "2000001", "CommandName": "about", "CommandEnabled": true },
          { "CommandId": "2000002", "CommandName": "anommsg", "CommandEnabled": true },
          { "CommandId": "2000003", "CommandName": "birthday", "CommandEnabled": true },
          { "CommandId": "2000004", "CommandName": "bug", "CommandEnabled": true },
          { "CommandId": "2000005", "CommandName": "commands", "CommandEnabled": true },
          { "CommandId": "2000006", "CommandName": "commit", "CommandEnabled": true },
          { "CommandId": "2000007", "CommandName": "credits", "CommandEnabled": true },
          { "CommandId": "2000008", "CommandName": "serverinfo", "CommandEnabled": true },
          { "CommandId": "2000009", "CommandName": "help", "CommandEnabled": true },
          { "CommandId": "2000010", "CommandName": "info", "CommandEnabled": true },
          { "CommandId": "2000011", "CommandName": "members", "CommandEnabled": true },
          { "CommandId": "2000012", "CommandName": "modules", "CommandEnabled": true },
          { "CommandId": "2000013", "CommandName": "ping", "CommandEnabled": true },
          { "CommandId": "2000014", "CommandName": "premium", "CommandEnabled": true },
          { "CommandId": "2000015", "CommandName": "remind", "CommandEnabled": true },
          { "CommandId": "2000016", "CommandName": "report", "CommandEnabled": true },
          { "CommandId": "2000017", "CommandName": "settings", "CommandEnabled": true },
          { "CommandId": "2000018", "CommandName": "setup", "CommandEnabled": true },
          { "CommandId": "2000019", "CommandName": "status", "CommandEnabled": true },
          { "CommandId": "2000020", "CommandName": "subscribe", "CommandEnabled": true },
          { "CommandId": "2000021", "CommandName": "wiki", "CommandEnabled": true }
        ]
      },
      "events": {
        "enabled": true,
        "hidden": false,
        "commands": [
          { "CommandId": "3000001", "CommandName": "eval", "CommandEnabled": true },
          { "CommandId": "3000002", "CommandName": "seval", "CommandEnabled": true },
          { "CommandId": "3000003", "CommandName": "stryout", "CommandEnabled": true },
          { "CommandId": "3000004", "CommandName": "tryout", "CommandEnabled": true }
        ]
      },
      "fun": {
        "enabled": true,
        "hidden": false,
        "commands": [
          { "CommandId": "4000001", "CommandName": "cat", "CommandEnabled": true },
          { "CommandId": "4000002", "CommandName": "coin", "CommandEnabled": true },
          { "CommandId": "4000003", "CommandName": "dice", "CommandEnabled": true },
          { "CommandId": "4000004", "CommandName": "dog", "CommandEnabled": true },
          { "CommandId": "4000005", "CommandName": "mcstats", "CommandEnabled": true },
          { "CommandId": "4000006", "CommandName": "rgroup", "CommandEnabled": true },
          { "CommandId": "4000007", "CommandName": "robloxstats", "CommandEnabled": true },
          { "CommandId": "4000008", "CommandName": "rps", "CommandEnabled": true },
          { "CommandId": "4000009", "CommandName": "scp", "CommandEnabled": true }
        ]
      },
      "misc": {
        "enabled": true,
        "hidden": false,
        "commands": [
          { "CommandId": "5000001", "CommandName": "afk", "CommandEnabled": true },
          { "CommandId": "5000002", "CommandName": "announce", "CommandEnabled": true },
          { "CommandId": "5000003", "CommandName": "github", "CommandEnabled": true },
          { "CommandId": "5000004", "CommandName": "itunes", "CommandEnabled": true },
          { "CommandId": "5000005", "CommandName": "nick", "CommandEnabled": true },
          { "CommandId": "5000006", "CommandName": "purge", "CommandEnabled": true },
          { "CommandId": "5000007", "CommandName": "roleinfo", "CommandEnabled": true },
          { "CommandId": "5000008", "CommandName": "roles", "CommandEnabled": true },
          { "CommandId": "5000009", "CommandName": "spotify", "CommandEnabled": true },
          { "CommandId": "5000010", "CommandName": "uptime", "CommandEnabled": true },
          { "CommandId": "5000011", "CommandName": "vexstats", "CommandEnabled": true },
          { "CommandId": "5000012", "CommandName": "whois", "CommandEnabled": true },
          { "CommandId": "5000013", "CommandName": "yt", "CommandEnabled": true }
        ]
      },
      "moderation": {
        "enabled": true,
        "hidden": false,
        "commands": [
          { "CommandId": "6000001", "CommandName": "ban", "CommandEnabled": true },
          { "CommandId": "6000002", "CommandName": "deafen", "CommandEnabled": true },
          { "CommandId": "6000003", "CommandName": "delwarn", "CommandEnabled": true },
          { "CommandId": "6000004", "CommandName": "kick", "CommandEnabled": true },
          { "CommandId": "6000005", "CommandName": "lock", "CommandEnabled": true },
          { "CommandId": "6000006", "CommandName": "lockdown", "CommandEnabled": true },
          { "CommandId": "6000007", "CommandName": "masslock", "CommandEnabled": true },
          { "CommandId": "6000008", "CommandName": "massunlock", "CommandEnabled": true },
          { "CommandId": "6000009", "CommandName": "mod", "CommandEnabled": true },
          { "CommandId": "6000010", "CommandName": "modstaff", "CommandEnabled": true },
          { "CommandId": "6000011", "CommandName": "move", "CommandEnabled": true },
          { "CommandId": "6000012", "CommandName": "mute", "CommandEnabled": true },
          { "CommandId": "6000013", "CommandName": "note", "CommandEnabled": true },
          { "CommandId": "6000014", "CommandName": "role", "CommandEnabled": true },
          { "CommandId": "6000015", "CommandName": "sban", "CommandEnabled": true },
          { "CommandId": "6000016", "CommandName": "smode", "CommandEnabled": true },
          { "CommandId": "6000017", "CommandName": "snick", "CommandEnabled": true },
          { "CommandId": "6000018", "CommandName": "tban", "CommandEnabled": true },
          { "CommandId": "6000019", "CommandName": "ticket", "CommandEnabled": true },
          { "CommandId": "6000020", "CommandName": "ticketpanel", "CommandEnabled": true },
          { "CommandId": "6000021", "CommandName": "unban", "CommandEnabled": true },
          { "CommandId": "6000022", "CommandName": "unlock", "CommandEnabled": true },
          { "CommandId": "6000023", "CommandName": "warn", "CommandEnabled": true },
          { "CommandId": "6000024", "CommandName": "warnings", "CommandEnabled": true }
        ]
      },
      "modules": {
        "enabled": false,
        "hidden": false,
        "commands": [
          { "CommandId": "7000001", "CommandName": "announcement", "CommandEnabled": false },
          { "CommandId": "7000002", "CommandName": "automod", "CommandEnabled": false },
          { "CommandId": "7000003", "CommandName": "embedcreator", "CommandEnabled": false },
          { "CommandId": "7000004", "CommandName": "forms", "CommandEnabled": false },
          { "CommandId": "7000005", "CommandName": "robloxgamemgmnt", "CommandEnabled": false },
          { "CommandId": "7000006", "CommandName": "robloxmoderate", "CommandEnabled": false },
          { "CommandId": "7000007", "CommandName": "robloxusermgmnt", "CommandEnabled": false },
          { "CommandId": "7000008", "CommandName": "slowmode", "CommandEnabled": false }
        ]
      },
      "roblox": {
        "enabled": true,
        "hidden": false,
        "commands": [
          { "CommandId": "8000001", "CommandName": "rbban", "CommandEnabled": true },
          { "CommandId": "8000002", "CommandName": "rbkick", "CommandEnabled": true },
          { "CommandId": "8000003", "CommandName": "rbrank", "CommandEnabled": true }
        ]
      },
      "usermanagement": {
        "enabled": true,
        "hidden": false,
        "commands": [
          { "CommandId": "9000001", "CommandName": "bind", "CommandEnabled": true },
          { "CommandId": "9000002", "CommandName": "binds", "CommandEnabled": true },
          { "CommandId": "9000003", "CommandName": "group", "CommandEnabled": true },
          { "CommandId": "9000004", "CommandName": "pinrole", "CommandEnabled": true },
          { "CommandId": "9000005", "CommandName": "rank", "CommandEnabled": true },
          { "CommandId": "9000006", "CommandName": "rankmanage", "CommandEnabled": true },
          { "CommandId": "9000007", "CommandName": "ranks", "CommandEnabled": true },
          { "CommandId": "9000008", "CommandName": "temprole", "CommandEnabled": true },
          { "CommandId": "9000009", "CommandName": "unpinrole", "CommandEnabled": true },
          { "CommandId": "9000010", "CommandName": "update", "CommandEnabled": true },
          { "CommandId": "9000011", "CommandName": "verify", "CommandEnabled": true }
        ]
      }
    },
    "modules": {
      "modules":[
        { "ModuleId": "00001", "ModuleName": "Announcements", "ModuleEnabled": true, "ModuleType": "Misc"},
        { "ModuleId": "00002", "ModuleName": "Automod", "ModuleEnabled": true, "ModuleType": "Moderation"},
        { "ModuleId": "00003", "ModuleName": "EmbedCreator", "ModuleEnabled": true, "ModuleType": "Misc"},
        { "ModuleId": "00004", "ModuleName": "Forms", "ModuleEnabled": true, "ModuleType": "Core"},
        { "ModuleId": "00005", "ModuleName": "RBGManagement", "ModuleEnabled": true, "ModuleType": "Moderation"},
        { "ModuleId": "00006", "ModuleName": "RBModerate", "ModuleEnabled": true, "ModuleType": "Moderation"},
        { "ModuleId": "00007", "ModuleName": "RBUManagement", "ModuleEnabled": true, "ModuleType": "Moderation"},
        { "ModuleId": "00008", "ModuleName": "Slowmode", "ModuleEnabled": true, "ModuleType": "Moderation"}
      ]
    },
    "commanddata": {
      "lockdown": { "channels": [] }
    },
    "customcmds": [],
    "autoreplies": [],
    "guildforms": [],
    "caseconfig": {
      "%enabled": true,
      "logchannel": ""
    },
    "ticketconfig": {
      "enabled": false,
      "atickets_enabled": false,
      "logchannel": "",
      "category_id": "",
      "closed_category": "",
      "confirm_close": true,
      "anonymise_respones": false,
      "use_threads": false,
      "autoclose_config": {
        "enabled": false,
        "since_open_without_response": null,
        "since_last_message": null,
        "on_user_leave": true
      },
      "include_roles": [],
      "guild_blacklist_roles": [],
      "autoclose_excluded": [],
      "channel_category": "",
      "claim_config": {
        "admins": { "can_view": true, "can_type": true },
        "mods": { "can_view": true, "can_type": true },
        "support": { "can_view": true, "can_type": false },
        "everyone": { "can_view": false, "can_type": false }
      }
    },
    "featuremodules": {
      "social": { "youtube": {}, "tiktok": {}, "github": {}, "twitch": {}, "steam": {} },
      "reactionroles": {},
      "actionlogs": {
        "enabled": false,
        "usecommonlogc": false,
        "logchannel": "",
        "modules": {
          "message_delete": { "enabled": false, "logchannel": null },
          "message_edit": { "enabled": false, "logchannel": null },
          "message_imgdel": { "enabled": false, "logchannel": null },
          "message_bulkdel": { "enabled": false, "logchannel": null },
          "message_invites": { "enabled": false, "logchannel": null },
          "message_modcmds": { "enabled": false, "logchannel": null },
          "members_join": { "enabled": false, "logchannel": null },
          "members_leave": { "enabled": false, "logchannel": null },
          "members_roleadd": { "enabled": false, "logchannel": null },
          "members_rolerem": { "enabled": false, "logchannel": null },
          "members_timeout": { "enabled": false, "logchannel": null },
          "members_nickchg": { "enabled": false, "logchannel": null },
          "members_banned": { "enabled": false, "logchannel": null },
          "members_unbaned": { "enabled": false, "logchannel": null },
          "role_create": { "enabled": false, "logchannel": null },
          "role_delete": { "enabled": false, "logchannel": null },
          "role_update": { "enabled": false, "logchannel": null },
          "chnnl_create": { "enabled": false, "logchannel": null },
          "chnnl_update": { "enabled": false, "logchannel": null },
          "chnnl_delete": { "enabled": false, "logchannel": null },
          "emoji_create": { "enabled": false, "logchannel": null },
          "emoji_update": { "enabled": false, "logchannel": null },
          "emoji_delete": { "enabled": false, "logchannel": null },
          "voice_join": { "enabled": false, "logchannel": null },
          "voice_leave": { "enabled": false, "logchannel": null },
          "voice_trans": { "enabled": false, "logchannel": null }
        },
        "exemptroles": [],
        "exemptchannels": [],
        "focusedroles": [],
        "focusedchannels": []
      }
    }
  };

  // Write GS3
  await setGuildConfig(guild.id, newGuildConfig);

  // Gradually fill GD3 with modern ticket format
  await setGuildData(guild.id, "cases", []);
  await setGuildData(guild.id, "ticketdata", {
    "tickets": [],
    "ticket-archives": [],
    "ticket_multipanels": [],
    "ticket_configs": []
  });
  await setGuildData(guild.id, "ranks", [
    { "rankid": 1, "connectedroleid": null, "hoistedpermsrole": false }
  ]);

  if (settings.extended_logs) {
    console.log(
      `New GS3 & GD3 created for ${guild.name} (${guild.id}) with NirminiID ${newNirminiID} and NovaworksID ${newNovaworksID}.`
    );
  }
}

module.exports = { initGuild };