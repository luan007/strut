//aim to be tiny service gate


//single http / https / socketio instance for simplicity (for now)

const config = require("./config");
const app = require('express')();
app.use(require("cors")());
app.use(require("body-parser").json());
const server = require('http').Server(app);
const io = require('socket.io')(server);
io.set('origins', '*:*');

app.use(function (req, res, next) {
    res.header("X-Powered-By", "_hell.gate_")
    next()
})

var realm = require("./realm");
var service = require("./service");
service.collect_services();
realm.collect_realms();
realm.post_init();

server.listen(config.port);
console.log("Server Starting on", config.port);

app.use(realm.express_routing);
realm.setup_io_transport(io);