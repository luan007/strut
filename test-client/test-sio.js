var io = require('socket.io-client');

var client = io("http://localhost:8099/public")
client.on("connect", ()=>{
    console.log("Connected");
});
client.on("disconnect", ()=>{
    console.log("Dropped");
});

client.on("test", console.log)