var fs = require("fs");
var config = require("./config");
var path = require("path");
var diskjson = require("./lib/diskjson")
var realm_router = require("express").Router();
var service_path = config.service_path;

var services = {
};

var mounts = {};

function mount(alias, srv) {
    mounts[alias] = srv;
}

function load_service(service_name, full_path, obj) {
    obj.config = diskjson.create(full_path, "config", {}, true, true).data;
    obj.config.root.mounts = obj.config.root.mounts || [];
    obj.state = 1;
    console.log("srv", service_name, "loaded");
    //actually load the thing
    var endpoint = require(path.resolve(full_path, "entry.js"));
    obj.endpoint = endpoint;

    mount(service_name, service_name);
    obj.config.root.mounts.forEach((v => {
        mount(v, service_name);
    }));
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

realm_router.use("/:ns/*", (req, res, next) => {
    //actual route
    var service = mounts[req.params['ns']];
    if (!service) {
        return res.json({
            error: "gate error",
            message: "service (or alias) not found",
            code: -405
        });
    }
    var ep = services[service];
    if (!ep.endpoint || !ep.endpoint.router) {
        return res.json({
            error: "service error",
            message: "API does not exist",
            code: -500
        });
    }
    if (req.realm) {
        if (!(req.realm.config && req.realm.config.root.services[service])) {
            return res.json({
                error: "gate error",
                message: "service not found for realm",
                code: -402
            });
        }
        if (!(req.realm.config && req.realm.config.root.services[service].enabled)) {
            return res.json({
                error: "gate error",
                message: "service is disabled",
                code: -403
            });
        }
        req.ep = ep;
        return next();
    }
    else {
        return res.json({
            error: "gate error",
            message: "realm not found (for service)",
            code: -402
        });
    }
});

realm_router.use("/:ns", (req, res, next) => {
    return req.ep.endpoint.router.handle(req, res, next);
});

module.exports.collect_services = collect_services;
module.exports.services = services;
module.exports.realm_router = realm_router;