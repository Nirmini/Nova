const os = require("node:os");
const path = require("path");
const { spawn } = require("child_process");

require("dotenv").config();

const services = {
    statusAPI: "./StatusAPI.js",
    publishCmds: "./publish-cmds.js",
    novaAPI: "./novaAPImngr.js",
    initClasses: "./initclasses.js",
    shardMngr: "./shardmngr.js"
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

(async () => {
    console.log(`[mainapp] Starting Nova on ${os.hostname()} | PID ${process.pid}`);

    for (const [name, path] of Object.entries(services)) {
        launch(name, path);
    }

    // Shards will be started by `shardstarter.js` AFTER StatusAPI confirms readiness
})();
