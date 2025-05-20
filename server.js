require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const products = [
    {
        name: "Simple Kind to Skin Moisturizing Facial Wash",
        imageLink: "https://simple-skincare.s3.amazonaws.com/moisturizing-facial-wash.jpg",
        category: "Cleanser",
        benefits: "Gentle cleansing, hydrating, suitable for sensitive skin",
        price: "RM 19.90",
        ingredients: "Water, Glycerin, Chamomile, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Replenishing Rich Moisturizer",
        imageLink: "https://simple-skincare.s3.amazonaws.com/rich-moisturizer.jpg",
        category: "Moisturizer",
        benefits: "Deep hydration, non-greasy, suitable for dry skin",
        price: "RM 24.90",
        ingredients: "Water, Glycerin, Borage Seed Oil, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Soothing Facial Toner",
        imageLink: "https://simple-skincare.s3.amazonaws.com/soothing-toner.jpg",
        category: "Toner",
        benefits: "Balances skin pH, removes impurities, soothes skin",
        price: "RM 18.90",
        ingredients: "Water, Glycerin, Chamomile, Witch Hazel, Vitamin E"
    },
    {
        name: "Simple Kind to Skin Vital Vitamin Night Cream",
        imageLink: "https://simple-skincare.s3.amazonaws.com/vital-vitamin-night-cream.jpg",
        category: "Night Cream",
        benefits: "Overnight repair, brightening, anti-aging",
        price: "RM 29.90",
        ingredients: "Water, Glycerin, Vitamin B3, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Micellar Cleansing Water",
        imageLink: "https://simple-skincare.s3.amazonaws.com/micellar-water.jpg",
        category: "Makeup Remover",
        benefits: "Gentle makeup removal, no rinsing needed, hydrating",
        price: "RM 22.90",
        ingredients: "Water, Glycerin, Chamomile, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Light Moisturizer",
        imageLink: "https://simple-skincare.s3.amazonaws.com/light-moisturizer.jpg",
        category: "Moisturizer",
        benefits: "Lightweight hydration, non-greasy, suitable for oily skin",
        price: "RM 21.90",
        ingredients: "Water, Glycerin, Vitamin E, Pro-Vitamin B5, Allantoin"
    },
    {
        name: "Simple Kind to Skin Refreshing Facial Wash",
        imageLink: "https://simple-skincare.s3.amazonaws.com/refreshing-facial-wash.jpg",
        category: "Cleanser",
        benefits: "Deep cleansing, refreshing, suitable for normal skin",
        price: "RM 19.90",
        ingredients: "Water, Glycerin, Chamomile, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Hydrating Light Moisturizer",
        imageLink: "https://simple-skincare.s3.amazonaws.com/hydrating-light-moisturizer.jpg",
        category: "Moisturizer",
        benefits: "Light hydration, fast-absorbing, suitable for combination skin",
        price: "RM 22.90",
        ingredients: "Water, Glycerin, Vitamin E, Pro-Vitamin B5, Allantoin"
    },
    {
        name: "Simple Kind to Skin Smoothing Facial Scrub",
        imageLink: "https://simple-skincare.s3.amazonaws.com/smoothing-scrub.jpg",
        category: "Exfoliator",
        benefits: "Gentle exfoliation, smooth skin, unclog pores",
        price: "RM 23.90",
        ingredients: "Water, Glycerin, Microbeads, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Nourishing Day Cream",
        imageLink: "https://simple-skincare.s3.amazonaws.com/nourishing-day-cream.jpg",
        category: "Day Cream",
        benefits: "Daily protection, nourishing, suitable for all skin types",
        price: "RM 26.90",
        ingredients: "Water, Glycerin, Vitamin E, Pro-Vitamin B5, Allantoin"
    },
    {
        name: "Simple Kind to Skin Cleansing Wipes",
        imageLink: "https://simple-skincare.s3.amazonaws.com/cleansing-wipes.jpg",
        category: "Makeup Remover",
        benefits: "Quick cleansing, portable, suitable for sensitive skin",
        price: "RM 15.90",
        ingredients: "Water, Glycerin, Chamomile, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Spotless Skin Triple Action Face Wash",
        imageLink: "https://simple-skincare.s3.amazonaws.com/triple-action-face-wash.jpg",
        category: "Cleanser",
        benefits: "Anti-blemish, deep cleansing, suitable for acne-prone skin",
        price: "RM 24.90",
        ingredients: "Water, Glycerin, Zinc PCA, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Protecting Light Moisturizer SPF 15",
        imageLink: "https://simple-skincare.s3.amazonaws.com/protecting-moisturizer-spf15.jpg",
        category: "Moisturizer with SPF",
        benefits: "Sun protection, lightweight, suitable for daily use",
        price: "RM 27.90",
        ingredients: "Water, Glycerin, SPF 15, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Replenishing Rich Moisturizer",
        imageLink: "https://simple-skincare.s3.amazonaws.com/replenishing-rich-moisturizer.jpg",
        category: "Moisturizer",
        benefits: "Rich hydration, nourishing, suitable for dry skin",
        price: "RM 25.90",
        ingredients: "Water, Glycerin, Borage Seed Oil, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Soothing Facial Toner",
        imageLink: "https://simple-skincare.s3.amazonaws.com/soothing-facial-toner.jpg",
        category: "Toner",
        benefits: "Balancing, soothing, suitable for sensitive skin",
        price: "RM 18.90",
        ingredients: "Water, Glycerin, Chamomile, Witch Hazel, Vitamin E"
    },
    {
        name: "Simple Kind to Skin Vital Vitamin Day Cream",
        imageLink: "https://simple-skincare.s3.amazonaws.com/vital-vitamin-day-cream.jpg",
        category: "Day Cream",
        benefits: "Brightening, protecting, suitable for all skin types",
        price: "RM 28.90",
        ingredients: "Water, Glycerin, Vitamin B3, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Micellar Make-Up Remover Wipes",
        imageLink: "https://simple-skincare.s3.amazonaws.com/micellar-wipes.jpg",
        category: "Makeup Remover",
        benefits: "Gentle makeup removal, no rinsing needed, hydrating",
        price: "RM 16.90",
        ingredients: "Water, Glycerin, Chamomile, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Smoothing Facial Scrub",
        imageLink: "https://simple-skincare.s3.amazonaws.com/smoothing-facial-scrub.jpg",
        category: "Exfoliator",
        benefits: "Gentle exfoliation, smooth skin, unclog pores",
        price: "RM 23.90",
        ingredients: "Water, Glycerin, Microbeads, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Nourishing Day Cream",
        imageLink: "https://simple-skincare.s3.amazonaws.com/nourishing-day-cream.jpg",
        category: "Day Cream",
        benefits: "Daily protection, nourishing, suitable for all skin types",
        price: "RM 26.90",
        ingredients: "Water, Glycerin, Vitamin E, Pro-Vitamin B5, Allantoin"
    },
    {
        name: "Simple Kind to Skin Cleansing Wipes",
        imageLink: "https://simple-skincare.s3.amazonaws.com/cleansing-wipes.jpg",
        category: "Makeup Remover",
        benefits: "Quick cleansing, portable, suitable for sensitive skin",
        price: "RM 15.90",
        ingredients: "Water, Glycerin, Chamomile, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Spotless Skin Triple Action Face Wash",
        imageLink: "https://simple-skincare.s3.amazonaws.com/triple-action-face-wash.jpg",
        category: "Cleanser",
        benefits: "Anti-blemish, deep cleansing, suitable for acne-prone skin",
        price: "RM 24.90",
        ingredients: "Water, Glycerin, Zinc PCA, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Protecting Light Moisturizer SPF 15",
        imageLink: "https://simple-skincare.s3.amazonaws.com/protecting-moisturizer-spf15.jpg",
        category: "Moisturizer with SPF",
        benefits: "Sun protection, lightweight, suitable for daily use",
        price: "RM 27.90",
        ingredients: "Water, Glycerin, SPF 15, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Replenishing Rich Moisturizer",
        imageLink: "https://simple-skincare.s3.amazonaws.com/replenishing-rich-moisturizer.jpg",
        category: "Moisturizer",
        benefits: "Rich hydration, nourishing, suitable for dry skin",
        price: "RM 25.90",
        ingredients: "Water, Glycerin, Borage Seed Oil, Vitamin E, Pro-Vitamin B5"
    },
    {
        name: "Simple Kind to Skin Soothing Facial Toner",
        imageLink: "https://simple-skincare.s3.amazonaws.com/soothing-facial-toner.jpg",
        category: "Toner",
        benefits: "Balancing, soothing, suitable for sensitive skin",
        price: "RM 18.90",
        ingredients: "Water, Glycerin, Chamomile, Witch Hazel, Vitamin E"
    }
];

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

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
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

// Store active threads
const activeThreads = new Map();

// Create a new thread
app.post('/api/thread', async (req, res) => {
    try {
        console.log('Creating new thread...');
        const thread = await openai.beta.threads.create();
        console.log('Thread created successfully:', thread.id);

        // Add welcome message to the thread
        const welcomeMessage = await openai.beta.threads.messages.create(thread.id, {
            role: 'user',
            content: "Please introduce yourself as Lumina, a friendly skincare assistant. Keep it brief and welcoming."
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
        while (runStatus !== 'completed') {
            await new Promise(resolve => setTimeout(resolve, 100));
            const statusCheck = await openai.beta.threads.runs.retrieve(thread.id, run.id);
            runStatus = statusCheck.status;
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

// Send message and get response
app.post('/api/chat', async (req, res) => {
    try {
        const { threadId, message, imageUrl } = req.body;
        console.log('Received request body:', req.body);
        console.log('Thread ID:', threadId);
        console.log('Message:', message);
        console.log('Image URL:', imageUrl);

        if (!threadId) {
            throw new Error('No thread ID provided');
        }

        if (!message && !imageUrl) {
            throw new Error('No message or image provided');
        }

        // Add message to thread
        console.log('Adding message to thread...');
        const messageContent = [];
        
        if (message) {
            messageContent.push({
                type: 'text',
                text: message
            });
        }

        if (imageUrl) {
            messageContent.push({
                type: 'image_url',
                image_url: {
                    url: imageUrl
                }
            });
        }

        const messageResponse = await openai.beta.threads.messages.create(threadId, {
            role: 'user',
            content: messageContent
        });
        console.log('Message added successfully:', messageResponse.id);

        // Run the assistant
        console.log('Creating run...');
        const run = await openai.beta.threads.runs.create(threadId, {
            assistant_id: process.env.ASSISTANT_ID,
            instructions: `You are Lumina, a friendly and knowledgeable skincare assistant. When providing steps or instructions:
1. Use numbered format (1., 2., 3., etc.)
2. Each step should be on a new line
3. Keep responses concise and conversational
4. Use clear, simple language
5. Add a blank line between steps for better readability`
        });
        console.log('Run created successfully:', run.id);

        // Poll for completion with faster intervals
        let runStatus = run.status;
        let attempts = 0;
        const maxAttempts = 40;
        const pollInterval = 50;

        while (runStatus !== 'completed' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            const statusCheck = await openai.beta.threads.runs.retrieve(threadId, run.id);
            runStatus = statusCheck.status;
            console.log('Run status:', runStatus);
            attempts++;

            if (runStatus === 'failed') {
                throw new Error('Assistant run failed');
            }

            if (runStatus === 'requires_action') {
                throw new Error('Assistant requires action');
            }

            if (attempts === maxAttempts && runStatus !== 'completed') {
                return res.json({ 
                    response: "I'm taking a bit longer than usual to process your request. Please try again in a moment.",
                    status: 'timeout'
                });
            }
        }

        // Get the messages with optimized retrieval
        console.log('Retrieving messages...');
        const messages = await openai.beta.threads.messages.list(threadId, {
            limit: 1,
            order: 'desc'
        });
        console.log('Messages retrieved:', messages.data.length);
        
        if (!messages.data[0] || !messages.data[0].content[0]) {
            throw new Error('No response from assistant');
        }

        const assistantMessage = messages.data[0].content[0].text.value;
        console.log('Assistant response:', assistantMessage);

        // Search products based on query
        const relevantProducts = products.filter(product => {
            const searchText = `${product.name} ${product.category} ${product.benefits} ${product.ingredients}`.toLowerCase();
            return searchText.includes(message.toLowerCase());
        });

        // If no products found, return a message
        if (relevantProducts.length === 0) {
            return res.json({
                response: "I couldn't find any products matching your query. Please try a different search term.",
                relevantProducts: []
            });
        }

        // Format product information
        const productInfo = relevantProducts.map(product => `
            Name: ${product.name}
            Category: ${product.category}
            Benefits: ${product.benefits}
            Price: ${product.price}
            Ingredients: ${product.ingredients}
            Image: ${product.imageLink}
        `).join('\n\n');

        // Return the product information
        res.json({
            response: `Here are the products that match your query:\n\n${productInfo}`,
            relevantProducts: relevantProducts
        });
    } catch (error) {
        console.error('Detailed error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to process message',
            details: error.message,
            type: error.type || 'unknown',
            stack: error.stack
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
    console.log('Assistant ID:', process.env.ASSISTANT_ID);
    console.log('API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('Open http://localhost:3000 in your browser');
}); 