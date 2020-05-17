//make this simple
//realm = physical place in harddrive - LAZY

//for easier mgmt

var express_routing = require("express").Router();
var fs = require("fs");
var config = require("./config");
var diskjson = require("./lib/diskjson");
var path = require("path");
var realm_path = config.realm_path;
var service = require("./service");
var realms = {};


function ensure_dir(root, dir) {
    if(!fs.existsSync(path.resolve(root, dir))) {
        fs.mkdirSync(path.resolve(root, dir))
    }
}

function setup_services_env(realm_name, full_path, service) {
    var srv_path = path.resolve(full_path, service);
    var data_path = path.resolve(srv_path, 'data');
    ensure_dir(full_path, service);
    ensure_dir(srv_path, 'data');
    var fin = {
        path: srv_path,
        data_path: data_path,
        config: diskjson.create(srv_path, "config", {}, true).data,
        vars: diskjson.create(srv_path, "vars", {}, true).data
    };
    return fin;
}


function load_realm(realm_name, full_path, obj) {
    var inited = obj.inited;
    obj.name = realm_name;
    obj.full_path = full_path;
    obj.config = diskjson.create(full_path, "config", {}, true).data;
    obj.global_vars = diskjson.create(full_path, "global_vars", {}, true).data;
    obj.service_data = {};
    for (var i in obj.config.services) {
        obj.service_data[i] = setup_services_env(realm_name, full_path, i);
    }
    //ensure directory safety
    ensure_dir(full_path, "shared");
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
    for (var i in service.services) {
        console.log(i);
    }
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

//express related
var realm_gate = express_routing.use("/:realm_id/*", (req, res, next) => {
    var r_id = req.params['realm_id'];
    var r = validate_realm(r_id);
    if (r && r.config && r.config.active) {
        req.realm = r;
        return next();
    } else if (r && r.config && !r.config.active) {
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

realm_gate.use("/:realm_id", service.realm_router);


module.exports.collect_realms = collect_realms;
module.exports.realms = realms;
module.exports.validate_realm = validate_realm;
module.exports.express_routing = express_routing;
module.exports.post_init = post_init;

