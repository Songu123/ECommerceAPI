const mongoose  = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    name: String,
    members:  String,
})

module.exports = mongoose.model('ChatRoom', chatRoomSchema);