

Basic Gameplay Functionality
TODO: vote undo story update
TODO: vote kick user
TODO: vote skip user turn (maybe after timeout)
TODO: prevent spam by continuous long strings (but still allow for
potentially made-up words/ other languages/ proper nouns).
TODO: pre-start page to wait for everyone to join the room?
TODO: let users set rules (maybe assign host for each room and only let host
set rules)


Basic Gameplay Aesthetics
TODO: assign colors to users
TODO: keep track of who made what contribution in the story (eg, by color)
TODO: notify user turn (sound+flashing)


Login/Joining
TODO: allow for leaving current room
TODO: option for private room
TODO: unique users/passwords


Security
TODO: onconnection assign user a password (eg some hash); on join room
assign user a pasword. Check these two before executing any user-initiated
server-side action. (currently it only checks for name of user and room to
validate identity.)

Optimization
TODO: add client-side validation and error messages (server should still
validate but not return error messages for user)
TODO: make sure server is sending minimal required information; make it
user-friendly on client side.
TODO: separate style sheets and scripts from jade html
TODO: refactor app.js


Gameplay Options
TODO: word count
TODO: timeout before skip turn
TODO: ending/starting input with punctuation input with punctuation
TODO: display story contribution tracking
TODO: allow/disallow new users after start (if we have a pre-start page)
TODO: max players
TODO: more modes: iambic pentameter, rhyming, non-alphabetic languages (eg,
chinese), limerick, sentence, everyone plays (where people vote on their
favorite continuation each turn) etc...

