
var Story = require(__dirname+"/Story.js");
var PublicUser = require(__dirname+"/PublicUser.js");
var Vote = require(__dirname+"/Vote.js");

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
    this.deadUsers = [];
    this.color_iterator = this.ColorIterator();
    this.polls = {};
    this.pollNames = ['vote skip turn', 'vote undo story'];
    this.initAllPolls();
}

method.getStory = function(){
    return this.story.continuations;
}

method.getPoll = function(name) {
    return this.polls[name];
};

method.newPoll = function(name) {
    if (!(this.pollNames.indexOf(name) >= 0)) return;
    this.polls[name] = new Vote(this.getUsers());
};

method.initAllPolls = function() {
    for (var i=0; i<this.pollNames.length; i++) {
        this.polls[this.pollNames[i]] = new Vote(this.getUsers());
    }
};

method.removeVoter = function(userId){
    for (var i=0; i<this.pollNames.length; i++) {
        this.polls[this.pollNames[i]].removeVoter(userId);
    }
};
method.addVoter = function(user){
    for (var i=0; i<this.pollNames.length; i++) {
        this.polls[this.pollNames[i]].addVoter(user);
    }
};

method.ColorIterator = function(){
    var color_index = 0;
    var colors = {'blue': '#64B5F6','green': '#81C784',
        'orange': '#FFB74D','brown': '#A1887F','pink': '#F06292',
        'purple': '#BA68C8','red': '#E57373','cyan': '#4DD0E1',
        'deep_purple': '#9575CD','light_blue': '#4FC3F7','yellow': '#FFF176',
        'indigo': '#7986CB', 'teal': '#4DB6AC','light_green': '#AED581',
        'amber': '#FFD54F','lime': '#DCE775', 'deep_orange': '#FF8A65',
        'blue_grey': '#90A4AE'};
    var colors_list = Object.keys(colors).map(function(key){return colors[key];});
    return {
        next: function() {
            return colors_list[color_index++%colors_list.length];
        }
    }
};

method.addUser = function(user) {
    user.color = this.color_iterator.next();
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
    // add user to all polls
    this.addVoter(user);
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

    // make sure votes are still able to finish
    this.removeVoter(userId);

    // keep a record of user who left
    this.deadUsers.push(new PublicUser(this.users[userId].user));
    
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
        var user = this.users[curr_id].user;
        list.push(user);
        curr_id = this.users[curr_id].next.user.id;
    }
    return list;
};

method.getDeadUsers = function() {
    return this.deadUsers;
};

method.userSubmission = function(user, submission){
    // check turn
    var errMsg = "Not your turn";
    if (this.whoseTurn().id === user.id){
        // check rules of the game
        errMsg = isInvalidPlay(submission, this.options);
        // apply update to story
        if (errMsg === null) {
            this.nextTurn();
            this.story.addToStory(submission, user);
            // reset polls
            this.initAllPolls();
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



