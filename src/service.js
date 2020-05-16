var fs = require("fs");
var config = require("./config");
var path = require("path");
var diskjson = require("./lib/diskjson")
var service_path = config.service_path;

var services = {
    
};

function load_service(service_name, full_path, obj) {
    obj.config = diskjson.create(full_path, "config", {}, true, true).data;
    obj.state = 1;
    console.log("srv", service_name, "loaded")
}

function collect_services() {
    var r = fs.readdirSync(service_path);
    r.forEach((v) => {
        services[v] = services[v] || {
            config: {},
            state: 0
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