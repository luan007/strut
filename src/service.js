var fs = require("fs");
var config = require("./config");
var path = require("path");
var diskjson = require("./lib/diskjson")
var service_path = config.service_path;

var services = {
};

var subprograms = {
};

var mounts = {};

function mount(alias, srv) {
    mounts[alias] = srv;
}

function load_service(service_name, full_path, obj) {
    obj.config = diskjson.create(full_path, "config", {}, true, true).data;
    obj.config.mounts = obj.config.mounts || [];
    obj.state = 1;
    console.log("srv", service_name, "loaded");
    //actually load the thing

    mount(service_name, service_name);
    obj.config.mounts.forEach((v => {
        mount(v, service_name);
    }));

    subprograms[service_name] = require(path.resolve(full_path, "entry.js"));;
}


function collect_services() {
    var r = fs.readdirSync(service_path);
    r.forEach((v) => {
        services[v] = services[v] || {
            config: {},
            state: 0,
            name: v
        };
        try {
            load_service(v, path.resolve(service_path, v), services[v]);
        }
        catch (e) {
            console.error("Error loading service", v);
            console.error(e);
            services[v].error = e;
        }
    });
}


module.exports.collect_services = collect_services;
module.exports.services = services;
module.exports.mounts = mounts;
module.exports.subprograms = subprograms;

