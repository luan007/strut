//make this simple
//realm = physical place in harddrive - LAZY

//for easier mgmt

var express_routing = require("express").Router();
var fs = require("fs");
var config = require("./config");
var diskjson = require("../lib/diskjson");
var path = require("path");
var realm_path = config.realm_path;
var service = require("./service");

var realms = {};
var realms_service_instances = {};

function ensure_dir(root, dir) {
    if (!fs.existsSync(path.resolve(root, dir))) {
        fs.mkdirSync(path.resolve(root, dir))
    }
}

function setup_service_env(realm_name, full_path, service) {
    var srv_path = path.resolve(full_path, service);
    var data_path = path.resolve(srv_path, 'data');
    var shared_path = path.resolve(full_path, 'shared');
    ensure_dir(full_path, service);
    ensure_dir(srv_path, 'data');
    ensure_dir(full_path, 'shared');
    var fin = {
        path: srv_path,
        data_path: data_path,
        shared_path: shared_path,
        config: diskjson.create(srv_path, "config", {}, true).data,
        vars: diskjson.create(srv_path, "vars", {}, true).data
    };

    return fin;
}


function load_realm(realm_name, full_path, obj) {
    var inited = obj.inited;
    realms_service_instances[realm_name] = realms_service_instances[realm_name] || {};
    obj.name = realm_name;
    obj.full_path = full_path;
    obj.config = diskjson.create(full_path, "config", {}, true).data;
    obj.global_vars = diskjson.create(full_path, "global_vars", {}, true).data;
    obj.service_data = {};
    for (var i in obj.config.services) {
        obj.service_data[i] = setup_service_env(realm_name, full_path, i);
        if (obj.config.services[i].enabled) {
            try {
                realms_service_instances[realm_name][i] =
                    realms_service_instances[realm_name][i] ||
                    service.subprograms[i].instance(i, obj, service.services)
            } catch (e) {
                console.error("Error: Instancing <", i, "> for [", realm_name, "] failed")
                // console.log(e)
            }
        }
    }
    //ensure directory safety
    obj.state = 1;
    obj.inited = 1;
    console.log("realm", realm_name, !inited ? "loaded" : "reloaded");
}

function create_realm_fs(realm_name, init_cfg, init_vars) {
    try {
        init_cfg = init_cfg || {};
        init_vars = init_vars || {};
        realm_name = path.normalize(realm_name);
        var r = fs.readdirSync(realm_path);
        if (r.indexOf(realm_name) > -1) {
            return realms[realm_name]; //exists
        } else {
            var fp = path.resolve(realm_path, realm_name);
            fs.mkdirSync(fp);
            collect_realms();
            var my_realm = realms[realm_name];
            for (var i in init_cfg) {
                my_realm.config[i] = init_cfg[i];
            }
            for (var i in init_vars) {
                my_realm.vars[i] = init_cfg[i];
            }
            console.log("realm", realm_name, "created");
            return my_realm;
        }
    } catch (e) {
        console.warn("Error creating realm", realm_name);
        console.log(e);
        return -2; //error
    }
}

function post_init() {
    var public = create_realm_fs("public", {}, {});
    //add services if any
    var cfg = public.config;
    cfg.active = 1;
    cfg.services = cfg.services || {};
    for (var i in service.services) {
        cfg.services[i] = cfg.services[i] || {
            enabled: true
        };
    }
    load_realm("public", public.full_path, public);
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

function validate_realm(realm_id) {
    return realms[realm_id];
}

function realm_active(realm_id) {
    var rm = validate_realm(realm_id);
    if (!rm) return false;
    return rm && rm.config && rm.config.active;
}

//express related
var realm_gate = express_routing.use("/:realm_id/*", (req, res, next) => {
    var r_id = req.params['realm_id'];
    var r = validate_realm(r_id);
    if (r && r.config && r.config.active) {
        req.realm = r;
        return next();
    } else if (!realm_active(r_id)) {
        return res.json({
            error: "gate error",
            message: "realm deactivated",
            code: -399
        });
    }
    else {
        return res.json({
            error: "gate error",
            message: "realm not found",
            code: -404
        });
    }
});

var realm_router = require("express").Router();
realm_router.use("/:ns/*", (req, res, next) => {
    //actual route
    var srv = service.mounts[req.params['ns']];
    var realm_name = req.realm.name;
    if (!srv || !realm_name) {
        return res.json({
            error: "gate error",
            message: "service (or alias) not found",
            code: -405
        });
    }
    if (req.realm) {
        if (!(req.realm.config && req.realm.config.services[srv])) {
            return res.json({
                error: "gate error",
                message: "service not found for realm",
                code: -402
            });
        }
        if (!(req.realm.config && req.realm.config.services[srv].enabled)) {
            return res.json({
                error: "gate error",
                message: "service is disabled",
                code: -403
            });
        }
        var ep = realms_service_instances[realm_name][srv];
        if (!ep || !ep.http_handler) {
            return res.json({
                error: "service error",
                message: "API does not exist",
                code: -500
            });
        }
        req.ep = ep.http_handler;
        req.srv = srv;
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
    if (!req.ep || !req.srv) {
        return res.json({
            error: "gate error",
            message: "endpoint not found, if you're trying to access index of a namespace, please make sure you have '/' @ the end",
            code: -999
        });
    }
    res.header("X-Powered-By", "_unfallen_ <" + req.srv + ">")
    return req.ep.handle(req, res, next);
});

realm_gate.use("/:realm_id", realm_router);

function realm_io_router(realm, socket) {
    //a socket comes in, turn in this socket to all ava-ns
    var r_instances = realms_service_instances[realm.name];
    for (var i in r_instances) {
        //setup reroute
        if (!realm.config.services[i].enabled) {
            return;
        }
        if (r_instances[i].io_handler) {
            r_instances[i].io_handler(socket);
        }
    }
}

function setup_io_transport(io) {
    io.of((name, query, next) => {
        name = name.replace("/", "");
        if (validate_realm(name) && realm_active(name)) {
            next(null, true);
        }
        else {
            return next(new Error("Realm [" + name + "] does not exist, or has been deactivated."))
        }
    }).on('connect', (socket) => {
        var realm = validate_realm(socket.nsp.name.replace("/", ""));
        socket.realm = realm;
        realm_io_router(realm, socket);
    });
}


module.exports.setup_io_transport = setup_io_transport;
module.exports.collect_realms = collect_realms;
module.exports.realms = realms;
module.exports.validate_realm = validate_realm;
module.exports.express_routing = express_routing;
module.exports.post_init = post_init;
module.exports.realm_service_instances = realms_service_instances;

