const express = require('express');
const router = express.Router();
const {
  createChatRoom,
  getChatRooms,
  joinChatRoom,
  getMessages,
  deleteMessage
} = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

// Routes cho phòng chat
router.route('/rooms')
  .post(protect, createChatRoom)
  .get(protect, getChatRooms);

router.put('/rooms/:roomId/join', protect, joinChatRoom);

// Routes cho tin nhắn
router.get('/messages/:roomName', protect, getMessages);
router.delete('/messages/:messageId', protect, deleteMessage);

module.exports = router;
