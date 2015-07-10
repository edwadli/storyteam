
var Options = require(__dirname+'/../models/Options.js');

var method = OptionsEditor.prototype;
function OptionsEditor(){
	// manages in-game options
}

method.updateOption = function(io, room, user, optionType, data){
	// make sure user is host
	if (room.host !== user.id) return;
	// make sure optionType is valid
	if (!(optionType in option_cb)) return;
	//make user changes
	option_cb[optionType](room, data);
	io.to(room.name).emit('options', room.getOptions());
};

method.getOptions = function(client, room){
	client.emit('options', room.getOptions());
};

var option_cb = {
	'numWords': function(room, data){
		var x = parseInt(data);
		if (x !== NaN && x > 0) room.options.maxWords = x;
	},
	'doNothing': function(room, data){
		return;
	}
};

module.exports = OptionsEditor;
