var cfg = require("../server-config.json");

for (var i in cfg) {
    if (i.endsWith("_path")) {
        cfg[i] = require("path").resolve(__dirname, "../", cfg[i]);
    }
    console.log("cfg -", i, cfg[i]);
}

module.exports = cfg;