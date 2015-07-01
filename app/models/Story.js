

var method = Story.prototype;

function Story() {
    this.continuations = [];
    this.text = "";
}


method.addToStory = function(msg, author){
    if (isAlphaWithPunct(msg[0]) || isAlphaWithPunct(msg.substr(0,2))
        || isNumericWithPunct(msg[0]) || isNumericWithPunct(msg.substr(0,2)))
        msg = ' '+msg;
    if (msg[msg.length-1] === ' ')
        msg = msg.substr(0,msg.length-1);
    this.text += msg;
    this.continuations.push({text: msg, author: author});
}

function isAlphaWithPunct(str) {
    return /^[(<'"]*[a-zA-Z&'-]+[.,!?;:)>'"]*$/.test(str);
}

function isNumericWithPunct(str) {
    return /^[$-]*[0-9-,.:]+$/.test(str);
}


module.exports = Story;

