
// express
var express = require('express');
var app = express();
app.use('/resources', express.static(__dirname + '/resources'));
// jade
app.set('views', __dirname+'/views');
app.set('view engine', 'jade');
var jade = require('jade');
// utils
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// socketio
var http = require('http').Server(app);
var io = require('socket.io')(http);
// models
var Room = require(__dirname+'/models/Room.js');
var User = require(__dirname+'/models/User.js');
var Story = require(__dirname+'/models/Story.js');

var users = {};
var rooms = {};
//TODO: changeable options for the game
var defaultOptions = {maxWords: 3};

// main page
app.get('/', function(req,res){
    res.render('index');
});

// connection
io.on('connection', function(client){
       
    // new user join
    client.on("login", function(name){
        // allow for same name
        var user = new User(client.id, name);
        users[client.id] = user;
        client.emit("validate user", {name: user.name, publicid: user.publicid });
        client.emit("login result", jade.renderFile(__dirname+'/views/selectRoom.jade'));
    });

    // join room
    client.on("join room", function(name){
        // TODO: dont automatically create new room if room doesnt exist
        if (name.length === 0) return;
        if (!(name in rooms)) rooms[name] = new Room(name);
        var user = users[client.id];
        var room = rooms[name];
        room.addUser(user);
        user.joinRoom(room);
        // attach room to client
        client.join(name);
        io.to(name).emit("user joined", {name: users[client.id].name});
        client.emit("join room result", jade.renderFile(__dirname+'/views/room.jade',
                {roomName: name}));
    });

    // side chat
    client.on("chat", function(data){
        // don't allow empty messages
        if (data.msg === '') return;
        var user = users[client.id];
        // make sure room is one of client's rooms
        if (!(data.roomName in users[client.id].rooms)) return;
        client.broadcast.to(data.roomName).emit('chat',
            {name: user.name, msg: data.msg});
        client.emit('self chat', {name: users[client.id].name, msg: data.msg});
    });

    // users in the room
    client.on("user list", function(data){
        // make sure room is one of client's rooms
        if (!(data.roomName in users[client.id].rooms)) return;
        var room = rooms[data.roomName];
        io.to(data.roomName).emit('user list',room.getUsers());
    });

    // story building
    client.on("story", function(data){
        // make sure room is one of client's rooms
        if (!(data.roomName in users[client.id].rooms)) return;
        
        var room = rooms[data.roomName];
        var errMsg = room.userSubmission(users[client.id], data.msg);

        if (errMsg === null){
            io.to(data.roomName).emit("story",
                {
                    story: rooms[data.roomName].story.continuations,
                    turn: rooms[data.roomName].whoseTurn().name
                }
            );
        }
        else {
            client.emit('story error', {msg: errMsg});
        }
    });

    // story refresh
    client.on("refresh story", function(data){
        // make sure room is one of client's rooms
        if (!(data.roomName in users[client.id].rooms)) return;
        var room = rooms[data.roomName];
        io.to(data.roomName).emit("story", 
            {story: room.story.continuations, turn: room.whoseTurn().name});
    });

    // get rooms
    client.on("rooms list", function(){
        io.emit("rooms list", Object.keys(rooms));
    });

 
    // modification to socket library for onclose events
    client.onclose = function(reason){
        disconnect_cb(client);
        Object.getPrototypeOf(this).onclose.call(this,reason);
    };
    // leaving (using customized disconnect event)
    disconnect_cb = function(client){
        if (client.id in users) {
            var user = users[client.id];
            // remove user from rooms
            for (var key in user.rooms){
                if (!(user.rooms.hasOwnProperty(key))) continue;
                var room = user.rooms[key];
                room.removeUser(user.id);
                io.to(room.name).emit('user left', {name: user.name});
                if (Object.keys(room.users).length === 0)
                {
                    // remove room if user was last in the room
                    delete rooms[room.name];
                }
            }
            // remove user from users list
            delete users[client.id];
        }
    };
});


// start server
http.listen(process.env.PORT || 3000, function(){
    console.log('listening on *:3000');
});


