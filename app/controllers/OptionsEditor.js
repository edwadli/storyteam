
var Options = require(__dirname+'/../models/Options.js');

var method = OptionsEditor.prototype;
function OptionsEditor(){
	// manages in-game options
}

method.updateOption = function(io, room, optionType, data){
	//TODO: make user changes
	io.to(room.name).emit('options', room.getOptions());
};

method.getOptions = function(client, room){
	client.emit('options', room.getOptions());
};


module.exports = OptionsEditor;
