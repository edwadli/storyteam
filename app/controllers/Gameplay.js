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
method.getVotes = function(client, room){
	var pollNames = room.pollNames;
    for (var i=0; i<pollNames.length; i++){
    client.emit(pollNames[i],
        {votes: room.getPoll(pollNames[i]).numAyes(),
        total: room.getPoll(pollNames[i]).numMajority()});
    }
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
method.submitVote = function(io, user, room, voteType){
    room.getPoll(voteType).submitVote(user, true);
    if (room.getPoll(voteType).hasMajority()){
        vote_cb[voteType](io, {user:user, room:room, voteType:voteType});
    }
    io.to(room.name).emit(voteType,
        {votes: room.getPoll(voteType).numAyes(),
            total: room.getPoll(voteType).numMajority()});
};
// voting helper methods
var vote_cb = {
    'vote skip turn': function(io, data){
        // skip this person's turn
        data.room.nextTurn();
        // reset the polls
        data.room.newPoll(data.voteType);
        // notify change of turns
        io.to(data.room.name).emit('user turn', new PublicUser(data.room.whoseTurn()));
    },
    'vote undo story': function(io, data){
        // undo last continuation and go back a turn
        data.room.story.undoLast();
        data.room.prevTurn();
        // reset the polls
        data.room.newPoll(data.voteType);
        // notify user change of story and turns
        io.to(data.room.name).emit("story",
            {
                story: data.room.getStory(),
                turn: new PublicUser(data.room.whoseTurn())
            }
        );
        io.to(data.room.name).emit('user turn', new PublicUser(data.room.whoseTurn()));
    }
};

module.exports = Gameplay;
