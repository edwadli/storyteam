
var method = User.prototype;

function User(id, name) {
    this.id = id;
    this.name = name;
    this.rooms = [];
}

// TODO: use this in app.js
method.joinRoom = function(room) {
    this.rooms.push(room);
};

module.exports = User;

