import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { getIndianMarketStatus } from '../utils/marketStatus';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeView, setActiveView, fetchStockData } = useFinance();
  const [time, setTime] = useState('--:--:-- IST');
  const [marketStatus, setMarketStatus] = useState(getIndianMarketStatus());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST');
      setMarketStatus(getIndianMarketStatus());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = marketStatus.state === 'OPEN' ? 'var(--green)'
    : marketStatus.state === 'PRE-MARKET' || marketStatus.state === 'AFTER-HOURS' ? 'var(--amber)'
    : 'var(--red)';

  return (
    <>
      {/* TICKER TAPE */}
      <div className="ticker-wrap">
        <div className="ticker-label">LIVE</div>
        <div className="ticker-scroll" id="tickerScroll">
          <div className="ticker-item"><span className="ticker-sym">SPY</span><span className="ticker-price">543.28</span><span className="ticker-chg up">+1.24%</span></div>
          <div className="ticker-item"><span className="ticker-sym">AAPL</span><span className="ticker-price">213.07</span><span className="ticker-chg up">+0.87%</span></div>
          <div className="ticker-item"><span className="ticker-sym">NVDA</span><span className="ticker-price">131.88</span><span className="ticker-chg up">+2.43%</span></div>
          <div className="ticker-item"><span className="ticker-sym">TSLA</span><span className="ticker-price">248.50</span><span className="ticker-chg dn">−0.66%</span></div>
          <div className="ticker-item"><span className="ticker-sym">BND</span><span className="ticker-price">74.18</span><span className="ticker-chg dn">−0.11%</span></div>
          <div className="ticker-item"><span className="ticker-sym">QQQ</span><span className="ticker-price">476.92</span><span className="ticker-chg up">+1.61%</span></div>
          
          {/* Duplicate for infinite scroll effect */}
          <div className="ticker-item"><span className="ticker-sym">SPY</span><span className="ticker-price">543.28</span><span className="ticker-chg up">+1.24%</span></div>
          <div className="ticker-item"><span className="ticker-sym">AAPL</span><span className="ticker-price">213.07</span><span className="ticker-chg up">+0.87%</span></div>
          <div className="ticker-item"><span className="ticker-sym">NVDA</span><span className="ticker-price">131.88</span><span className="ticker-chg up">+2.43%</span></div>
          <div className="ticker-item"><span className="ticker-sym">TSLA</span><span className="ticker-price">248.50</span><span className="ticker-chg dn">−0.66%</span></div>
          <div className="ticker-item"><span className="ticker-sym">BND</span><span className="ticker-price">74.18</span><span className="ticker-chg dn">−0.11%</span></div>
          <div className="ticker-item"><span className="ticker-sym">QQQ</span><span className="ticker-price">476.92</span><span className="ticker-chg up">+1.61%</span></div>
        </div>
      </div>

      {/* SIDEBAR */}
      <nav className="sidebar">
        <div className="brand">
          <div className="brand-icon">AF</div>
          <div className="brand-name">AURA</div>
          <div className="brand-ver">v2.4</div>
        </div>
        <div className="nav">
          <div className="nav-section-label">Workspace</div>
          <div className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}><span className="nav-dot"></span>Overview</div>
          <div className={`nav-item ${activeView === 'advisor' ? 'active' : ''}`} onClick={() => setActiveView('advisor')}><span className="nav-dot"></span>Forecasting<span className="nav-tag">AI</span></div>
          <div className={`nav-item ${activeView === 'optimizer' ? 'active' : ''}`} onClick={() => setActiveView('optimizer')}><span className="nav-dot"></span>Portfolio</div>

          <div className="nav-section-label">Markets</div>
          <div className={`nav-item ${activeView === 'watchlist' ? 'active' : ''}`} onClick={() => setActiveView('watchlist')}><span className="nav-dot"></span>Watchlist</div>
          <div className={`nav-item ${activeView === 'screener' ? 'active' : ''}`} onClick={() => setActiveView('screener')}><span className="nav-dot"></span>Screener</div>
          <div className={`nav-item ${activeView === 'macro' ? 'active' : ''}`} onClick={() => setActiveView('macro')}><span className="nav-dot"></span>Macro</div>

          <div className="nav-section-label">System</div>
          <div className={`nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}><span className="nav-dot"></span>Settings</div>
        </div>
        <div className="sidebar-bottom">
          <div className="user-row">
            <div className="user-ava">U</div>
            <div><div className="user-n">User</div><div className="user-t">PRO · COPILOT</div></div>
          </div>
          <div className="conn-row"><div className="conn-dot"></div>Gemini AI Connected</div>
        </div>
      </nav>

      {/* MAIN */}
      <div className="main">
        {/* TOPBAR */}
        <div className="topbar">
          <div className={`topbar-tab ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>DASHBOARD</div>
          <div className={`topbar-tab ${activeView === 'advisor' ? 'active' : ''}`} onClick={() => setActiveView('advisor')}>FORECAST</div>
          <div className={`topbar-tab ${activeView === 'optimizer' ? 'active' : ''}`} onClick={() => setActiveView('optimizer')}>PORTFOLIO</div>
          <div className={`topbar-tab ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>SETTINGS</div>
          
          <div className="topbar-sep"></div>
          
          <div style={{ marginLeft: '16px' }}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search ticker (e.g. AAPL)..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  if (target.value.trim()) {
                    const ticker = target.value.trim().toUpperCase();
                    fetchStockData(ticker);
                    setActiveView('dashboard');
                    target.value = '';
                  }
                }
              }}
            />
          </div>

          <div className="topbar-right">
            <div className="market-status" style={{ color: statusColor }}>
              <span className="conn-dot" style={{ background: statusColor, animation: marketStatus.isLive ? 'blink 3s ease-in-out infinite' : 'none' }}></span>
              {marketStatus.label}
            </div>
            <div className="topbar-time" id="liveClock">{time}</div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">
          {children}
        </div>
      </div>
    </>
  );
};
