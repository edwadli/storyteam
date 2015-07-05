
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
var PublicUser = require(__dirname+'/models/PublicUser.js');

var SessionManager = require(__dirname+'/controllers/SessionManager.js');
var Chat = require(__dirname+'/controllers/Chat.js');
var Gameplay = require(__dirname+'/controllers/Gameplay.js');

var site = new SessionManager();
var chat = new Chat();
var gameplay = new Gameplay();

var users = {};
var rooms = {};

// main page
app.get('/', function(req,res){
    res.render('index');
});

// connection
io.on('connection', function(client){
       
    // new user join
    client.on("login", function(name){site.login(client, name);});
    // join room
    client.on("join room", function(name){site.joinRoom(io, client, name);});
    // get rooms
    client.on("rooms list", function(){
        site.getRooms(client);
    });


    // side chat
    client.on("chat", function(data){
        // make sure room is one of client's rooms
        info = site.authorize(client, data.roomName);
        if (info === null) return;
        chat.message(client, data.msg, info.room, info.user);
    });


    // users in the room
    client.on("user list", function(data){
        // make sure room is one of client's rooms
        info = site.authorize(client, data.roomName);
        if (info === null) return;
        gameplay.getUserList(client, info.room);
    });
    // story refresh
    client.on("refresh story", function(data){
        // make sure room is one of client's rooms
        info = site.authorize(client, data.roomName);
        if (info === null) return;
        gameplay.getStory(client, info.room);
    });
    // voting refresh
    client.on('vote update', function(data){
        // make sure room is one of client's rooms
        info = site.authorize(client, data.roomName);
        if (info === null) return;
        gameplay.getVotes(client,info.room);
    });


    // story building
    client.on("story", function(data){
        // make sure room is one of client's rooms
        info = site.authorize(client, data.roomName);
        if (info === null) return;
        gameplay.submitToStory(io,client,info.room,info.user,data.msg);
    });
    // voting
    client.on('vote', function(data){
        // make sure room is one of client's rooms
        info = site.authorize(client, data.roomName);
        if (info === null) return;
        gameplay.submitVote(io,info.user,info.room,data.voteType);
    });

    
    // modification to socket library for onclose events
    client.onclose = function(reason){
        disconnect_cb(client);
        Object.getPrototypeOf(this).onclose.call(this,reason);
    };
    // leaving everything (cleanup)
    disconnect_cb = function(client){
        site.leave(io, client);
        // if (client.id in users) {
        //     var user = users[client.id];
        //     // remove user from rooms
        //     for (var key in user.rooms){
        //         if (!(user.rooms.hasOwnProperty(key))) continue;
        //         var room = user.rooms[key];
        //         room.removeUser(user.id);
        //         if (Object.keys(room.users).length === 0)
        //         {
        //             // remove room if user was last in the room
        //             delete rooms[room.name];
        //         }
        //         else {
        //             io.to(room.name).emit('user turn', new PublicUser(room.whoseTurn()));
        //             io.to(room.name).emit('user left', {name: user.name});    
        //         }
        //     }
        //     // remove user from users list
        //     delete users[client.id];
        // }
    };
});


// start server
http.listen(process.env.PORT || 3000, function(){
    console.log('listening on *:3000');
});


