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
    // note \u00C0-\u017F are non-english characters, etc
    // \u00A1\u00BF are upside down exclamation/question mark
    // \u201C\u201D are left and right quotation
    return /^[(<'"\u00A1\u00BF\u201C]*[a-zA-Z\u00C0-\u017F@&'-]+[.,!?;:)>'"\u201D]*$/.test(str);
}

function isNumericWithPunct(str) {
    return /^[$#-]*[0-9-,.:]+(st|nd|rd|th)?$/.test(str);
}


module.exports = Story;

