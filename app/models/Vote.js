

var method = Vote.prototype;
function Vote(users) {
	// initialize records with user ids
	this.pollOpen = true;
	this.ayes = 0;
	this.nays = 0;
	this.records = {};
	for (var i=0; i<users.length; i++){
		var user = users[i];
		this.records[user.id] = {user: user, isAye: null};
	}
}

method.submitVote = function(user, isAye){
	// check if polls are open
	if (this.pollOpen === false) return;
	// registered voter
	if (!(user.id in this.records)) return;
	// haven't voted yet
	if (this.records[user.id].isAye !== null) return;

	if (isAye === true){
		this.ayes += 1;
		this.records[user.id].isAye = true;
	}
	else {
		this.nays += 1;
		this.records[user.id].isAye = false;
	}
};

method.isDone = function() {
	if (this.records.length === this.ayes+this.nays) return true;
	else return false;
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
	if (record.isAye === true) this.ayes--;
	else if (record.isAye === false) this.nays--;
	// unregister voter
	delete this.records[userId];
};

method.numVoters = function(){
	return Object.keys(this.records).length;
};
method.numAyes = function(){
	return this.ayes;
};
method.numNays = function(){
	return this.nay;
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
