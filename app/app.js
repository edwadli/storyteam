
// express
var app = require('express')();
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
        users[client.id] = new User(client.id, name);
        client.emit("login result", jade.renderFile(__dirname+'/views/selectRoom.jade'));
    });

    // join room
    client.on("join room", function(name){
        // TODO: dont automatically create new room if room doesnt exist
        if (name.length === 0) return; // TODO: client side validation
        if (!(name in rooms)) rooms[name] = new Room(name);
        var user = users[client.id];
        var room = rooms[name];
        room.addUser(user);
        user.joinRoom(room);
        // attach room to client
        client.join(name);
        io.to(name).emit("user joined", users[client.id].name+" has joined");
        client.emit("join room result", jade.renderFile(__dirname+'/views/room.jade',
                {roomName: name}));
    });

    // side chat
    client.on("chat", function(data){
        // make sure room is one of client's rooms
        if (!(client.rooms.indexOf(data.roomName) >= 0)) return;
        // don't allow empty messages
        if (data.msg === '') return;
        io.to(data.roomName).emit('chat', users[client.id].name+": "+data.msg);
    });

    // users in the room
    client.on("user list", function(data){
        // make sure room is one of client's rooms
        if (!(client.rooms.indexOf(data.roomName) >= 0)) return;
        // TODO: return users in order of turns
        var room = io.sockets.adapter.rooms[data.roomName];
        var userslist = [];
        for (var user in room) {
            userslist.push(users[user].name);
        }
        io.to(data.roomName).emit('user list',userslist);
    });

    // story building
    client.on("story", function(data){
        // TODO: make this secure by using socket.id instead of name
        
        // make sure room is one of client's rooms
        if (!(client.rooms.indexOf(data.roomName) >= 0)) return;
        
        var room = rooms[data.roomName];
        var errMsg;
        // check turn
        if (room.whoseTurn().id === client.id) {
            // enforce rules of the game before accepting msg
            errMsg = isInvalidPlay(data.msg, rooms[data.roomName].options);
        }
        else {
            errMsg = "Not your turn";
        }
        if (errMsg === null){
            room.nextTurn();
            addToStory(data.msg, data.roomName);
            // update turn
        }
        io.to(data.roomName).emit("story",
            {
                err: errMsg,
                story: rooms[data.roomName].story,
                turn: rooms[data.roomName].whoseTurn().name,
                // TODO: do client side validation instead of returning this
                lastmsg: data.msg
            }
        );
    });

    client.on("refresh story", function(data){
        // make sure room is one of client's rooms
        if (!(client.rooms.indexOf(data.roomName) >= 0)) return;
        var room = rooms[data.roomName];
        io.to(data.roomName).emit("story", 
            {err: null, story: room.story, turn: room.whoseTurn().name});
    });

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
        if (client.id in users)
            try {
                var user = users[client.id];
                for (var i=0; i<user.rooms.length; i++){
                    var room = user.rooms[i]; 
                    room.removeUser(user.id);
                    io.to(room.name).emit('user left', user.name+' has left');
                    if (Object.keys(room.users).length === 0)
                    {
                        delete rooms[room.name];
                    }
                }
                // remove from users list
                delete users[client.id];

            }
            catch (e) {
                console.log(e);
            }
    };
});


// start server
http.listen(process.env.PORT || 3000, function(){
    console.log('listening on *:3000');
});



function isInvalidPlay(msg, opt) {
    // check if msg is a valid play
    
    // TODO: make this changeable options from client
    // TODO: make this more sophisticated
    //var tokens = msg.split(/( )/);
    if (msg.length === 0) return "Empty string";
    if (msg[0] === ' ') msg = msg.substr(1);
    if (msg[msg.length-1] === ' ') msg = msg.substr(0,msg.length-1);
    var tokens = msg.split(" ");
    var count = 0;
    for (var i=0; i<tokens.length; i++){
        var token = tokens[i];
        //if (token.length === 0) continue;
        if (!isAlphaWithPunct(token) && !isNumericWithPunct(token)
                && !isEndingPunct(token))
            return "Invalid token";
        else if (isEndingPunct(token))
            continue;
        else
            count++;
    }
    // TODO: incorporate user options
    // max N words
    if (!(count <= opt.maxWords)) {
        return "Too many tokens";
    }
    // check if final word has ending punct
    var last = tokens[tokens.length-1];
    var lastchar = last[last.length-1];
    if (isEndingPunct(lastchar))
        return "Cannot end with punctuation";

    // if msg is valid, return null
    return null;
}

function isAlphaWithPunct(str) {
    return /^[(<'"]*[a-zA-Z&'-]+[.,!?;:)>'"]*$/.test(str);
}

function isNumericWithPunct(str) {
    return /^[$-]*[0-9-,.:]+$/.test(str);
}

function isAlpha(str) {
    return /^[a-zA-Z]+$/.test(str);
}

function isNumeric(str) {
    return /^[0-9]+$/.test(str);
}

function isEndingPunct(str){
    return /^[.,!?;:)>'"]+$/.test(str);
}


function addToStory(msg,roomName){
    if (isAlphaWithPunct(msg[0]) || isAlphaWithPunct(msg.substr(0,2))
        || isNumericWithPunct(msg[0]) || isNumericWithPunct(msg.substr(0,2)))
        msg = ' '+msg;
    if (msg[msg.length-1] === ' ')
        msg = msg.substr(0,msg.length-1);
    rooms[roomName].story += msg;
}


