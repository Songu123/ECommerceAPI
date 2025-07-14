const express = require('express');
const ChatRoom = require('../models/ChatRoom');
const router = express.Router();

router.post('/', async (req, res) => {
    const {name, members} = req.body;
    const room = new ChatRoom({name, members});
    await room.save();
    res.status(201).json(room);
})

router.get('/', async (req, res) => {
    const rooms = await ChatRoom.find().populate('members');
    res.json(rooms);
})

module.exports = router;