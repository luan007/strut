var cfg = require("../server-config.json");
var path = require("path");

for (var i in cfg) {
    if (i.endsWith("_path")) {
        cfg[i] = path.resolve(path.resolve(__dirname, "../"), cfg[i]);
    }
    console.log("cfg -", i, cfg[i]);
}

module.exports = cfg;