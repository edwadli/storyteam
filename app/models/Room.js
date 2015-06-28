
var method = Room.prototype;

function Room() {
    this.story = "";
    this.options = {maxWords: 3};
    this.turn = 0;
}

method.nextTurn = function() {};

module.exports = Room;


