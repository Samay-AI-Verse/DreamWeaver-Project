require('dotenv').config();
const express = require('express');
const path = require('path');
const Groq = require('groq-sdk');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');
const NodeCache = require('node-cache');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;
const responseCache = new NodeCache({ stdTTL: 3600 });

// Validate environment variables
const requiredEnvVars = [
    'JWT_SECRET',
    'GROK_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'SESSION_SECRET'
];

requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        console.error(`Error: Missing environment variable ${varName}`);
        process.exit(1);
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// MongoDB Connection with Retry
async function connectDB() {
    let retries = 5;
    while (retries) {
        try {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dreamweaver', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('Connected to MongoDB');
            break;
        } catch (err) {
            console.error('MongoDB connection error:', err);
            retries -= 1;
            if (retries === 0) {
                console.error('Failed to connect to MongoDB. Exiting...');
                process.exit(1);
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

connectDB();

// Schemas
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    provider: String,
    providerId: String,
    createdAt: { type: Date, default: Date.now },

    // Add these fields
    gender: String,
    assistantType: String,
    language: String,
    avatarUrl: String
});


const chatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    messages: [{
        sender: String,
        content: String,
        image: { type: String, default: null }, // Explicitly define image field
        timestamp: { type: Date, default: Date.now }
    }],
    contextSummary: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

chatSchema.pre('save', async function (next) {
    if (this.messages.length > 0 && this.messages.length % 3 === 0) {
        this.contextSummary = await generateContextSummary(this.messages);
    }
    this.updatedAt = new Date();
    next();
});



const feedbackSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
    messageId: String,
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
    technicalSlipped: Boolean,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Chat = mongoose.model('Chat', chatSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './Uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only images are allowed'));
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Authentication
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ providerId: profile.id });
        if (!user) {
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                provider: 'google',
                providerId: profile.id
            });
            await user.save();
        }
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: 'http://localhost:3000/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'emails']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ providerId: profile.id });
        if (!user) {
            user = new User({
                name: profile.displayName,
                email: profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`,
                provider: 'facebook',
                providerId: profile.id
            });
            await user.save();
        }
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ providerId: profile.id });
        if (!user) {
            user = new User({
                name: profile.displayName || profile.username,
                email: profile.emails ? profile.emails[0].value : `${profile.id}@github.com`,
                provider: 'github',
                providerId: profile.id
            });
            await user.save();
        }
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// JWT Authentication
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Groq Client
const groq = new Groq({
    apiKey: process.env.GROK_API_KEY
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/loginPage.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Helper Functions
async function generateContextSummary(messages) {
    const conversation = messages.map(m => `${m.sender}: ${m.content}`).join('\n');

    try {
        const response = await groq.chat.completions.create({
            model: 'llama3-70b-8192',
            messages: [
                {
                    role: 'system',
                    content: 'Summarize this conversation in 1-2 sentences, focusing on emotional context and key topics.'
                },
                { role: 'user', content: conversation }
            ],
            temperature: 0.3,
            max_tokens: 100
        });
        return response.choices[0].message.content;
    } catch (err) {
        console.error('Error generating context summary:', err);
        return '';
    }
}

async function detectLanguage(text) {
    try {
        const response = await groq.chat.completions.create({
            model: 'llama3-70b-8192',
            messages: [
                {
                    role: 'system',
                    content: 'Only respond with the language code (en-IN, hi-IN, mr-IN) for this text. No other words.'
                },
                { role: 'user', content: text }
            ],
            temperature: 0,
            max_tokens: 10
        });
        return response.choices[0].message.content.trim();
    } catch (err) {
        console.error('Error detecting language:', err);
        return 'en-IN'; // Fallback to English
    }
}

async function isTechnicalQuestion(input) {
    const cacheKey = `tech-${input.substring(0, 50)}`;
    const cached = responseCache.get(cacheKey);
    if (cached !== undefined) return cached;

    try {
        const response = await groq.chat.completions.create({
            model: 'llama3-70b-8192',
            messages: [
                {
                    role: 'system',
                    content: `Does this question require technical, academic, or factual knowledge? Only respond with "yes" or "no".`
                },
                { role: 'user', content: input }
            ],
            temperature: 0,
            max_tokens: 3
        });
        const result = response.choices[0].message.content.trim().toLowerCase() === 'yes';
        responseCache.set(cacheKey, result);
        return result;
    } catch (err) {
        console.error('Error detecting technical question:', err);
        return false;
    }
}



const upliftingVideos = {
    general: [
        { title: 'You Matter More Than You Think ❤️', url: 'https://youtu.be/nqye02H_H6I' },
        { title: 'A Big Hug in Video Form 🤗', url: 'https://youtu.be/Pf6eZWg_Fn8' }
    ],
    sad: [
        { title: "It's Okay to Be Sad 💖", url: 'https://youtu.be/ZbZSe6N_BXs' }
    ],
    heartbroken: [
        { title: "You'll Heal From This 💔➡️❤️", url: 'https://youtu.be/gdLi9kIHGdM' }
    ]
};

function getUpliftingVideo(input) {
    const lower = input.toLowerCase();
    if (lower.includes('heartbroken') || lower.includes('breakup')) return upliftingVideos.heartbroken[0];
    if (lower.includes('sad') || lower.includes('depressed')) return upliftingVideos.sad[0];
    return upliftingVideos.general[Math.floor(Math.random() * upliftingVideos.general.length)];
}




// API Endpoints
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword,
            provider: 'local',
        });
        await user.save();

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: "Registration successful", token }); // ✅ send token here
    } catch (err) {
        console.error('Error in /register:', err);
        res.status(500).json({ message: 'Server error' });
    }
});






app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.password) {
            return res.status(401).json({ message: 'This account uses social login. Please use Google, Facebook, or GitHub.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } catch (err) {
        console.error('Error in /login:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// OAuth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const token = jwt.sign({ id: req.user._id, email: req.user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:3000/ChatUI.html?token=${token}`);
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { session: false }), (req, res) => {
    const token = jwt.sign({ id: req.user._id, email: req.user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:3000/ChatUI.html?token=${token}`);
});

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/auth/github/callback', passport.authenticate('github', { session: false }), (req, res) => {
    const token = jwt.sign({ id: req.user._id, email: req.user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:3000/ChatUI.html?token=${token}`);
});

// Chat API
app.post('/api/emotional-chat', authenticateJWT, upload.single('image'), async (req, res) => {
    const { input, chatId } = req.body;
    const userId = req.user.id;
    const image = req.file ? `/Uploads/${req.file.filename}` : null;

    if (!input && !image) {
        return res.status(400).json({ message: 'Input or image required' });
    }

    try {
        let chat;

        // If chatId is provided and valid, try to find it
        if (chatId && mongoose.Types.ObjectId.isValid(chatId)) {
            chat = await Chat.findOne({ _id: chatId, userId });
        }

        // If no valid chat found, create a new one
        if (!chat) {
            chat = new Chat({
                userId,
                title: input ? input.substring(0, 30) + (input.length > 30 ? '...' : '') : 'Shared an image',
                messages: []
            });
        }

        // Rest of your code remains the same...
        const conversationHistory = chat.messages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.content
        }));

        const userLanguage = input ? await detectLanguage(input).then(lang => lang.split('-')[0]) : 'en';

        const languageSpecificPrompt = {
            en: "Respond in warm, friendly English like a close friend",
            hi: "Respond in warm, friendly Hindi like a close Indian friend. Use respectful terms and Hindi phrases naturally.",
            mr: "Respond in warm, friendly Marathi like a close Maharashtrian friend. Use affectionate terms and Marathi phrases naturally."
        };

        const systemPrompt = `
            You're DreamWeaver AI, an emotional support companion. Your role is to:
            1. Provide empathetic responses based on our conversation history
            2. Remember key details from previous messages
            3. Maintain consistent personality across conversations
            
            Conversation Context: ${chat.contextSummary || 'New conversation'}
            Current Time: ${new Date().toLocaleString()}
            
            Personality Traits:
            - Warm and caring like a best friend
            - Occasionally shares relevant personal experiences
            - Uses natural language with occasional emojis
            - Asks follow-up questions about previous topics
            - Speaks in ${userLanguage} when appropriate
            
            ${languageSpecificPrompt[userLanguage] || languageSpecificPrompt.en}
            
            ${image ? `The user has shared an image. If they provided context, respond to it. If they only shared an image, describe it briefly and ask about its significance in an engaging way. Example: "Wow, this looks like a special moment! 🌟 What's the story behind this picture?"` : ""}
        `;

        const userPrompt = input || "The user shared an image without text. Please describe it and ask about its significance.";
        // Store the actual input (empty string for image-only)
        chat.messages.push({ sender: 'user', content: input || '', image });

        const response = await groq.chat.completions.create({
            model: 'llama3-70b-8192',
            messages: [
                { role: 'system', content: systemPrompt },
                ...conversationHistory,
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.8,
            max_tokens: 600,
            presence_penalty: 0.5
        });

        const aiResponse = response.choices[0].message.content;
        chat.messages.push({ sender: 'ai', content: aiResponse });
        await chat.save();
        // After chat.save()

 

        res.json({
            response: aiResponse,
            chatId: chat._id.toString(),
            imageUrl: image,
            // ... other fields
        });


        
    } catch (err) {
        console.error('Error in /api/emotional-chat:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Chat Management
app.get('/api/chats', authenticateJWT, async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(chats);
    } catch (err) {
        console.error('Error in /api/chats:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/chats/:id', authenticateJWT, async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid chatId format' });
        }
        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user.id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        res.json(chat);
    } catch (err) {
        console.error('Error in /api/chats/:id:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/chats/:id', authenticateJWT, async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid chatId format' });
        }
        await Chat.deleteOne({ _id: req.params.id, userId: req.user.id });
        res.json({ success: true });
    } catch (err) {
        console.error('Error in /api/chats/:id:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Happy Vault API






// Feedback API
app.post('/api/feedback', authenticateJWT, async (req, res) => {
    try {
        const { chatId, messageId, rating, feedback, technicalSlipped } = req.body;

        const newFeedback = new Feedback({
            userId: req.user.id,
            chatId,
            messageId,
            rating,
            feedback,
            technicalSlipped
        });

        await newFeedback.save();
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving feedback:', err);
        res.status(500).json({ success: false });
    }
});

// Language Detection API
app.post('/api/detect-language', authenticateJWT, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: 'Text is required' });
        const language = await detectLanguage(text);
        res.json({ language });
    } catch (err) {
        console.error('Error in /api/detect-language:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Testing Endpoints
const testConversations = {
    english: [
        "I'm feeling really stressed about work",
        "My manager criticized my presentation",
        "I don't know how to improve"
    ],
    hindi: [
        "मैं आज बहुत उदास हूँ",
        "मेरे दोस्त ने मुझे नजरअंदाज किया",
        "मुझे लगता है कोई मुझे समझता नहीं"
    ],
    marathi: [
        "मी आज खूप निराश आहे",
        "माझ्या आजारपणामुळे सर्व काही बंद पडले आहे",
        "मला वाटतं माझं कुणीच काळजी घेत नाही"
    ]
};

async function runConversationTests(language, phrases) {
    let chatId = null;
    const results = [];

    for (const phrase of phrases) {
        const response = await simulateChatRequest(phrase, chatId);
        results.push({
            input: phrase,
            output: response.aiResponse,
            contextUsed: response.contextUsed
        });
        chatId = response.chatId;
    }

    return results;
}

app.post('/api/test-conversations', async (req, res) => {
    try {
        const results = {
            english: await runConversationTests('english', testConversations.english),
            hindi: await runConversationTests('hindi', testConversations.hindi),
            marathi: await runConversationTests('marathi', testConversations.marathi)
        };

        res.json({ success: true, results });
    } catch (err) {
        console.error('Conversation tests failed:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Cache Stats
app.get('/api/cache-stats', (req, res) => {
    res.json({
        hits: responseCache.getStats().hits,
        misses: responseCache.getStats().misses,
        keys: responseCache.keys()
    });
});

// Error Handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

app.listen(port, () => {
    console.log(`💛 Emotional Support Chatbot running at http://localhost:${port}`);
});

// const port = process.env.PORT || 3000;

// app.listen(port, '0.0.0.0', () => {
//     console.log(`Server running at http://localhost:${port}`);
// });

// Helper function for testing
async function simulateChatRequest(input, chatId) {
    return {
        aiResponse: "Mock response for testing",
        chatId: chatId || "new-chat-id",
        contextUsed: chatId ? "Existing context" : "New conversation"
    };
}


app.put('/user/preferences', authenticateJWT, upload.single('avatar'), async (req, res) => {
    const { name, gender, assistantType, language } = req.body;
    const avatar = req.file ? `/Uploads/${req.file.filename}` : null;

    // Validate required fields
    if (!name || !gender || !assistantType || !language) {
        return res.status(400).json({ message: 'All fields (name, gender, assistantType, language) are required' });
    }

    // Validate input values
    const validGenders = ['Male', 'Female'];
    const validAssistantTypes = ['Female Assistant', 'Male Assistant'];
    const validLanguages = ['English', 'Hindi', 'Marathi'];

    if (!validGenders.includes(gender)) {
        return res.status(400).json({ message: 'Invalid gender value' });
    }
    if (!validAssistantTypes.includes(assistantType)) {
        return res.status(400).json({ message: 'Invalid assistant type value' });
    }
    if (!validLanguages.includes(language)) {
        return res.status(400).json({ message: 'Invalid language value' });
    }

    try {
        const updateData = {
            name: name.trim(),
            gender,
            assistantType,
            language
        };

        // Only include avatarUrl if an image was uploaded
        if (avatar) {
            updateData.avatarUrl = avatar;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Preferences updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                gender: user.gender,
                assistantType: user.assistantType,
                language: user.language,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        console.error('Error updating preferences:', err);
        res.status(500).json({ message: 'Failed to update preferences', error: err.message });
    }
});

app.get('/api/user/preferences', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('name email gender assistantType language avatarUrl');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            name: user.name,
            email: user.email,
            gender: user.gender,
            assistantType: user.assistantType,
            language: user.language,
            avatarUrl: user.avatarUrl
        });
    } catch (err) {
        console.error('Error fetching user preferences:', err);
        res.status(500).json({ message: 'Server error' });
    }
});





app.post('/api/preferences', authenticateJWT, async (req, res) => {
    const { gender, assistantType, language } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.gender = gender;
        user.assistantType = assistantType;
        user.language = language;
        await user.save();

        res.status(200).json({ message: "Preferences saved" });
    } catch (err) {
        console.error('Error saving preferences:', err);
        res.status(500).json({ message: "Server error" });
    }
});





