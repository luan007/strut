var express = require('express');
var io = require('socket.io')();

function instance(realm, local, srv) {
    //closure
    var service_route = express.Router();

    service_route.get("/a", (req, res) => {
        res.json({ hello: 1, stuff: req.realm })
    });

    var io_connection = (socket) => {
        socket.emit("hi", 1)
    };

    return {
        http_handler: service_route,
        io_handler: io_connection
    };
}

module.exports.instance = instance;
