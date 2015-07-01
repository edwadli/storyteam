
var method = User.prototype;

function User(id, name) {
    this.id = id;
    this.name = name;
    this.rooms = {};
}

method.joinRoom = function(room) {
    this.rooms[room.name] = room;
};

module.exports = User;

