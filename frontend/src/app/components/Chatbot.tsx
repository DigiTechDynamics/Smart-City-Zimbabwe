"use client";

import React, { useState } from 'react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your Smart City Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages([...messages, { role: 'user', text: input }]);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: 'I can help you report an issue or track an existing one. Would you like to report a fault?' 
      }]);
    }, 1000);
  };

  if (!isOpen) {
    return (
      <div 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-electricity), var(--accent-water))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 1000,
          fontSize: '24px'
        }}
      >
        🤖
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      width: '350px',
      height: '500px',
      zIndex: 1000,
    }} className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Smart Assistant</h3>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
      </div>
      
      <div style={{ height: '350px', overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ 
            marginBottom: '15px', 
            textAlign: m.role === 'user' ? 'right' : 'left' 
          }}>
            <div style={{ 
              display: 'inline-block', 
              padding: '10px 15px', 
              borderRadius: '12px',
              background: m.role === 'user' ? 'var(--accent-electricity)' : 'rgba(255,255,255,0.05)',
              color: 'white',
              maxWidth: '80% '
            }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Ask me anything..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          style={{ margin: 0 }}
        />
        <button onClick={handleSend} className="btn-primary" style={{ padding: '10px 15px' }}>➤</button>
      </div>
    </div>
  );
}
