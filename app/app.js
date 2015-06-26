

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
        users[client.id] = {name: name};
        client.emit("login result", jade.renderFile('./views/selectRoom.jade'));
    });

    // join room
    client.on("join room", function(name){
        // TODO: dont automatically create new room if room doesnt exist
        if (name.length === 0) return; // TODO: dont just fail silently
        if (!(name in rooms)) rooms[name] = {story: "", options: defaultOptions, turn: 0};
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
        // TODO: maintain internal list of players in room instead
        //      of relying on socketio list
        // TODO: fix turn ordering when user(s) leave in the middle
        var room = io.sockets.adapter.rooms[data.roomName];
        var userslist = [];
        for (var user in room){
            userslist.push(user);
        }

        var turn = (rooms[data.roomName].turn);
        if (turn >= userslist.length) {
            //note room only exists if has atleast one player
            turn = 0;
            rooms[data.roomName].turn = 0;
        }

        var errMsg;
        // check turn
        if (userslist[turn] === client.id) {
            // enforce rules of the game before accepting msg
            errMsg = isInvalidPlay(data.msg, rooms[data.roomName].options);
        }
        else {
            errMsg = "Not your turn";
        }
        if (errMsg === null){
            addToStory(data.msg, data.roomName);
            // update turn
            rooms[data.roomName].turn = (turn+1)%(userslist.length);
        }
        io.to(data.roomName).emit("story",
            {
                err: errMsg,
                story: rooms[data.roomName].story,
                turn: (users[userslist[(rooms[data.roomName]).turn]]).name
            }
        );
    });

    client.on("refresh story", function(data){
        // make sure room is one of client's rooms
        if (!(client.rooms.indexOf(data.roomName) >= 0)) return;
        var userslist = [];
        for (var user in io.sockets.adapter.rooms[data.roomName]){
            userslist.push(users[user].name);
        }
        var room = rooms[data.roomName];
        var turn = (rooms[data.roomName].turn);
        if (turn >= userslist.length) {
            //note room only exists if has atleast one player
            turn = 0;
            rooms[data.roomName].turn = 0;
        }
        io.to(data.roomName).emit("story", 
            {err: null, story: room.story, turn: userslist[turn]});
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
http.listen(8080, function(){
    console.log('listening on *:8080');
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


