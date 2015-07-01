
var method = User.prototype;

function User(id, name) {
    this.id = id;
    this.publicid = "_"+Date.now()+Math.random().toString(36);
    this.name = name;
    this.rooms = {};
}

method.joinRoom = function(room) {
    this.rooms[room.name] = room;
};

module.exports = User;

