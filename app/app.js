

var app = require('express')();
app.set('views', './views');
app.set('view engine', 'jade');
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var http = require('http').Server(app);
var jade = require('jade');
var io = require('socket.io')(http);

var users = {};
var rooms = {};

// main page
app.get('/', function(req,res){
    res.render('index');
});

// connection
io.on('connection', function(client){
       
    // new user join
    client.on("login", function(name){
        // allow for same name
        users[client.id] = {name: name};
        client.emit("login result", jade.renderFile('./views/selectRoom.jade'));
    });

    // join room
    client.on("join room", function(name){
        // TODO: dont automatically create new room if room doesnt exist
        if (name.length === 0) return; // TODO: dont just fail silently
        if (!(name in rooms)) rooms[name] = {story: ""};
        client.join(name);
        io.to(name).emit("user joined", users[client.id].name+" has joined");
        client.emit("join room result", jade.renderFile('./views/room.jade',
                {roomName: name}));
    });

    // side chat
    client.on("chat", function(data){
        // make sure room is one of client's rooms
        if (!(client.rooms.indexOf(data.roomName) >= 0)) return;
        io.to(data.roomName).emit('chat', users[client.id].name+": "+data.msg);
    });

    // users in the room
    client.on("user list", function(data){
        // make sure room is one of client's rooms
        if (!(client.rooms.indexOf(data.roomName) >= 0)) return;
        var userlist = io.sockets.adapter.rooms[roomName];
        console.log(userlist);
        //io.to(data.roomName).emit('user list', );
    });

    // story building
    client.on("story", function(data){
        // make sure room is one of client's rooms
        if (!(client.rooms.indexOf(data.roomName) >= 0)) return;
        rooms[data.roomName].story += data.msg;
        io.to(data.roomName).emit("story", rooms[data.roomName].story);
    });

    client.on("refresh story", function(data){
        // make sure room is one of client's rooms
        if (!(client.rooms.indexOf(data.roomName) >= 0)) return;
        io.to(data.roomName).emit("story", rooms[data.roomName].story);
    });

 
    // modification to socket library for onclose events
    client.onclose = function(reason){
        disconnect_cb(client);
        Object.getPrototypeOf(this).onclose.call(this,reason);
    };
    // leaving (using customized disconnect event)
    disconnect_cb = function(client){
        if (client.id in users)
            try {
                var name = users[client.id].name;
                delete users[client.id];
                for (var i=0; i<client.rooms.length; i++){
                    io.to(client.rooms[i]).emit('user left', name+' has left');
                    var room = io.sockets.adapter.rooms[client.rooms[i]];
                    if (Object.keys(room).length === 1)
                    {
                        delete rooms[client.rooms[i]];
                    }
                }
            }
            catch (e) {
                console.log(e);
            }
    };
});


// start server
http.listen(3000, function(){
    console.log('listening on *:3000');
});


