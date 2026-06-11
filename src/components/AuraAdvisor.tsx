import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  User, 
  TrendingUp, 
  Scale,
  Activity
} from 'lucide-react';

// Lightweight markdown parser for advisory output
const parseMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;
  let keyCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('|')) {
      inTable = true;
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (cells.every(c => c.startsWith(':') || c.startsWith('-') || /^-+$/.test(c))) continue;
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      if (tableRows.length > 0) {
        elements.push(
          <div key={`table_${keyCounter++}`} style={{ overflowX: 'auto', margin: '14px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--line)', background: 'var(--bg2)' }}>
                  {tableRows[0].map((cell, idx) => (
                    <th key={`th_${idx}`} style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'left', color: 'var(--tx)' }}>{formatBoldText(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, rowIdx) => (
                  <tr key={`tr_${rowIdx}`} style={{ borderBottom: '1px solid var(--line)' }}>
                    {row.map((cell, cellIdx) => (
                      <td key={`td_${cellIdx}`} style={{ padding: '8px 12px', color: 'var(--tx2)' }}>{formatBoldText(cell)}</td>
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

    if (line === '') continue;

    if (line.startsWith('### ')) {
      elements.push(<h4 key={`h4_${keyCounter++}`} style={{ fontSize: '1rem', fontWeight: 700, margin: '14px 0 6px', color: 'var(--tx)' }}>{formatBoldText(line.substring(4))}</h4>);
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={`h3_${keyCounter++}`} style={{ fontSize: '1.1rem', fontWeight: 800, margin: '18px 0 8px', color: 'var(--tx)' }}>{formatBoldText(line.substring(3))}</h3>);
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      elements.push(
        <ul key={`ul_${keyCounter++}`} style={{ paddingLeft: '20px', margin: '4px 0' }}>
          <li style={{ fontSize: '0.88rem', color: 'var(--tx2)', lineHeight: 1.6 }}>{formatBoldText(line.substring(2))}</li>
        </ul>
      );
    } else {
      elements.push(<p key={`p_${keyCounter++}`} style={{ fontSize: '0.88rem', color: 'var(--tx2)', lineHeight: 1.7, margin: '6px 0' }}>{formatBoldText(line)}</p>);
    }
  }

  if (inTable && tableRows.length > 0) {
    elements.push(
      <div key={`table_${keyCounter++}`} style={{ overflowX: 'auto', margin: '14px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-card)' }}>
              {tableRows[0].map((cell, idx) => (
                <th key={`th_${idx}`} style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'left' }}>{formatBoldText(cell)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(1).map((row, rowIdx) => (
              <tr key={`tr_${rowIdx}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
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

const formatBoldText = (text: string) => {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, idx) => {
    return idx % 2 === 1 ? <strong key={idx} style={{ color: 'var(--tx)', fontWeight: 700 }}>{part}</strong> : part;
  });
};

export const AuraAdvisor: React.FC = () => {
  const { chatHistory, isChatLoading, sendAdvisorMessage, clearChat } = useFinance();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    await sendAdvisorMessage(query);
  };

  const handleChipClick = async (chipText: string) => {
    if (isChatLoading) return;
    await sendAdvisorMessage(chipText);
  };

  return (
    <div className="panel" style={{ 
      display: 'flex', flexDirection: 'column', 
      height: 'calc(100vh - 120px)', padding: '24px', margin: '20px',
      overflow: 'hidden'
    }}>
      
      {/* Header */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--line)', paddingBottom: '16px', marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: 'var(--radius-md)',
            background: 'var(--amber-bg)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--amber)'
          }}>
            <Sparkles size={20} color="var(--amber)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tx)' }}>Aura Strategist</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--tx3)' }}>Advanced financial analysis</span>
          </div>
        </div>

        <button 
          onClick={clearChat}
          className="seg-btn"
          style={{ 
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', 
            color: 'var(--red)', border: '1px solid rgba(239, 68, 68, 0.3)', 
            background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', 
            padding: '6px 12px', transition: 'all 0.2s ease', cursor: 'pointer' 
          }}
        >
          <Trash2 size={14} /> Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, overflowY: 'auto', paddingRight: '8px',
        display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '20px'
      }}>
        {chatHistory.length === 0 && (
          <div style={{ 
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '12px', color: 'var(--tx3)', textAlign: 'center'
          }}>
            <Sparkles size={32} color="var(--amber)" style={{ opacity: 0.4 }} />
            <p style={{ fontSize: '0.95rem' }}>Ask Aura anything about the markets.</p>
            <p style={{ fontSize: '0.82rem' }}>Use the quick prompts below or type your own question.</p>
          </div>
        )}

        {chatHistory.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', width: '100%' }}>
              <div style={{ display: 'flex', gap: '10px', maxWidth: '80%', flexDirection: isUser ? 'row-reverse' : 'row' }}>
                {/* Avatar */}
                <div style={{ 
                  width: 34, height: 34, borderRadius: 'var(--radius-full)', flexShrink: 0,
                  background: isUser ? 'var(--bg2)' : 'var(--amber-bg)',
                  border: `1px solid ${isUser ? 'var(--line)' : 'var(--amber)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isUser ? <User size={15} color="var(--tx3)" /> : <Sparkles size={15} color="var(--amber)" />}
                </div>

                {/* Bubble */}
                <div style={{ 
                  padding: '14px 18px', 
                  borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: isUser ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' : 'var(--bg2)',
                  color: isUser ? '#ffffff' : 'var(--tx)',
                  border: isUser ? 'none' : '1px solid var(--line)',
                  boxShadow: isUser ? '0 4px 12px rgba(79, 70, 229, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.15)',
                  backdropFilter: isUser ? 'none' : 'blur(10px)',
                }}>
                  {isUser ? (
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{msg.content}</p>
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

        {/* Loading */}
        {isChatLoading && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ 
              width: 34, height: 34, borderRadius: 'var(--radius-full)',
              background: 'var(--amber-bg)', border: '1px solid var(--amber)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={15} color="var(--amber)" />
            </div>
            <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg)', background: 'var(--bg2)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)', animation: 'pulse 1s infinite alternate' }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)', animation: 'pulse 1s infinite alternate 0.2s' }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)', animation: 'pulse 1s infinite alternate 0.4s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Chips */}
      {!isChatLoading && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', flexWrap: 'wrap' }}>
          <button 
            className="seg-btn" 
            style={{ 
              padding: '8px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', 
              gap: '6px', display: 'flex', alignItems: 'center',
              border: '1px solid var(--amber)', background: 'var(--amber-bg)', color: 'var(--amber)',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
            onClick={() => handleChipClick('Analyze the current forecast for this stock.')}
          >
            <TrendingUp size={14} color="var(--amber)" /> Analyze Forecast
          </button>
          <button 
            className="seg-btn" 
            style={{ 
              padding: '8px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', 
              gap: '6px', display: 'flex', alignItems: 'center',
              border: '1px solid var(--red)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
            onClick={() => handleChipClick('What are the key technical risks for this asset right now?')}
          >
            <Scale size={14} color="var(--red)" /> Assess Risks
          </button>
          <button 
            className="seg-btn" 
            style={{ 
              padding: '8px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', 
              gap: '6px', display: 'flex', alignItems: 'center',
              border: '1px solid var(--green)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--green)',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
            onClick={() => handleChipClick('Summarize the recent price volatility and momentum.')}
          >
            <Activity size={14} color="var(--green)" /> Check Momentum
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', width: '100%' }}>
        <input 
          type="text" 
          className="search-input" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Aura anything about the markets..."
          disabled={isChatLoading}
          style={{ 
            flex: 1, 
            width: '100%', 
            height: '46px', 
            fontSize: '13.5px', 
            borderRadius: 'var(--radius-md)', 
            padding: '10px 16px', 
            fontFamily: 'var(--sans)' 
          }}
        />
        <button 
          type="submit" 
          className="seg-btn" 
          disabled={isChatLoading || !inputText.trim()}
          style={{ 
            width: '48px', height: '46px', padding: 0, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            background: 'var(--amber)', color: 'var(--bg1)', border: 'none',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s ease'
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
