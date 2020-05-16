//make this simple
//realm = physical place in harddrive - LAZY

//for easier mgmt

var fs = require("fs");
var config = require("./config");
var diskjson = require("./lib/diskjson");
var path = require("path");
var realm_path = config.realm_path;
var realms = {};

function setup_services_env(realm_name, full_path, service) {
    var srv_path = path.resolve(full_path, service);
    var data_path = path.resolve(srv_path, "data");
    if (!fs.existsSync(srv_path)) {
        fs.mkdirSync(srv_path);
    }
    if (!fs.existsSync(data_path)) {
        fs.mkdirSync(data_path);
    }
    var fin = {
        path: srv_path,
        data_path: data_path,
        config: diskjson.create(srv_path,  "config", {}, true).data,
        vars: diskjson.create(srv_path, "vars", {}, true).data
    };
    return fin;
}

function load_realm(realm_name, full_path, obj) {
    obj.config = diskjson.create(full_path, "config", {}, true).data;
    obj.global_vars = diskjson.create(full_path, "global_vars", {}, true).data;
    obj.service_data = {};
    for (var i in obj.config.services) {
        obj.service_data[i] = setup_services_env(realm_name, full_path, i);
    }
    obj.state = 1;
    console.log("realm", realm_name, "loaded")
}

function collect_realms() {
    var r = fs.readdirSync(realm_path);
    r.forEach((v) => {
        realms[v] = realms[v] || {
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
module.exports.realms = realms;