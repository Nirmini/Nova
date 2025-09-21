const os = require("node:os");
const path = require("path");
const { spawn, execSync } = require("child_process");
const cfg = require('../settings.json');
require("dotenv").config();

const fs = require("fs");
const axios = require("axios");

const services = {
    statusAPI: "./StatusAPI.js",
    publishCmds: "./publish-cmds.js",
    novaAPI: "./novaAPImngr.js",
    initClasses: "./initclasses.js",
    shardMngr: "./shardmngr.js",
    cloudflareinit: "./cloudflareinit.js"
};

function launch(name, filePath) {
    const absPath = path.join(__dirname, filePath);
    console.log(`[mainapp] Launching ${name} (${absPath})...`);

    const proc = spawn("node", [absPath], {
        stdio: "inherit",
        env: { ...process.env, SERVICE_NAME: name }
    });

    proc.on("exit", code => {
        console.warn(`[mainapp] ${name} exited with code ${code}`);
        if (name == "shardMngr" || name == "statusAPI" && false) {
            process.exit(1);
        }
    });

    return proc;
}

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
        const res = await axios.get("https://api.github.com/repos/Nirmini/Nova/commits?sha=master&per_page=1", {
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
        // Fallback to commit message string comparison if version extraction fails
        if (localCommitMsg !== remoteCommitMsg) {
            console.log("[mainapp] Commit messages differ, but version could not be compared.");
        } else {
            console.log("[mainapp] Local commit matches the latest remote commit. Version check passed.");
        }
    }
}

(async () => {
    console.log(`[mainapp] Starting Nova on ${os.hostname()} | PID ${process.pid}`);

    await checkLatestVersion();

    for (const [name, path] of Object.entries(services)) {
        launch(name, path);
    }
})();
