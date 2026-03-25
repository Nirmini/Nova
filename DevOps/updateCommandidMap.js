const fs = require("node:fs");
const path = require('node:path');
const CmdIdMap = fs.readFileSync(path.join(__dirname,"../src/CommandIDs.js"));

// ToDo Later