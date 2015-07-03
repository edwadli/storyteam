var PublicUser = require(__dirname+"/PublicUser.js");


var method = Story.prototype;

function Story() {
    this.continuations = [];
}


method.addToStory = function(msg, user){
    // a little preprocessing
    if (isAlphaWithPunct(msg[0]) || isAlphaWithPunct(msg.substr(0,2))
        || isNumericWithPunct(msg[0]) || isNumericWithPunct(msg.substr(0,2)))
        msg = ' '+msg;
    if (msg[msg.length-1] === ' ')
        msg = msg.substr(0,msg.length-1);

    // update story
    this.continuations.push({text: msg, author: new PublicUser(user)});
};

method.undoLast = function(){
    this.continuations.pop();
}

function isAlphaWithPunct(str) {
    return /^[(<'"]*[a-zA-Z&'-]+[.,!?;:)>'"]*$/.test(str);
}

function isNumericWithPunct(str) {
    return /^[$-]*[0-9-,.:]+$/.test(str);
}


module.exports = Story;

