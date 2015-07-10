
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

// controllers
var SessionManager = require(__dirname+'/controllers/SessionManager.js');
var Chat = require(__dirname+'/controllers/Chat.js');
var Gameplay = require(__dirname+'/controllers/Gameplay.js');
var VoteManager = require(__dirname+'/controllers/VoteManager.js');
var OptionsEditor = require(__dirname+'/controllers/OptionsEditor.js')

var site = new SessionManager();
var chat = new Chat();
var gameplay = new Gameplay();
var vote = new VoteManager();
var optionsEditor = new OptionsEditor();

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

    // get options
    client.on("options", function(data){
        // make sure room is one of client's rooms
        info = site.authorize(client, data.roomName);
        if (info === null) return;
        if (!(data.type))
            optionsEditor.getOptions(client,info.room);
        else
            optionsEditor.updateOption(io,info.room,data.type,data.data)
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
        vote.getVotes(client,info.room);
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
        vote.submitVote(io,info.user,info.room,data.voteType);
    });

    
    // modification to socket library for onclose events
    client.onclose = function(reason){
        disconnect_cb(client);
        Object.getPrototypeOf(this).onclose.call(this,reason);
    };
    // leaving everything (cleanup)
    disconnect_cb = function(client){
        site.leave(io, client);
    };
});


// start server
http.listen(process.env.PORT || 3000, function(){
    console.log('listening on *:3000');
});


