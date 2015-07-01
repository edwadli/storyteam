
var Story = require(__dirname+"/Story.js");

var nodemethod = TurnNode.prototype;
function TurnNode(user) {
    this.user = user;
    this.next = this;
    this.prev = this;
}


var method = Room.prototype;

function Room(name) {
    this.name = name;
    this.story = new Story();
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
};

method.userSubmission = function(userid, submission){
    // check turn
    var errMsg = "Not your turn";
    if (this.whoseTurn().id === userid){
        // check rules of the game
        errMsg = isInvalidPlay(submission, this.options);
        // apply update to story
        if (errMsg === null) {
            this.nextTurn();
            this.story.addToStory(submission, userid);
        }
    }
    return errMsg;
};

module.exports = Room;










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



