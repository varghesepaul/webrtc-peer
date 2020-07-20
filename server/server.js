var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server, { cookie: false });
server.listen(8080);

io.on('connection', function (socket) {
    console.log("Got a connection for Joining Call");
    socket.on('join', function (data) {
        socket.join(data.roomId);
        socket.room = data.roomId;
        const sockets = io.of('/').in().adapter.rooms[data.roomId];
        if (sockets.length === 1) {
            console.log("Waiting for the Calleeee leg info in ROOM", data.roomId)
            socket.emit('init')
        } else {
            if (sockets.length === 2) {
                console.log("Trying connect the Peer in Room", data.roomId)
                io.to(data.roomId).emit('ready')
            } else {
                socket.room = null
                socket.leave(data.roomId)
                socket.emit('full')
            }

        }
    });
    socket.on('signal', (data) => {

        io.to(data.room).emit('desc', data.desc)
    })
    socket.on('disconnect', () => {
        const roomId = Object.keys(socket.adapter.rooms)[0]
        if (socket.room) {
            io.to(socket.room).emit('disconnected')
        }

    })
});
