
var Story = require(__dirname+"/Story.js");
var PublicUser = require(__dirname+"/PublicUser.js");
var Vote = require(__dirname+"/Vote.js");
var Options = require(__dirname+"/Options.js");

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
    this.options = new Options();
    this.turn = null;
    this.host = null;
    this.users = {};
    this.deadUsers = [];
    this.color_iterator = this.ColorIterator();
    this.polls = {};
    this.pollNames = ['vote skip turn', 'vote undo story'];
    this.initAllPolls();
}

method.getOptions = function(){
    return this.options;
};

method.getStory = function(){
    return this.story.continuations;
};

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
    // assign new color
    user.color = this.color_iterator.next();
    // assign host, if needed
    if (this.host === null) {
        this.host = user.id;
        user.isHost = true;        
    }
    // insert to last turn position
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

    this.users[userId].user.isHost = false;
    if (Object.keys(this.users).length <= 1){
        this.turn = null;
        this.host = null;

    }
    else {
        // pass host on to next person if necessary
        if (this.host === userId){
            this.host = this.users[this.host].next.user.id;
        }
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
method.getHost = function() {
    return this.users[this.host].user;
}

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
    // ideogram support
    if (hasIdeogram(msg)){
        var ideograms = /([ \u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d])/;
        tokens = msg.split(ideograms);
        // remove empty and whitespace strings
        tokens = tokens.filter(function(str){ return /\S/.test(str); });
    }

    var count = 0;
    for (var i=0; i<tokens.length; i++){
        var token = tokens[i];
        // ideogram support
        if (isIdeogramPunct(token)) continue;
        if (!isAlphaWithPunct(token) && !isNumericWithPunct(token)
                && !isEndingPunct(token)
                // ideogram support
                && !isIdeogram(token))
            return "Invalid token";
        else if (isEndingPunct(token))
            continue;
        else
            count++;
    }
    // TODO: incorporate full sentence option (instead of max n words)
    // max N words
    if (!(count <= opt.maxWords)) {
        return "Too many tokens";
    }
    // check if final word has ending punct
    var last = tokens[tokens.length-1];
    var lastchar = last[last.length-1];
    if (isEndingPunct(lastchar) || isIdeogramPunct(lastchar))
        return "Cannot end with punctuation";

    // if msg is valid, return null
    return null;
}

function isAlphaWithPunct(str) {
    // note \u00C0-\u017F are non-english characters, etc
    // \u00A1\u00BF are upside down exclamation/question mark
    // \u201C\u201D are left and right quotation
    return /^[(<'"\u00A1\u00BF\u201C]*[a-zA-Z\u00C0-\u017F@&'-]+[.,!?;:)>'"\u201D]*$/.test(str);
}

function isNumericWithPunct(str) {
    return /^[$#-]*[0-9-,.:]+(st|nd|rd|th)?$/.test(str);
}


function isEndingPunct(str){
    return /^[.,!?;:)>'"\u201D]+$/.test(str);
}

// Ideograph support: punctuation=\u3000-\u303f
// ideographic space = \u3000
// comma = 3001
// period = 3002
// ditto = 3003
// lr brackets = 3008-3011
// quotes = 301D-301F
function isIdeogramPunct(str){
    return /^[\u3001-\u303f]+$/.test(str);
}

function isIdeogram(str){
    // test for single ideogram
    return /^[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]$/.test(str);
}

function hasIdeogram(str){
     return /[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/.test(str);
}