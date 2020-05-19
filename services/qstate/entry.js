//qstate is a simple generic in-mem db & state sharing API
//allowing simple R/W operations on some mem resource

var express = require('express');

function instance(name, realm, services) {
    console.log("==> instanciating service", name, 'for', realm.name);
    var service_route = express.Router();

    var srv = realm.service_data['qstate'];
    var vars = srv.vars;
    var config = srv.config;
    var gvars = realm.global_vars;

    var data = {
        vars: vars
    };

    service_route.get("/", (req, res) => {
        res.json(data);
    });

    var io_connection = (socket) => {
        socket.emit("test", "hi from demo service IO endpoint")
        socket.emit("test", realm)
    };

    return {
        http_handler: service_route,
        io_handler: io_connection
        // destroy: () => { }
    };
}

module.exports.instance = instance;

var q =
{
    "config": {
        "active": 1, "services": { "qstate": { "enabled": true }, "tiny-service": { "enabled": true }, "demo-service": { "enabled": true } }
    }, "state": 1, "name": "public", "full_path": "/Users/doge/Desktop/Work/strut/realms/public",
    "global_vars": {},
    "service_data": {
        "qstate": {
            "path": "/Users/doge/Desktop/Work/strut/realms/public/qstate", "data_path": "/Users/doge/Desktop/Work/strut/realms/public/qstate/data", "shared_path": "/Users/doge/Desktop/Work/strut/realms/public/shared", "config": {}, "vars": {}
        }, "tiny-service": {
            "path": "/Users/doge/Desktop/Work/strut/realms/public/tiny-service", "data_path": "/Users/doge/Desktop/Work/strut/realms/public/tiny-service/data", "shared_path": "/Users/doge/Desktop/Work/strut/realms/public/shared", "config": {}, "vars": {}
        }, "demo-service": {
            "path": "/Users/doge/Desktop/Work/strut/realms/public/demo-service", "data_path": "/Users/doge/Desktop/Work/strut/realms/public/demo-service/data", "shared_path": "/Users/doge/Desktop/Work/strut/realms/public/shared", "config": {}, "vars": {}
        }
    }, "inited": 1
}