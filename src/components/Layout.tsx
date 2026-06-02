import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  LayoutDashboard, 
  LineChart, 
  PieChart, 
  MessageSquare, 
  Settings, 
  Sparkles, 
  Key, 
  X,
  Coins,
  Cpu
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeView, setActiveView, data } = useFinance();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedKey, setSavedKey] = useState('');

  // Load key from localStorage
  useEffect(() => {
    const key = localStorage.getItem('AURA_GEMINI_API_KEY') || '';
    setSavedKey(key);
    setApiKeyInput(key ? '••••••••••••••••••••••••' : '');
  }, []);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim() === '') {
      localStorage.removeItem('AURA_GEMINI_API_KEY');
      setSavedKey('');
    } else if (!apiKeyInput.includes('•')) {
      localStorage.setItem('AURA_GEMINI_API_KEY', apiKeyInput);
      setSavedKey(apiKeyInput);
    }
    setIsSettingsOpen(false);
  };

  const handleRemoveKey = () => {
    localStorage.removeItem('AURA_GEMINI_API_KEY');
    setSavedKey('');
    setApiKeyInput('');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' }}>
            <Sparkles size={26} color="var(--accent-primary)" style={{ filter: 'drop-shadow(0 0 8px var(--accent-primary))' }} />
            <h1 className="logo-text" style={{ fontSize: '1.4rem', fontWeight: '800', background: 'linear-gradient(135deg, #fff 30%, var(--accent-primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AuraFinance
            </h1>
          </div>

          {/* Navigation Links */}
          <nav className="nav-menu">
            <div 
              className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveView('dashboard')}
            >
              <LayoutDashboard size={20} />
              <span className="nav-label">Dashboard</span>
            </div>
            <div 
              className={`nav-item ${activeView === 'forecaster' ? 'active' : ''}`}
              onClick={() => setActiveView('forecaster')}
            >
              <LineChart size={20} />
              <span className="nav-label">Runway Predictor</span>
            </div>
            <div 
              className={`nav-item ${activeView === 'optimizer' ? 'active' : ''}`}
              onClick={() => setActiveView('optimizer')}
            >
              <PieChart size={20} />
              <span className="nav-label">MPT Optimizer</span>
            </div>
            <div 
              className={`nav-item ${activeView === 'macro' ? 'active' : ''}`}
              onClick={() => setActiveView('macro')}
            >
              <Cpu size={20} />
              <span className="nav-label">AIML Lab</span>
            </div>
            <div 
              className={`nav-item ${activeView === 'advisor' ? 'active' : ''}`}
              onClick={() => setActiveView('advisor')}
            >
              <MessageSquare size={20} />
              <span className="nav-label">Aura Advisor</span>
            </div>
          </nav>

          {/* Settings Trigger at Bottom */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-card)', paddingTop: '16px' }}>
            <div 
              className="nav-item"
              onClick={() => setIsSettingsOpen(true)}
              style={{ color: savedKey ? 'var(--accent-success)' : 'var(--text-muted)' }}
            >
              <Settings size={20} />
              <span className="nav-label">AI Engine Config</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Header Bar */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px',
          borderBottom: '1px solid var(--border-card)',
          paddingBottom: '20px'
        }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Wealth Engine Dashboard
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '4px', textTransform: 'capitalize' }}>
              {activeView === 'dashboard' ? 'Overview' : activeView === 'forecaster' ? 'Cash Flow Forecasting' : activeView === 'optimizer' ? 'Markowitz Optimizer' : activeView === 'macro' ? 'AIML Lab & Simulator' : 'Aura AI Copilot'}
            </h2>
          </div>

          {/* Quick Stats & AI Engine Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Networth Badge */}
            <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', borderRadius: '8px' }}>
              <Coins size={16} color="var(--accent-secondary)" />
              <span>Net Worth: <strong style={{ color: '#fff' }}>${data.netWorth.toLocaleString()}</strong></span>
            </div>

            {/* AI Engine Badge */}
            <div 
              className="glass-panel" 
              onClick={() => setIsSettingsOpen(true)}
              style={{ 
                padding: '8px 16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '0.85rem', 
                borderRadius: '8px',
                cursor: 'pointer',
                borderColor: savedKey ? 'var(--accent-success)' : 'var(--accent-primary)'
              }}
            >
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: savedKey ? 'var(--accent-success)' : 'var(--accent-primary)',
                boxShadow: savedKey ? '0 0 8px var(--accent-success)' : '0 0 8px var(--accent-primary)'
              }}></span>
              <span>AI Mode: <strong>{savedKey ? 'Gemini 1.5 Cloud' : 'Local Fallback'}</strong></span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner View */}
        <div className="animate-fade-in-up">
          {children}
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99
        }}>
          <div className="glass-panel" style={{ width: '480px', padding: '28px', position: 'relative' }}>
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="glass-btn-text" 
              style={{ position: 'absolute', right: '20px', top: '20px' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Key size={22} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.25rem' }}>AI Strategist Config</h3>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '20px' }}>
              AuraFinance uses Gemini API to perform custom prompt analysis on your transactions. Paste your **Gemini API Key** below to connect the cloud strategist, or clear it to use the local mathematical logic fallback.
            </p>

            <form onSubmit={handleSaveKey}>
              <div style={{ marginBottom: '24px' }}>
                <label className="glass-label">Gemini API Key</label>
                <input 
                  type="password" 
                  className="glass-input" 
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter API Key (e.g. AIzaSy...)"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                {savedKey && (
                  <button 
                    type="button" 
                    onClick={handleRemoveKey}
                    className="glass-btn glass-btn-secondary" 
                    style={{ borderColor: 'var(--accent-danger)' }}
                  >
                    Clear Key
                  </button>
                )}
                <button type="submit" className="glass-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
