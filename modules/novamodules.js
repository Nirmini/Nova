const path = require('path');
const fs = require('fs');

(function autoloadModules() {
    const modulesDir = __dirname;
    const thisFile = path.basename(__filename).toLowerCase();
    fs.readdirSync(modulesDir).forEach(file => {
        if (
            file.endsWith('.js') &&
            file.toLowerCase() !== thisFile
        ) {
            require(path.join(modulesDir, file));
        }
    });
})();