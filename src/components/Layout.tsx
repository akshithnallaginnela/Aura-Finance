import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { getIndianMarketStatus } from '../utils/marketStatus';
import { LayoutGrid, Sparkles, Briefcase, Eye, Sliders, Globe, Settings as SettingsIcon, Bell } from 'lucide-react';

const FALLBACK_TOP_STOCKS = [
  { ticker: 'RELIANCE', price: 2950.40, changePct: 1.15 },
  { ticker: 'TCS', price: 3820.15, changePct: 0.45 },
  { ticker: 'HDFCBANK', price: 1510.60, changePct: -0.35 },
  { ticker: 'BHARTIARTL', price: 1380.20, changePct: 1.85 },
  { ticker: 'ICICIBANK', price: 1120.45, changePct: 0.95 },
  { ticker: 'INFY', price: 1475.30, changePct: -1.25 },
  { ticker: 'SBIN', price: 832.10, changePct: 2.10 },
  { ticker: 'LICI', price: 985.40, changePct: -0.20 },
  { ticker: 'ITC', price: 435.50, changePct: 0.15 },
  { ticker: 'HINDUNILVR', price: 2345.80, changePct: -0.80 }
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    activeView, 
    setActiveView, 
    fetchStockData,
    notifications,
    markAllNotificationsAsRead,
    clearNotifications
  } = useFinance();
  
  const [time, setTime] = useState('--:--:-- IST');
  const [marketStatus, setMarketStatus] = useState(getIndianMarketStatus());
  const [topStocks, setTopStocks] = useState<any[]>(FALLBACK_TOP_STOCKS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<any | null>(null);

  useEffect(() => {
    const latestRisk = notifications.find(n => !n.read && n.type === 'risk');
    if (latestRisk) {
      setActiveToast(latestRisk);
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    } else {
      setActiveToast(null);
    }
  }, [notifications]);

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

  useEffect(() => {
    const fetchTopStocks = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/api/top_stocks`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setTopStocks(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch top stocks', err);
      }
    };
    fetchTopStocks();
    const interval = setInterval(fetchTopStocks, 60000); // refresh every 60s
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
          {topStocks.map((item, idx) => {
            const isUp = item.changePct >= 0;
            return (
              <div 
                className="ticker-item" 
                key={`orig-${item.ticker}-${idx}`} 
                onClick={() => {
                  fetchStockData(`${item.ticker}.NS`);
                  setActiveView('dashboard');
                }} 
                style={{ cursor: 'pointer' }}
              >
                <span className="ticker-sym">{item.ticker}</span>
                <span className="ticker-price">₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                <span className={`ticker-chg ${isUp ? 'up' : 'dn'}`}>{isUp ? '+' : ''}{item.changePct.toFixed(2)}%</span>
              </div>
            );
          })}
          {/* Duplicate for infinite scroll effect */}
          {topStocks.map((item, idx) => {
            const isUp = item.changePct >= 0;
            return (
              <div 
                className="ticker-item" 
                key={`dup-${item.ticker}-${idx}`} 
                onClick={() => {
                  fetchStockData(`${item.ticker}.NS`);
                  setActiveView('dashboard');
                }} 
                style={{ cursor: 'pointer' }}
              >
                <span className="ticker-sym">{item.ticker}</span>
                <span className="ticker-price">₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                <span className={`ticker-chg ${isUp ? 'up' : 'dn'}`}>{isUp ? '+' : ''}{item.changePct.toFixed(2)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SIDEBAR */}
      <nav className="sidebar">
        <div className="brand">
          <img src="/logo.png" className="brand-icon" alt="Aura Logo" />
          <div className="brand-name">AURA</div>
          <div className="brand-ver">v2.4</div>
        </div>
        <div className="nav">
          <div className="nav-section-label">Workspace</div>
          <div className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
            <LayoutGrid size={15} className="sidebar-icon" />
            Overview
          </div>
          <div className={`nav-item ${activeView === 'advisor' ? 'active' : ''}`} onClick={() => setActiveView('advisor')}>
            <Sparkles size={15} className="sidebar-icon" />
            Forecasting<span className="nav-tag">AI</span>
          </div>
          <div className={`nav-item ${activeView === 'optimizer' ? 'active' : ''}`} onClick={() => setActiveView('optimizer')}>
            <Briefcase size={15} className="sidebar-icon" />
            Portfolio
          </div>

          <div className="nav-section-label">Markets</div>
          <div className={`nav-item ${activeView === 'watchlist' ? 'active' : ''}`} onClick={() => setActiveView('watchlist')}>
            <Eye size={15} className="sidebar-icon" />
            Watchlist
          </div>
          <div className={`nav-item ${activeView === 'screener' ? 'active' : ''}`} onClick={() => setActiveView('screener')}>
            <Sliders size={15} className="sidebar-icon" />
            Screener
          </div>
          <div className={`nav-item ${activeView === 'macro' ? 'active' : ''}`} onClick={() => setActiveView('macro')}>
            <Globe size={15} className="sidebar-icon" />
            Macro
          </div>

          <div className="nav-section-label">System</div>
          <div className={`nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
            <SettingsIcon size={15} className="sidebar-icon" />
            Settings
          </div>
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
