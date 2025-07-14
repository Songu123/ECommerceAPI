const express = require('express')
const Message = require('../models/Message')
const router = express.Router();

router.post('/', async (req, res) => {
    const {chatRoom, sender, text} = req.body
    const message = new Message({chatRoom, sender, text});
    await message.save();
    res.status(201).json(message);
})

router.get('/:id', async (req, res) => {
    const messages = await Message.find({chatRoom: req.params.id}).populate('sender', 'name email');
    res.json(messages);
})

module.exports = router;