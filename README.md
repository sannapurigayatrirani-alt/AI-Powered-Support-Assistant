# Weitredge Support Chat Assistant

A full-stack React and Node.js application utilizing the Gemini LLM to provide document-based support chat. 

## Setup Instructions

1. **Clone/Download the repository**
2. **Backend Setup:**
   - Navigate to `/backend`
   - Run `npm install`
   - Create a `.env` file based on `.env.example` and add your `GEMINI_API_KEY`.
   - Run `npm start` (Runs on http://localhost:5000)
3. **Frontend Setup:**
   - Navigate to `/frontend`
   - Run `npm install`
   - Run `npm start` (Runs on http://localhost:3000)

## API Documentation
- `POST /api/chat`: Send a message. Requires `{ sessionId, message }`. Returns `{ reply, tokensUsed }`.
- `GET /api/conversations/:sessionId`: Fetch chat history for a session.
- `GET /api/sessions`: List all active sessions.

## Schema Explanation
Uses **SQLite** with two tables:
- `sessions`: Stores unique `id` (UUID) and `last_updated` timestamp.
- `messages`: Stores individual chat bubbles linked to `session_id` via Foreign Key, including `role` (user/assistant) and `content`.

## Assumptions
- Uses `@google/generative-ai` SDK.
- The `gemini-1.5-flash` model is used for fast, cost-effective responses.
- LocalStorage is sufficient for maintaining the session ID on the client side.
