var PublicUser = require(__dirname+'/../models/PublicUser.js');

var method = Gameplay.prototype;
function Gameplay(){
	// manages gameplay
}

// methods to refresh the views
method.getUserList = function(client, room){
	client.emit('user list',room.getUsers().map(function(user){return new PublicUser(user);}));
	client.emit('gone user list', room.getDeadUsers());
	client.emit("user turn", new PublicUser(room.whoseTurn()));
};
method.getStory = function(client, room){
    client.emit("story", 
	    {
	        story: room.getStory(),
	        turn: new PublicUser(room.whoseTurn())
	    }
	);
};

// methods that represent user actions in game
method.submitToStory = function(io, client, room, user, msg){
	var errMsg = room.userSubmission(user, msg);

    if (errMsg === null){
    	this.getStory(io.to(room.name), room);
        io.to(room.name).emit("user turn", new PublicUser(room.whoseTurn()));
    }
    else {
        client.emit('story error', {msg: errMsg});
    }
};


module.exports = Gameplay;
