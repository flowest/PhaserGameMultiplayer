var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/audio', express.static(__dirname + '/audio'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/data', express.static(__dirname + '/data'));
app.use('/images', express.static(__dirname + '/images'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(3000, function () { // Listens to port 8081
    console.log('Listening on ' + server.address().port);
});

server.lastPlayderID = 0; // Keep track of the last id assigned to a new player

io.on('connection', function (socket) {
    socket.on('askNewPlayer', function () {
        socket.player = {
            id: socket.id,
            x: randomInt(100, 400),
            y: randomInt(100, 400)
        };

        // socket.emit("newPlayerAdded", socket.player);
        socket.emit("senderOnly", socket.player.id);
        socket.emit('allplayers',getAllPlayers());
        
        socket.broadcast.emit('newPlayerAdded', socket.player);

        // socket.on('click',function(data){
        //     console.log('click to '+data.x+', '+data.y);
        //     socket.player.x = data.x;
        //     socket.player.y = data.y;
        //     io.emit('move',socket.player);
        // });

        // socket.on('movingWithKeys',function(direction){
        //     //console.log('moving: ' + data);
        // 	if(direction !== 'stop')
        // 		socket.player.x += direction === 'left' ? -200 : +200;
        // 	else
        // 		socket.player.x += 0;
        //     //socket.player.y = data.y;
        //     io.emit('movedPlayerWithKeys',socket.player);
        // });

        socket.on('move', function (input) {
            socket.broadcast.emit('movePlayer', { id: socket.player.id, direction: input });
        });

        socket.on('jump', function () {
            socket.broadcast.emit('jumpPlayer', socket.player.id);
        });

        socket.on('disconnect', function () {
            io.emit('remove', socket.player.id);
        });
    });
});

function getAllPlayers() {
    var players = [];
    Object.keys(io.sockets.connected).forEach(function (socketID) {
        var player = io.sockets.connected[socketID].player;
        //if (player.id != ownID) {
            if (player) players.push(player);
        //}
    });
    return players;
}

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}