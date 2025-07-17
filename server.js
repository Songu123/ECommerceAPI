const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const cors = require('cors');
const app = express();
const { swaggerUi, swaggerSpec } = require('./config/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

dotenv.config();
connectDB(); // Added parentheses to call the function
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/uploads', express.static('uploads')); // Serve static files from the uploads directory

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Khi user tham gia phòng chat
    socket.on('joinRoom', async (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
        
        // Gửi tin nhắn cũ cho user mới tham gia
        try {
            const Message = require('./models/Message');
            const oldMessages = await Message.find({ chatRoom: roomId })
                .sort({ createdAt: -1 })
                .limit(50);
            
            socket.emit('oldMessages', oldMessages.reverse());
        } catch (error) {
            console.error('Error loading old messages:', error);
        }
    });

    // Khi user gửi tin nhắn
    socket.on('sendMessage', async (data) => {
        try {
            const Message = require('./models/Message');
            const message = new Message({
                chatRoom: data.chatRoom,
                sender: data.sender,
                text: data.text
            });
            await message.save();
            io.to(data.chatRoom).emit('newMessage', message);
            console.log('Message saved and broadcast:', {
                room: message.chatRoom,
                sender: message.sender,
                text: message.text
            });
        } catch (error) {
            console.error('Error handling message:', error);
            socket.emit('errorMessage', { error: 'Không thể gửi tin nhắn' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.use(express.static(path.join(__dirname, 'public'))); 


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
