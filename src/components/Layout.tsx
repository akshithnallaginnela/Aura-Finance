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
  Cpu,
  Sun,
  Moon
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeView, setActiveView, activeTicker, stockData } = useFinance();
  const currentPrice = stockData && stockData.length > 0 ? stockData[stockData.length - 1].Close : 0;
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('AURA_THEME') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('AURA_THEME', theme);
  }, [theme]);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Theme Toggle Button */}
            <button 
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              style={{ 
                padding: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: '8px',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-main)',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Stock Tracker Badge */}
            <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', borderRadius: '8px' }}>
              <Coins size={16} color="var(--accent-secondary)" />
              <span>{activeTicker}: <strong style={{ color: 'var(--text-main)' }}>${currentPrice.toFixed(2)}</strong></span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner View */}
        <div className="animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  );
};
