

var method = Story.prototype;

function Story() {
    this.text = "";
}


method.addToStory = function(msg){
    if (isAlphaWithPunct(msg[0]) || isAlphaWithPunct(msg.substr(0,2))
        || isNumericWithPunct(msg[0]) || isNumericWithPunct(msg.substr(0,2)))
        msg = ' '+msg;
    if (msg[msg.length-1] === ' ')
        msg = msg.substr(0,msg.length-1);
    this.text += msg;
}



module.exports = Story;

