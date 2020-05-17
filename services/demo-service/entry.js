var express = require('express');
var io = require('socket.io')();

function instance(name, realm, services) {
    console.log("==> instanciating service", name, 'for', realm.name);
    var service_route = express.Router();

    service_route.get("/a", (req, res) => {
        res.json({ hello: 1, stuff: req.realm })
    });

    var io_connection = (socket) => {
        socket.emit("test", 1)
    };

    return {
        http_handler: service_route,
        io_handler: io_connection
        // destroy: () => { }
    };
}

module.exports.instance = instance;
