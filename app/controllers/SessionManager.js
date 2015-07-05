var User = require(__dirname+'/../models/User.js');
var PublicUser = require(__dirname+'/../models/PublicUser.js');
var Room = require(__dirname+'/../models/Room.js');

var jade = require('jade');

var method = SessionManager.prototype;
function SessionManager(){
	// manages administrative (non-game) activity
	this.users = {};
	this.rooms = {};
}

method.login = function(client, userName){
	// allow for same name
    var user = new User(client.id, userName);
    this.users[client.id] = user;
    client.emit("validate user", new PublicUser(user));
    client.emit("login result", jade.renderFile(__dirname+'/../views/selectRoom.jade'));
};

method.joinRoom = function(io, client, roomName){
	// TODO: don't automatically create a new rom if room doesn't exist
	// don't allow empty names
	if (roomName.length === 0) return;
	if (!(roomName in this.rooms)) this.rooms[roomName] = new Room(roomName);
	var user = this.users[client.id];
	var room = this.rooms[roomName];
	room.addUser(user);
	user.joinRoom(room);
	// attach socketio room
	client.join(roomName);
	// send results of joining room
    io.to(roomName).emit("user joined", {name: user.name});
    client.emit("join room result", jade.renderFile(__dirname+'/../views/room.jade',
            {roomName: room.name}));
    client.emit("update user", new PublicUser(user));
    return room;
};

method.getRooms = function(client){
	client.emit("rooms list", Object.keys(this.rooms));
};

method.authorize = function(client, roomName){
	if (!(client.id in this.users)) return;
	var user = this.users[client.id];
	if (roomName in user.rooms)
		return {room: this.rooms[roomName], user: user};
	else
		console.log(user);
		return null;
};

method.leave = function(io, client){
	if (!(client.id in this.users)) return;
	var user = this.users[client.id];
	// remove user from rooms
    for (var key in user.rooms){
        if (!(user.rooms.hasOwnProperty(key))) continue;
        var room = user.rooms[key];
        room.removeUser(user.id);
        if (Object.keys(room.users).length === 0)
        {
            // remove room if user was last in the room
            delete this.rooms[room.name];
        }
        else {
            io.to(room.name).emit('user left', {name: user.name});    
        }
    }
    // remove user from users list
    delete this.users[client.id];
};

module.exports = SessionManager;
