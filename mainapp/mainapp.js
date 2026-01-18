const os = require("node:os");
const path = require("path");
const { fork, spawn, execSync } = require("child_process");
const cfg = require('../settings.json');
require("dotenv").config();
require('./sentry');
const fs = require("fs");
const axios = require("axios");
const ipchelper = require('./ipchelper');

// --- Service Definitions ---
// Use "fork" for modules that need IPC / persistent communication
// Use "spawn" for one-off or setup scripts
const services = {
    statusAPI: { path: "./StatusAPI.js", mode: "fork" },
    publishCmds: { path: "./publish-cmds.js", mode: "spawn" },
    novaAPI: { path: "./novaAPImngr.js", mode: "fork" },
    initClasses: { path: "./initclasses.js", mode: "spawn" },
    shardMngr: { path: "./shardmngr.js", mode: "fork" },
    cloudflareinit: { path: "./cloudflareinit.js", mode: "spawn" },
    argsmngr: { path: "./launchargs.js", mode: "fork" }
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
        if (["shardMngr", "statusAPI"].includes(name)) {
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

// Listen for routed messages targeted to mainapp
// NOTE: mainapp should NOT attempt to aggregate/answer GuildCount/etc. ipchelper now routes those to shardmngr.
// Keep mainapp handler minimal to avoid responding to aggregate requests.
ipchelper.on('message', ({ from, msg }) => {
    // simple logging and any mainapp-specific non-request handling
    const { key, value, requestId } = msg;
    if (requestId) {
        // do not answer aggregate requests here; ipchelper routes them to shardmngr
        console.log(`[mainapp:IPC] Request received from ${from} (requestId=${requestId}, key=${key}) - delegated to ipchelper/shardmngr.`);
        return;
    }

    // handle non-request messages as needed
    console.log(`[mainapp:IPC] Message routed to mainapp from ${from}:`, msg);
});

// --- Version Check ---
async function checkLatestVersion() {
    if (!cfg.check_latest_version) {
        console.log("[mainapp] Version check is disabled in settings.");
        return;
    }

    let localCommitMsg = "";
    try {
        localCommitMsg = execSync("git log -1 --pretty=%s", { cwd: path.join(__dirname, "..") }).toString().trim();
        console.log(`[mainapp] Local commit message: "${localCommitMsg}"`);
    } catch (err) {
        console.warn("[mainapp] Could not get local git commit message:", err.message);
        return;
    }

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

    // Extract version numbers from commit messages like "NovaV2 1.1.38 - ..."
    function extractVersion(msg) {
        const match = msg.match(/NovaV2\s+(\d+\.\d+\.\d+)/);
        return match ? match[1] : null;
    }

    const localVersion = extractVersion(localCommitMsg);
    const remoteVersion = extractVersion(remoteCommitMsg);

    function compareVersions(a, b) {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const na = pa[i] || 0, nb = pb[i] || 0;
            if (na > nb) return 1;
            if (na < nb) return -1;
        }
        return 0;
    }

    if (localVersion && remoteVersion) {
        if (compareVersions(localVersion, remoteVersion) < 0) {
            process.emitWarning(
                `[mainapp] Deprecation warning: Your local version (${localVersion}) is behind the latest remote version (${remoteVersion}). Please update your branch.`,
                'DeprecationWarning'
            );
        } else {
            console.log("[mainapp] Local version is up to date or ahead of remote. Version check passed.");
        }
    } else {
        if (localCommitMsg !== remoteCommitMsg) {
            console.log("[mainapp] Commit messages differ, but version could not be compared.");
        } else {
            console.log("[mainapp] Local commit matches the latest remote commit. Version check passed.");
        }
    }
}

// --- Main Runner ---
(async () => {
    console.log(`[mainapp] Starting Nova on ${os.hostname()} | PID ${process.pid}`);

    await checkLatestVersion();

    // Launch all defined services
    for (const [name, config] of Object.entries(services)) {
        launch(name, config);
    }

    // Example: periodically send updates to novaAPI
    setInterval(() => {
        send("novaAPI", "Heartbeat", { time: Date.now() });
    }, 2700000);
})();
