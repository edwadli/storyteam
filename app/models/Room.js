
var nodemethod = TurnNode.prototype;
function TurnNode(user) {
    this.user = user;
    this.next = this;
    this.prev = this;
}


var method = Room.prototype;

function Room(name) {
    this.name = name;
    this.story = "";
    this.options = {maxWords: 3};
    this.turn = null;
    this.users = {};
}

method.addUser = function(user) {
    if (Object.keys(this.users).length === 0){
        this.users[user.id] = new TurnNode(user);
        this.turn = user.id;
    }
    else {
        var currTurn = this.users[this.turn];
        var newNode = new TurnNode(user);
        newNode.next = currTurn;
        newNode.prev = currTurn.prev;
        currTurn.prev.next = newNode;
        currTurn.prev = newNode;
        this.users[user.id] = newNode;
    }
};

method.removeUser = function(userId) {
    // make sure user is in room
    if (!(userId in this.users)) return;

    if (Object.keys(this.users).length <= 1){
        this.turn = null;
    }
    else {
        // keep turns consistent
        if (this.turn === userId) {
            this.nextTurn();
        }

        var oldNode = this.users[userId];
        // link up prev and next nodes
        var prevNode = oldNode.prev;
        var nextNode = oldNode.next;
        prevNode.next = nextNode;
        nextNode.prev = prevNode;

    }
    
    // get rid of user entry
    delete this.users[userId];
};

method.whoseTurn = function() {
    return this.users[this.turn].user;
};
method.nextTurn = function() {
    this.turn = this.users[this.turn].next.user.id;
};
method.prevTurn = function() {
    this.turn = this.users[this.turn].prev.user.id;
};

method.getUsers = function() {
    var list = [];
    var curr_id = this.turn;
    for (var i=0; i<Object.keys(this.users).length; i++){
        list.push(this.users[curr_id].user.name);
        curr_id = this.users[curr_id].next.user.id;
    }
    return list;
}

module.exports = Room;


