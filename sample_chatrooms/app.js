
var app = require('express')();
app.set('views', './views');
app.set('view engine', 'jade');
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var http = require('http').Server(app);

var io = require('socket.io')(http);


// main page
app.get('/', function(req,res){
    res.render('index',{title: 'Hey', message: 'Hello there!'});
});


// attempt to join room
app.post('/join_room', function(req, res){
    var name = req.body.id;
    // TODO: check whether room does not exist
    res.send(req.protocol+"://"+req.get('host')+"/rooms/"+name);
});

// join particular room
app.get('/rooms/[a-zA-Z0-9]+', function(req, res){
    var name = req.originalUrl.substring(7);
    res.render("room",{id: name});
});


io.on('connection', function(socket){
    socket.on('join room', function(msg){
        // TODO: check whether room does not exist
        socket.join(msg);
        // add to rooms
        socket.emit('join room','true');
    });
});

// start server
http.listen(3000, function(){
    console.log('listening on *:3000');
});


