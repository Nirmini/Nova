const os = require("node:os");
const path = require("path");
const { fork, spawn, execSync } = require("child_process");
const cron = require("node-cron");
const cfg = require('../settings.json');
require("dotenv").config();
require('./sentry');
require('./errorhandling');
const fs = require("fs");
const axios = require("axios");
const ipchelper = require('./ipchelper');

// --- Service Definitions ---
// Use "fork" for modules that need IPC / persistent communication
// Use "spawn" for one-off or setup scripts
const services = {
    statusAPI:      { path: "./StatusAPI.js",       mode: "fork"  },
    publishCmds:    { path: "./publish-cmds.js",    mode: "spawn" },
    novaAPI:        { path: "./novaAPImngr.js",      mode: "fork"  },
    shardMngr:      { path: "./shardmngr.js",        mode: "fork"  },
    cloudflareinit: { path: "./cloudflareinit.js",   mode: "spawn" },
    argsmngr:       { path: "./launchargs.js",       mode: "fork"  }
};

// --- IPC Registry ---
const processes = {}; // name → process ref

// --- Launch Function ---
function launch(name, { path: filePath, mode }) {
    const absPath = path.join(__dirname, filePath);
    console.log(`[mainapp] Launching ${name} (${absPath}) [mode=${mode}]...`);

    let proc;

    if (mode === "fork") {
        proc = fork(absPath, {
            env: { ...process.env, SERVICE_NAME: name },
            stdio: ['inherit', 'inherit', 'inherit', 'ipc'] // enable IPC
        });

        processes[name] = proc;

        // Register with centralized ipchelper
        try {
            ipchelper.registerProcess(name, proc);
            console.log(`[mainapp] Registered ${name} with ipchelper`);
        } catch (err) {
            console.warn(`[mainapp] Failed to register ${name} with ipchelper: ${err.message}`);
        }
    } else {
        proc = spawn("node", [absPath], {
            stdio: "inherit",
            env: { ...process.env, SERVICE_NAME: name }
        });
        processes[name] = proc;
    }

    proc.on("exit", code => {
        console.warn(`[mainapp] ${name} exited with code ${code}`);
        delete processes[name];
        // ensure ipchelper cleans up too
        try { ipchelper.unregisterProcess(name); } catch {}
        // shardMngr is excluded here — a scheduled or manual restart should not bring down mainapp
        if (["statusAPI"].includes(name)) {
            console.warn(`[mainapp] Critical service ${name} exited. Shutting down...`);
            process.exit(1);
        }
    });

    return proc;
}

// Helper to send IPC to a process via ipchelper
function send(to, key, value) {
    try {
        ipchelper.send(to, { key, value, from: 'mainapp' });
    } catch (err) {
        console.warn(`[mainapp:IPC] Failed to send to ${to}: ${err.message}`);
    }
}

// --- Scheduled ShardMngr Restart ---
const MIN_RESTART_MS = 5 * 60 * 1000; // 5 minutes

function parseRestartDelay() {
    const d = cfg?.mainapplibrary?.restartdelay;
    if (!d) return null;

    // All values must be non-negative integers — decimals are not accepted
    for (const field of ['days', 'hours', 'minutes', 'seconds']) {
        const val = d[field];
        if (val !== undefined && (!Number.isInteger(val) || val < 0)) {
            process.emitWarning(
                `[mainapp] restartdelay.${field} must be a non-negative integer — ignoring scheduled restart.`,
                'ConfigWarning'
            );
            return null;
        }
    }

    return (
        ((d.days    || 0) * 24 * 60 * 60 * 1000) +
        ((d.hours   || 0) *      60 * 60 * 1000) +
        ((d.minutes || 0) *           60 * 1000) +
        ((d.seconds || 0) *                1000)
    );
}

function msToCronExpression(totalMs) {
    const totalSeconds = Math.floor(totalMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours   = Math.floor(totalMinutes / 60);
    const totalDays    = Math.floor(totalHours   / 24);

    if (totalSeconds < 60)  return `*/${totalSeconds} * * * * *`;
    if (totalMinutes < 60)  return `0 */${totalMinutes} * * * *`;
    if (totalHours   < 24)  return `0 0 */${totalHours} * * *`;
    return                         `0 0 0 */${totalDays} * *`;
}

function scheduleShardRestart() {
    const totalMs = parseRestartDelay();

    if (totalMs === null) {
        console.log('[mainapp] No valid restartdelay configured — scheduled shard restart disabled.');
        return;
    }

    if (totalMs < MIN_RESTART_MS) {
        process.emitWarning(
            `[mainapp] restartdelay resolves to ${totalMs}ms which is under 5 minutes — scheduled restart ignored.`,
            'ConfigWarning'
        );
        return;
    }

    const expression = msToCronExpression(totalMs);

    if (!cron.validate(expression)) {
        process.emitWarning(
            `[mainapp] Generated cron expression "${expression}" is invalid — scheduled restart disabled.`,
            'ConfigWarning'
        );
        return;
    }

    console.log(`[mainapp] Scheduled shardMngr restart active (every ${totalMs / 1000}s, cron: "${expression}")`);

    cron.schedule(expression, async () => {
        console.warn('[mainapp] Scheduled shardMngr restart triggered.');

        // Check connectivity before restarting — exit with code 5 if internet is unavailable
        await checkConnectivity();

        // Kill shardMngr and all sub-processes via process group
        if (processes['shardMngr']) {
            try {
                // Negative PID targets the entire process group spawned under shardMngr
                process.kill(-processes['shardMngr'].pid, 'SIGTERM');
                console.warn('[mainapp] Sent SIGTERM to shardMngr process group.');
            } catch (err) {
                console.warn(`[mainapp] Failed to kill shardMngr process group: ${err.message} — falling back to direct kill.`);
                try {
                    processes['shardMngr'].kill();
                } catch (innerErr) {
                    console.warn(`[mainapp] Direct kill also failed: ${innerErr.message}`);
                }
            }
        } else {
            console.warn('[mainapp] shardMngr process not found — may have already exited.');
        }

        // Brief delay to allow process group to fully terminate before relaunching
        setTimeout(() => {
            console.log('[mainapp] Relaunching shardMngr after scheduled restart...');
            launch('shardMngr', services['shardMngr']);
        }, 2000);
    });
}

// Listen for routed messages targeted to mainapp
// NOTE: mainapp should NOT attempt to aggregate/answer GuildCount/etc. ipchelper now routes those to shardmngr.
// Keep mainapp handler minimal to avoid responding to aggregate requests.
ipchelper.on('message', ({ from, msg }) => {
    const { key, value, requestId } = msg;

    if (requestId) {
        // do not answer aggregate requests here; ipchelper routes them to shardmngr
        console.log(`[mainapp:IPC] Request received from ${from} (requestId=${requestId}, key=${key}) - delegated to ipchelper/shardmngr.`);
        return;
    }

    // Handle restart requests from errorhandling.js running inside a child service
    if (key === 'restartService') {
        const { name, reason } = value;
        const serviceDef = services[name];
        if (!serviceDef) {
            console.warn(`[mainapp:IPC] Restart requested for unknown service "${name}" — ignoring.`);
            return;
        }
        console.warn(`[mainapp:IPC] Restart requested for "${name}" by errorhandler (reason: ${reason}).`);
        if (processes[name]) {
            try {
                processes[name].kill();
            } catch (err) {
                console.warn(`[mainapp:IPC] Failed to kill "${name}" before restart: ${err.message}`);
            }
        }
        launch(name, serviceDef);
        return;
    }

    // handle non-request messages as needed
    console.log(`[mainapp:IPC] Message routed to mainapp from ${from}:`, msg);
});

// --- Connectivity Check ---
async function checkConnectivity() {
    const PING_TIMEOUT_MS = 10000; // 10 seconds

    try {
        await axios.get("https://clients3.google.com/generate_204", {
            timeout: PING_TIMEOUT_MS,
            validateStatus: status => status === 204
        });
        console.log("[mainapp] Connectivity check passed.");
    } catch (err) {
        console.error(`[mainapp] Connectivity check failed — no response from Google within ${PING_TIMEOUT_MS / 1000}s: ${err.message}`);
        console.error("[mainapp] Exiting due to loss of internet connectivity.");
        process.exit(5);
    }
}

// --- Version Check ---
async function checkLatestVersion() {
    if (!cfg.check_latest_version) {
        console.log("[mainapp] Version check is disabled in settings.");
        return;
    }

    // Check for uncommitted local changes — if present, skip version enforcement
    let hasUncommittedChanges = false;
    try {
        const status = execSync("git status --porcelain", { cwd: path.join(__dirname, "..") }).toString().trim();
        hasUncommittedChanges = status.length > 0;
        if (hasUncommittedChanges) {
            console.log("[mainapp] Uncommitted local changes detected — skipping version enforcement.");
        }
    } catch (err) {
        console.warn("[mainapp] Could not check git status:", err.message);
    }

    // Read local commit message
    let localCommitMsg = "";
    try {
        localCommitMsg = execSync("git log -1 --pretty=%s", { cwd: path.join(__dirname, "..") }).toString().trim();
        console.log(`[mainapp] Local commit message: "${localCommitMsg}"`);
    } catch (err) {
        console.warn("[mainapp] Could not get local git commit message:", err.message);
        return;
    }

    // Read remote commit message
    let remoteCommitMsg = "";
    try {
        console.log("[mainapp] Checking latest commit on remote (GitHub master branch)...");
        const res = await axios.get("https://api.github.com/repos/Nirmini/NovaBot-Dev/commits?sha=master&per_page=1", {
            headers: { Authorization: `token ${process.env.GITHB_VERTKN || ""}` }
        });
        if (Array.isArray(res.data) && res.data.length > 0) {
            remoteCommitMsg = res.data[0].commit.message.trim();
            console.log(`[mainapp] Remote commit message: "${remoteCommitMsg}"`);
        } else {
            throw new Error("No commits found in response.");
        }
    } catch (err) {
        console.warn("[mainapp] Could not fetch latest dev commit info from GitHub.", err.response?.status, err.response?.data || err.message);
        return;
    }

    // Extract version from "Nova 2.1.2.247 - Description" format
    function extractVersion(msg) {
        const match = msg.match(/^Nova\s+(\d+\.\d+\.\d+\.\d+)/i);
        return match ? match[1] : null;
    }

    const localVersion  = extractVersion(localCommitMsg);
    const remoteVersion = extractVersion(remoteCommitMsg);

    // If either version string is unrecognisable, skip enforcement
    if (!localVersion) {
        console.warn(`[mainapp] Local commit message does not match expected version format — skipping version check. ("${localCommitMsg}")`);
        return;
    }
    if (!remoteVersion) {
        console.warn(`[mainapp] Remote commit message does not match expected version format — skipping version check. ("${remoteCommitMsg}")`);
        return;
    }

    // Compare four-part versions numerically
    function compareVersions(a, b) {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const na = pa[i] || 0;
            const nb = pb[i] || 0;
            if (na > nb) return  1;
            if (na < nb) return -1;
        }
        return 0;
    }

    const cmp = compareVersions(localVersion, remoteVersion);

    if (cmp < 0) {
        // Local is behind remote
        if (hasUncommittedChanges) {
            console.log(`[mainapp] Local version (${localVersion}) is behind remote (${remoteVersion}), but uncommitted changes are present — allowing startup.`);
        } else {
            process.emitWarning(
                `[mainapp] Deprecation warning: Your local version (${localVersion}) is behind the latest remote version (${remoteVersion}). Please update your branch.`,
                'DeprecationWarning'
            );
            console.error("[mainapp] Refusing to start: local version is outdated and no uncommitted changes were found. Update to the latest version and try again.");
            console.warn("[mainapp] The local version is outdated and could potentially have bugs and security vulnerabilities present. Please update to continue using Nova.")
            process.exit(3) // This is only called for out-of-date software within Nova, do NOT use it for anything else.
        }
    } else if (cmp === 0) {
        console.log(`[mainapp] Version check passed — local matches remote (${localVersion}).`);
    } else {
        console.log(`[mainapp] Local version (${localVersion}) is ahead of remote (${remoteVersion}) — proceeding.`);
    }
}

// --- Main Runner ---
(async () => {
    console.log(`[mainapp] Starting Nova on ${os.hostname()} | PID ${process.pid}`);

    await checkConnectivity();

    await checkLatestVersion();

    // Launch all defined services
    for (const [name, config] of Object.entries(services)) {
        launch(name, config);
    }

    // Schedule automatic shardMngr restart per settings.mainapplibrary.restartdelay
    scheduleShardRestart();

    // Periodically send heartbeat to novaAPI
    setInterval(() => {
        send("novaAPI", "Heartbeat", { time: Date.now() });
    }, 2700000);
})();