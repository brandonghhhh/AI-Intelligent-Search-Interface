require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static('uploads'));

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// In-memory session store (for demo; use Redis or DB for production)
const sessions = {};

// List of allowed Simple® product names and their types
const simpleProductsData = [
    {
        name: 'Simple Kind to Skin Moisturizing Facial Wash',
        type: 'cleanser',
        description: 'Gentle cleansing, hydrating, suitable for sensitive skin',
        imageLink: 'https://www.simple.co.uk/dw/image/v2/AAUJ_PRD/on/demandware.static/-/Sites-simple-master-catalog/default/dw8c3c4f8c/images/large/Simple_Kind_To_Skin_Moisturising_Facial_Wash_150ml_Front_1.png'
    },
    {
        name: 'Simple Kind to Skin Replenishing Rich Moisturizer',
        type: 'moisturizer',
        description: 'Deep hydration, non-greasy, suitable for dry skin',
        imageLink: 'https://www.simple.co.uk/dw/image/v2/AAUJ_PRD/on/demandware.static/-/Sites-simple-master-catalog/default/dw8c3c4f8c/images/large/Simple_Kind_To_Skin_Replenishing_Rich_Moisturiser_50ml_Front_1.png'
    },
    {
        name: 'Simple Kind to Skin Soothing Facial Toner',
        type: 'toner',
        description: 'Balances skin pH, removes impurities, soothes skin',
        imageLink: 'https://www.simple.co.uk/dw/image/v2/AAUJ_PRD/on/demandware.static/-/Sites-simple-master-catalog/default/dw8c3c4f8c/images/large/Simple_Kind_To_Skin_Soothing_Facial_Toner_200ml_Front_1.png'
    }
];

// API: Create a new session/thread
app.post('/api/thread', async (req, res) => {
    try {
        console.log('Creating new thread...');
        const thread = await openai.beta.threads.create();
        console.log('Thread created successfully:', thread.id);

        // Add welcome message to the thread
        const welcomeMessage = await openai.beta.threads.messages.create(thread.id, {
            role: 'user',
            content: "Welcome! I am Lumina, your Simple® skincare assistant. How can I help you with Simple® products today?"
        });

        // Run the assistant to get the welcome response
        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: process.env.ASSISTANT_ID,
            instructions: `You are Lumina, a friendly and knowledgeable skincare assistant. When providing steps or instructions:
1. Use numbered format (1., 2., 3., etc.)
2. Each step should be on a new line
3. Keep responses concise and conversational
4. Use clear, simple language
5. Add a blank line between steps for better readability`
        });

        // Wait for the welcome message to be generated
        let runStatus = run.status;
        let attempts = 0;
        const maxAttempts = 10;
        const pollInterval = 25;
        while (runStatus !== 'completed' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            const statusCheck = await openai.beta.threads.runs.retrieve(thread.id, run.id);
            runStatus = statusCheck.status;
            attempts++;
        }

        // Get the welcome message
        const messages = await openai.beta.threads.messages.list(thread.id);
        const welcomeResponse = messages.data[0].content[0].text.value;

        res.json({ 
            threadId: thread.id,
            welcomeMessage: welcomeResponse
        });
    } catch (error) {
        console.error('Error creating thread:', error.message);
        console.error('Full error:', error);
        res.status(500).json({ 
            error: 'Failed to create thread',
            details: error.message,
            type: error.type || 'unknown'
        });
    }
});

// API: Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { threadId, message } = req.body;
        if (!threadId) throw new Error('No thread ID provided');
        if (!message) throw new Error('No message provided');

        // Prepare content for OpenAI API
        const imageUrls = [];
        const imgRegex = /<img[^>]+src=\"([^\">]+)\"/g;
        let match;
        while ((match = imgRegex.exec(message)) !== null) {
            imageUrls.push(match[1]);
        }
        const content = [{ type: 'text', text: message }];
        imageUrls.forEach(url => {
            content.push({ type: 'image_url', image_url: { url } });
        });

        // Add message to thread
        await openai.beta.threads.messages.create(threadId, {
            role: 'user',
            content: content
        });

        // Run the assistant with no special instructions (default behavior)
        const run = await openai.beta.threads.runs.create(threadId, {
            assistant_id: process.env.ASSISTANT_ID
        });

        // Wait for completion
        let runStatus = run.status;
        let attempts = 0;
        const maxAttempts = 40;
        const pollInterval = 50;
        while (runStatus !== 'completed' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            const statusCheck = await openai.beta.threads.runs.retrieve(threadId, run.id);
            runStatus = statusCheck.status;
            attempts++;
        }

        // Get the assistant's response
        const messages = await openai.beta.threads.messages.list(threadId);
        let assistantMessage = messages.data[0].content[0].text.value;

        // Remove OpenAI file reference artifacts like 【8:0†SimpleSkincare_Dataset.json】
        assistantMessage = assistantMessage.replace(/【\d+:\d+†[^】]+】/g, '');

        res.json({
            response: assistantMessage
        });
    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({
            error: 'Failed to process message',
            details: error.message
        });
    }
});

// Handle image upload
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            throw new Error('No image file uploaded');
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ 
            success: true, 
            imageUrl: imageUrl,
            message: 'Image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ 
            error: 'Failed to upload image',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler caught:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: err.message
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Open http://localhost:3000 in your browser');
}); 