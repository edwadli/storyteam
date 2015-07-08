

var method = Vote.prototype;
function Vote(users) {
	// initialize records with user ids
	this.pollOpen = true;
	this.ayes = 0;
	this.records = {};
	for (var i=0; i<users.length; i++){
		var user = users[i];
		this.records[user.id] = {user: user, voted: false};
	}
}

method.submitVote = function(user){
	// check if polls are open
	if (this.pollOpen === false) return;
	// registered voter
	if (!(user.id in this.records)) return;

	// undo previous vote
	if (this.records[user.id].voted === true)
	{
		this.records[user.id].voted = false;
		this.ayes -= 1;
	}
	else
	{
		this.records[user.id].voted = true;
		this.ayes += 1;
	}

};

method.openPolls = function() {
	this.pollOpen = true;
};

method.closePolls = function() {
	this.pollOpen = false;
};

method.removeVoter = function(userId){
	if (!(userId in this.records)) return;

	var record = this.records[userId];
	// undo vote
	if (record.voted === true) this.ayes--;
	// unregister voter
	delete this.records[userId];
};

method.addVoter = function(user){
    if (user.id in this.records) return;
    this.records[user.id] = {user: user, voted: false};
}

method.numVoters = function(){
	return Object.keys(this.records).length;
};
method.numAyes = function(){
	return this.ayes;
};

method.numMajority = function(){
	// majority = half plus one
	return Math.ceil((this.numVoters()+1)/2);
};
method.hasMajority = function(){
	if (this.numAyes() < this.numMajority()){
		return false;
	}
	else{
		return true;
	}
}

module.exports = Vote;

