import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Session Handling
    let currentSession = localStorage.getItem('chatSessionId');
    if (!currentSession) {
      currentSession = uuidv4();
      localStorage.setItem('chatSessionId', currentSession);
    }
    setSessionId(currentSession);
    fetchConversation(currentSession);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchConversation = async (id) => {
    try {
      const res = await fetch(`${API_URL}/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversation", error);
    }
  };

  const startNewChat = () => {
    const newSession = uuidv4();
    localStorage.setItem('chatSessionId', newSession);
    setSessionId(newSession);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMsg.content }),
      });

      const data = await res.json();

      if (res.ok) {
        const botMsg = { role: 'assistant', content: data.reply, created_at: new Date().toISOString() };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        alert(data.error || "An error occurred");
      }
    } catch (error) {
      console.error("Failed to send message", error);
      alert("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h2>Support AI</h2>
        <button onClick={startNewChat}>New Chat</button>
      </div>

      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
            <span className="timestamp">{new Date(msg.created_at).toLocaleTimeString()}</span>
          </div>
        ))}
        {loading && <div className="loading">Assistant is typing...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className="input-area">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your question..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>Send</button>
      </div>
    </div>
  );
}

export default App;
