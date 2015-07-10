
var PublicUser = require(__dirname+'/../models/PublicUser.js');


var method = VoteManager.prototype;
function VoteManager(){
	// manages voting functionality
}

// refresh votes
method.getVotes = function(client, room){
	var pollNames = room.pollNames;
    for (var i=0; i<pollNames.length; i++){
    client.emit(pollNames[i],
        {votes: room.getPoll(pollNames[i]).numAyes(),
        total: room.getPoll(pollNames[i]).numMajority()});
    }
};


method.submitVote = function(io, user, room, voteType){
    // make sure voteType is valid
    if (!(voteType in vote_cb)) return;
    room.getPoll(voteType).submitVote(user);
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



module.exports = VoteManager;
