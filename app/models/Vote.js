

var method = Vote.prototype;
function Vote(users) {
	// initialize records with user ids
	this.ayes = 0;
	this.nays = 0;
	this.records = {};
	for (var i=0; i<users.length; i++){
		var user = users[i];
		this.records[user.id] = {user: user, isAye: null};
	}
}

method.submitVote = function(user, isAye){
	// check if user is a registered voter
	if (!(user.id in this.records)) return;
	if (this.records[user.id].isAye !== null) return;

	if (isAye === 'true'){
		this.ayes += 1;
		this.records[user.id].isAye = 'true';
	}
	else {
		this.nays += 1;
		this.records[user.id].isAye = 'false';
	}
};

method.isDone = function() {
	if (this.records.length === this.ayes+this.nays) return true;
	else return false;
};



module.exports = Vote;
