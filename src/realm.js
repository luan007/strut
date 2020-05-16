//make this simple
//realm = physical place in harddrive - LAZY

//for easier mgmt

var fs = require("fs");
var config = require("./config");
var path = require("path");
var realm_path = config.realm_path;

var realms = {};

function collect_realms() {
    realms = {}; //reload
    var r = fs.readdirSync(realm_path);
    r.forEach((v) => {
        realms[v] = {
            config: fs.readFileSync(realm_path)
        };
    });
}


module.exports.collect_realms = collect_realms;