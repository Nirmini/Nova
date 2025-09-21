const fs = require('fs');
const path = require('path');
const { getGuildConfig, setGuildConfig, setGuildData } = require('./Database');

const appDataPath = path.join(__dirname, '../appdata.json');

function readAppData() {
  try {
    return JSON.parse(fs.readFileSync(appDataPath, 'utf-8'));
  } catch (err) {
    console.error('Error reading appdata.json:', err);
    throw new Error('appdata.json is missing or invalid. Cannot continue.');
  }
}

function writeAppData(data) {
  try {
    fs.writeFileSync(appDataPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing appdata.json:', err);
  }
}

async function initGuild(guild, settings) {
  const existingConfig = await getGuildConfig(guild.id);
  if (existingConfig) {
    if (settings.extendedlogs) console.log(`Config already exists for ${guild.name} (${guild.id}).`);
    return;
  }

  console.log(`No config found for ${guild.name}. Creating new GS3 & GD3 entries...`);

  // Sync w/ the appdata
  const appData = readAppData();

  if (
    !appData.guilddata ||
    typeof appData.guilddata.lastNirmini !== 'number' ||
    typeof appData.guilddata.lastNovaworks !== 'number'
  ) {
    throw new Error('appdata.json is missing required guilddata.lastNirmini/lastNovaworks values.');
  }

  const newNirminiID = appData.guilddata.lastNirmini + 1;
  const newNovaworksID = appData.guilddata.lastNovaworks + 3;

  // Persist the increments
  appData.guilddata.lastNirmini = newNirminiID;
  appData.guilddata.lastNovaworks = newNovaworksID;
  writeAppData(appData);

  // Build GS3 config
  const newGuildConfig = {
    "%GroupName": guild.name,
    "%GuildName": guild.name,
    "%GuildId": guild.id,
    "%NirminiID": String(newNirminiID),
    "%NovaworksId": String(newNovaworksID),
    "%format": "NovaGS3",
    "%BlacklistedGuild": false,
    "commandconfigs": {},
    "roblox": { "sync_moderation": false },
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
    "commands": {},
    "modules": {},
    "commanddata": {},
    "customcmds": [],
    "autoreplies": [],
    "guildforms": [],
    "caseconfig": {
      "%enabled": true,
      "logchannel": ""
    },
    "ticketconfig": {
      "enabled": false,
      "logchannel": "",
      "confirm_close": true,
      "anonymise_respones": false,
      "use_threads": false,
      "autoclose_config": {
        "enabled": false,
        "since_open_without_response": null,
        "since_last_message": null,
        "on_user_leave": true
      },
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
        "logchannel": "",
        "exemptroles": [],
        "exemptchannels": [],
        "focusedroles": [],
        "focusedchannels": []
      }
    }
  };

  // Build GD3 data
  const newGuildData = {
    "cases": [],
    "ticketdata": {
      "tickets": [],
      "ticket-archives": []
    },
    "ranks": [
      { "rankid": 1, "connectedroleid": null, "hoistedpermsrole": false }
    ]
  };

  // Save config & data
  await setGuildConfig(guild.id, newGuildConfig);
  await setGuildData(guild.id, newGuildData);

  if (settings.extendedlogs) {
    console.log(
      `New GS3 & GD3 created for ${guild.name} (${guild.id}) with NirminiID ${newNirminiID} and NovaworksID ${newNovaworksID}.`
    );
  }
}

module.exports = { initGuild };
