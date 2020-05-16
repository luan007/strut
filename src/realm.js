//make this simple
//realm = physical place in harddrive - LAZY

//for easier mgmt

var fs = require("fs");
var config = require("./config");
var disk = require("./lib/diskjson");
var path = require("path");
var realm_path = config.realm_path;

var realms = {};

function load_realm(realm_name, full_path, obj) {
    obj.config = disk.create(full_path, "config", {}, true).data;
    obj.vars = disk.create(full_path, "vars", {}, true).data;
    obj.state = 1;
}

function collect_realms() {
    realms = {}; //reload
    var r = fs.readdirSync(realm_path);
    r.forEach((v) => {
        realms[v] = {
            config: {},
            state: 0
        };
        try {
            load_realm(v, path.resolve(realm_path, v), realms[v]);
        }
        catch (e) {
            console.error("Error loading realm", v);
            console.error(e);
            realms[v].error = e;
        }
    });
}


module.exports.collect_realms = collect_realms;