
var method = PublicUser.prototype;

function PublicUser(user){
	this.name = user.name;
	this.publicid = user.publicid;
	this.color = user.color;
}

method.myMethod = function(){};

module.exports = PublicUser;
