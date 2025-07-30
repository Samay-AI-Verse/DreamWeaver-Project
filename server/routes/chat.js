const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const jwt = require('jsonwebtoken');

// JWT Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Get all chats for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(chats);
    } catch (err) {
        console.error('Error fetching chats:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new chat
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const chat = new Chat({
            userId: req.user.id,
            title: 'New DreamWeaver Chat',
            messages: []
        });
        await chat.save();
        res.json({ message: 'Chat created successfully', chatId: chat._id.toString() });
    } catch (err) {
        console.error('Error creating chat:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a message to a chat
router.post('/:chatId/message', authenticateToken, async (req, res) => {
    const { prompt, response } = req.body;
    try {
        const chat = await Chat.findOne({ _id: req.params.chatId, userId: req.user.id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        chat.messages.push({ prompt, response });
        await chat.save();

        // Update chat title based on the first message if it's the first message
        if (chat.messages.length === 1) {
            chat.title = prompt.substring(0, 30) + (prompt.length > 30 ? '...' : '');
            await chat.save();
        }

        res.json({ message: 'Message added successfully', chat });
    } catch (err) {
        console.error('Error adding message:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a specific chat
router.delete('/:chatId', authenticateToken, async (req, res) => {
    try {
        const chat = await Chat.findOneAndDelete({ _id: req.params.chatId, userId: req.user.id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        res.json({ message: 'Chat deleted successfully' });
    } catch (err) {
        console.error('Error deleting chat:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;