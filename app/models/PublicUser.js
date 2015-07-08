
var method = PublicUser.prototype;

function PublicUser(user){
	this.name = user.name;
	this.publicid = user.publicid;
	this.color = user.color;
	this.isHost = user.isHost;
}

method.myMethod = function(){};

module.exports = PublicUser;
