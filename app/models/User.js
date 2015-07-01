
var method = User.prototype;

function User(id, name) {
    this.id = id;
    this.publicid = "Z"+Date.now()+Math.floor(Math.random()*1000000).toString(36);
    this.name = name;
    this.rooms = {};
}

method.joinRoom = function(room) {
    this.rooms[room.name] = room;
};

module.exports = User;

