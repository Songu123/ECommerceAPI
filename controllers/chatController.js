const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

// Tạo phòng chat mới
const createChatRoom = asyncHandler(async (req, res) => {
  const { name } = req.body;
  
  const existingRoom = await ChatRoom.findOne({ name });
  if (existingRoom) {
    res.status(400);
    throw new Error('Phòng chat đã tồn tại');
  }

  const chatRoom = new ChatRoom({
    name,
    members: [req.user._id]
  });

  const createdRoom = await chatRoom.save();
  res.status(201).json(createdRoom);
});

// Lấy danh sách phòng chat
const getChatRooms = asyncHandler(async (req, res) => {
  const chatRooms = await ChatRoom.find({}).populate('members', 'name email');
  res.json(chatRooms);
});

// Tham gia phòng chat
const joinChatRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  
  const chatRoom = await ChatRoom.findById(roomId);
  if (!chatRoom) {
    res.status(404);
    throw new Error('Phòng chat không tồn tại');
  }

  if (!chatRoom.members.includes(req.user._id)) {
    chatRoom.members.push(req.user._id);
    await chatRoom.save();
  }

  res.json({ message: 'Tham gia phòng chat thành công' });
});

// Lấy tin nhắn của phòng chat
const getMessages = asyncHandler(async (req, res) => {
  const { roomName } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const messages = await Message.find({ chatRoom: roomName })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  res.json(messages.reverse()); // Đảo ngược để hiển thị tin nhắn cũ trước
});

// Xóa tin nhắn
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  
  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error('Tin nhắn không tồn tại');
  }

  // Chỉ cho phép xóa tin nhắn của chính mình hoặc admin
  if (message.sender !== req.user.name && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Không có quyền xóa tin nhắn này');
  }

  await message.deleteOne();
  res.json({ message: 'Tin nhắn đã được xóa' });
});

module.exports = {
  createChatRoom,
  getChatRooms,
  joinChatRoom,
  getMessages,
  deleteMessage
};
