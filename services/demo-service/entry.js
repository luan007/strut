var express = require('express');
var service_route = express.Router();

service_route.get("/a", (req, res) => {
    res.json({ hello: 1, stuff: req.realm })
});

module.exports.router = service_route;
