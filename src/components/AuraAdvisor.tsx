import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  User, 
  TrendingUp, 
  PiggyBank, 
  Scale 
} from 'lucide-react';

// Custom lightweight parser to format Gemini markdown output (headers, bold, lists, and tables)
const parseMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;
  let keyCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 1. Table parsing
    if (line.startsWith('|')) {
      inTable = true;
      const cells = line.split('|')
        .map(c => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      // Skip divider row | :--- | :--- |
      if (cells.every(c => c.startsWith(':') || c.startsWith('-') || /^-+$/.test(c))) {
        continue;
      }
      
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      // Table ended, compile it
      if (tableRows.length > 0) {
        elements.push(
          <div key={`table_${keyCounter++}`} style={{ overflowX: 'auto', margin: '14px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-card)', background: 'hsla(0, 0%, 100%, 0.02)' }}>
                  {tableRows[0].map((cell, idx) => (
                    <th key={`th_${idx}`} style={{ padding: '8px 12px', fontWeight: '700', textAlign: 'left' }}>{formatBoldText(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, rowIdx) => (
                  <tr key={`tr_${rowIdx}`} style={{ borderBottom: '1px solid hsla(0,0%,100%,0.04)' }}>
                    {row.map((cell, cellIdx) => (
                      <td key={`td_${cellIdx}`} style={{ padding: '8px 12px' }}>{formatBoldText(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableRows = [];
      inTable = false;
    }

    if (line === '') {
      continue;
    }

    // 2. Headers
    if (line.startsWith('### ')) {
      elements.push(<h4 key={`h4_${keyCounter++}`} style={{ fontSize: '1.05rem', fontWeight: '700', margin: '16px 0 8px 0', color: 'var(--text-main)' }}>{formatBoldText(line.substring(4))}</h4>);
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={`h3_${keyCounter++}`} style={{ fontSize: '1.2rem', fontWeight: '800', margin: '20px 0 10px 0', color: 'var(--text-main)' }}>{formatBoldText(line.substring(3))}</h3>);
    } 
    // 3. Bullet list items
    else if (line.startsWith('* ') || line.startsWith('- ')) {
      elements.push(
        <ul key={`ul_${keyCounter++}`} style={{ paddingLeft: '20px', margin: '6px 0', listStyleType: 'square' }}>
          <li style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{formatBoldText(line.substring(2))}</li>
        </ul>
      );
    } 
    // 4. Regular Paragraphs
    else {
      elements.push(<p key={`p_${keyCounter++}`} style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: '8px 0' }}>{formatBoldText(line)}</p>);
    }
  }

  // Fallback compile if text ended but still inside a table
  if (inTable && tableRows.length > 0) {
    elements.push(
      <div key={`table_${keyCounter++}`} style={{ overflowX: 'auto', margin: '14px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-card)' }}>
              {tableRows[0].map((cell, idx) => (
                <th key={`th_${idx}`} style={{ padding: '8px 12px', fontWeight: '700', textAlign: 'left' }}>{formatBoldText(cell)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(1).map((row, rowIdx) => (
              <tr key={`tr_${rowIdx}`} style={{ borderBottom: '1px solid hsla(0,0%,100%,0.04)' }}>
                {row.map((cell, cellIdx) => (
                  <td key={`td_${cellIdx}`} style={{ padding: '8px 12px' }}>{formatBoldText(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return elements;
};

// Formatter to render **text** inside React elements
const formatBoldText = (text: string) => {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, idx) => {
    // Alternate standard text and bold text
    return idx % 2 === 1 ? <strong key={idx} style={{ color: '#fff', fontWeight: '700' }}>{part}</strong> : part;
  });
};

export const AuraAdvisor: React.FC = () => {
  const { chatHistory, isChatLoading, sendAdvisorMessage, clearChat } = useFinance();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isChatLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isChatLoading) return;

    const query = inputText;
    setInputText('');
    
    const key = localStorage.getItem('AURA_GEMINI_API_KEY') || undefined;
    await sendAdvisorMessage(query, key);
  };

  // Quick Action Chips
  const handleChipClick = async (chipText: string) => {
    if (isChatLoading) return;
    const key = localStorage.getItem('AURA_GEMINI_API_KEY') || undefined;
    await sendAdvisorMessage(chipText, key);
  };

  return (
    <div className="glass-panel" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 170px)', 
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* 1. Chat Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid var(--border-card)', 
        paddingBottom: '14px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={22} color="var(--accent-primary)" style={{ filter: 'drop-shadow(0 0 4px var(--accent-primary))' }} />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Aura Strategist</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Ready to solve complex financial layouts</span>
          </div>
        </div>

        <button 
          onClick={clearChat}
          className="glass-btn-text"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-danger)' }}
          title="Reset chat logs"
        >
          <Trash2 size={16} /> Reset
        </button>
      </div>

      {/* 2. Message History Stream */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        paddingRight: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {chatHistory.map((msg) => {
          const isUser = msg.sender === 'user';
          
          return (
            <div 
              key={msg.id} 
              style={{ 
                display: 'flex', 
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                width: '100%'
              }}
            >
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                maxWidth: '80%',
                flexDirection: isUser ? 'row-reverse' : 'row'
              }}>
                {/* Avatar Icon */}
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: isUser ? 'var(--bg-input)' : 'var(--accent-primary-glow)',
                  border: `1px solid ${isUser ? 'var(--border-card)' : 'var(--accent-primary)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isUser ? <User size={16} /> : <Sparkles size={16} color="var(--accent-primary)" />}
                </div>

                {/* Message Body */}
                <div className="glass-panel" style={{ 
                  padding: '14px 18px', 
                  borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: isUser ? 'hsla(0, 0%, 100%, 0.02)' : 'var(--bg-card)',
                  borderColor: isUser ? 'var(--border-card)' : 'hsla(270, 85%, 65%, 0.12)'
                }}>
                  {isUser ? (
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)' }}>{msg.content}</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {parseMarkdown(msg.content)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Pulsing Loading Indicator */}
        {isChatLoading && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: 'var(--accent-primary-glow)',
              border: '1px solid var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={16} color="var(--accent-primary)" />
            </div>
            <div className="glass-panel" style={{ padding: '14px 18px', borderRadius: '4px 16px 16px 16px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulse 1s infinite alternate' }}></span>
                <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulse 1s infinite alternate 0.2s' }}></span>
                <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulse 1s infinite alternate 0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Floating Quick Recommendation Prompt Chips */}
      {!isChatLoading && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', flexWrap: 'wrap' }}>
          <button 
            className="glass-btn glass-btn-secondary" 
            style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', gap: '6px' }}
            onClick={() => handleChipClick('Optimize my portfolio weights')}
          >
            <Scale size={14} color="var(--accent-primary)" /> Optimize Portfolio
          </button>
          <button 
            className="glass-btn glass-btn-secondary" 
            style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', gap: '6px' }}
            onClick={() => handleChipClick('Explain my cash flow dip')}
          >
            <TrendingUp size={14} color="var(--accent-secondary)" /> Analyze Cash Runway
          </button>
          <button 
            className="glass-btn glass-btn-secondary" 
            style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', gap: '6px' }}
            onClick={() => handleChipClick('Suggest a savings challenge')}
          >
            <PiggyBank size={14} color="var(--accent-success)" /> Get Savings Challenge
          </button>
        </div>
      )}

      {/* 4. Chat Input Form Row */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
        <input 
          type="text" 
          className="glass-input" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Aura anything (e.g. 'How does Modern Portfolio Theory work?')..."
          disabled={isChatLoading}
        />
        <button 
          type="submit" 
          className="glass-btn" 
          disabled={isChatLoading || !inputText.trim()}
          style={{ width: '48px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
        >
          <Send size={16} />
        </button>
      </form>

      {/* Embedded CSS animation for loader dots */}
      <style>{`
        @keyframes pulse {
          from { opacity: 0.2; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};
