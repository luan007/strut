//aim to be tiny service gate


//single http / https / socketio instance for simplicity (for now)

const config = require("./config");
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

require("./realm").collect_realms();
require("./service").collect_services();

server.listen(config.port);
console.log("Server Starting", config.port);
