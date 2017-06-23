var Client = {};
Client.ownID;
Client.socket = io.connect();

Client.askNewPlayer = function () {
    Client.socket.emit("askNewPlayer");
};

Client.socket.on("newPlayerAdded", function (newPlayer) {
    console.log("new player connected");
    PlayState._addNewFox(newPlayer);
});

Client.sendMove = function (input) {
    Client.socket.emit('move', input);
}

Client.sendJump = function () {
    console.log("2");
    Client.socket.emit('jump');
}

Client.socket.on('movePlayer', function (data) {
    PlayState.movePlayer(data);
});

Client.socket.on('remove', function (id) {
    PlayState.removePlayer(id);
});

Client.socket.on('jumpPlayer', function (id) {
    PlayState.jumpPlayer(id);
});

Client.socket.on('senderOnly', function (_ownID) {
    this.ownID = _ownID;
    PlayState.createPlayer();
})

Client.socket.on('allplayers', function (data) {
    for (var i = 0; i < data.length; i++) {
        if (data[i].id != this.ownID){
            PlayState._addNewFox(data[i]);
        }
    }
    // console.log(data);
});
