require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { runQuery, getQuery } = require('./database');
const docs = require('./docs.json');

const app = express();
app.use(cors());
app.use(express.json());

// 7. Rate Limiting Setup
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: "Too many requests, please try again later." }
});
app.use('/api/', limiter);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// A. Chat Endpoint
app.post('/api/chat', async (req, res) => {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
        return res.status(400).json({ error: "sessionId and message are required." });
    }

    try {
        const timestamp = new Date().toISOString();

        // Ensure session exists
        await runQuery(`INSERT OR REPLACE INTO sessions (id, last_updated) VALUES (?, ?)`, [sessionId, timestamp]);

        // Save User Message
        await runQuery(`INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)`, 
            [sessionId, 'user', message, timestamp]);

        // 5. Fetch last 5 user + assistant pairs (10 messages total)
        const historyRows = await getQuery(
            `SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 10`,
            [sessionId]
        );
        const history = historyRows.reverse();

        // 6. Prompt Construction & 4. Document-Based Strict Rule
        const prompt = `
        You are a helpful support assistant. You MUST answer the user's question strictly using ONLY the information provided in the Document Context below.
        If the answer is not explicitly contained in the Document Context, you MUST respond EXACTLY with the phrase: "Sorry, I don't have information about that."
        Do not hallucinate, guess, or provide outside information.

        Document Context:
        ${JSON.stringify(docs, null, 2)}

        Recent Chat History:
        ${history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('
')}

        USER QUESTION: ${message}
        ASSISTANT:
        `;

        // Call Gemini LLM
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const replyText = result.response.text().trim();
        const tokensUsed = result.response.usageMetadata?.totalTokenCount || 0;

        // Save Assistant Message
        await runQuery(`INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)`, 
            [sessionId, 'assistant', replyText, new Date().toISOString()]);

        res.json({ reply: replyText, tokensUsed: tokensUsed });

    } catch (error) {
        console.error("LLM or DB Error:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
});

// B. Fetch Conversation
app.get('/api/conversations/:sessionId', async (req, res) => {
    try {
        const messages = await getQuery(
            `SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC`,
            [req.params.sessionId]
        );
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Database failure fetching conversation." });
    }
});

// C. List Sessions
app.get('/api/sessions', async (req, res) => {
    try {
        const sessions = await getQuery(`SELECT id as sessionId, last_updated as lastUpdated FROM sessions ORDER BY last_updated DESC`);
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: "Database failure fetching sessions." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
