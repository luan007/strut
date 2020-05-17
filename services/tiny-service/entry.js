function instance(name, realm, services) {
    console.log("==> instanciating service", name, 'for', realm.name);
    var io_connection = (socket) => {
        socket.emit("test", "hello from tiny IO endpoint")
    };

    return {
        io_handler: io_connection
        // destroy: () => { }
    };
}

module.exports.instance = instance;
