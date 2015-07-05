

var method = Chat.prototype;
function Chat(){
	// manages chats
}

method.message = function(client, msg, room, user){
	// don't allow empty messages
    if (msg === '') return;
    client.broadcast.to(room.name).emit('chat', {name: user.name, msg: msg});
    client.emit('self chat', {name: user.name, msg: msg});
};


module.exports = Chat;
