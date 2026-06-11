import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { getIndianMarketStatus } from '../utils/marketStatus';
import { auth } from '../utils/firebaseClient';
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
    clearNotifications,
    user,
    resendVerificationEmail,
    displayName,
    avatarColor
  } = useFinance();
  
  const [time, setTime] = useState('--:--:-- IST');
  const [marketStatus, setMarketStatus] = useState(getIndianMarketStatus());
  const [topStocks, setTopStocks] = useState<any[]>(FALLBACK_TOP_STOCKS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<any | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notification panel on outside click
  useEffect(() => {
    if (!isNotificationsOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isNotificationsOpen]);

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
          <div className="brand-ver">v3.0</div>
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
            <div className="user-ava" style={{ backgroundColor: avatarColor }}>
              {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="user-n" style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName || 'User'}
              </div>
              <div className="user-t">PRO · COPILOT</div>
            </div>
          </div>
          <div className="conn-row"><div className="conn-dot"></div>Advisory Engine Connected</div>
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
            
            {/* V3 Notifications Center Dropdown */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                style={{ 
                  background: 'none', border: 'none', color: 'var(--tx)', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', padding: '6px', position: 'relative',
                  borderRadius: '50%', transition: 'background 0.2s'
                }}
                className="seg-btn"
                title="Notifications"
              >
                <Bell size={15} />
                {notifications.some(n => !n.read) && (
                  <span style={{ 
                    position: 'absolute', top: 2, right: 2, 
                    width: 7, height: 7, borderRadius: '50%', 
                    background: 'var(--red)', border: '1px solid var(--bg-elevated)',
                    animation: 'pulse 2s infinite'
                  }} />
                )}
              </button>
              
              {isNotificationsOpen && (
                <div 
                  className="glass-panel" 
                  style={{ 
                    position: 'absolute', top: '35px', right: 0, 
                    width: '300px', maxHeight: '400px', overflowY: 'auto',
                    zIndex: 9999, padding: '16px', background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)', boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
                    borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--tx)' }}>Notifications</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={markAllNotificationsAsRead}
                        style={{ background: 'none', border: 'none', color: 'var(--amber)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Read All
                      </button>
                      <button 
                        onClick={clearNotifications}
                        style={{ background: 'none', border: 'none', color: 'var(--tx3)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--tx3)', fontSize: '0.8rem' }}>
                      No notifications yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {notifications.map(n => (
                        <div 
                          key={n.id} 
                          style={{ 
                            padding: '10px', borderRadius: '6px', 
                            background: n.read ? 'transparent' : 'rgba(239, 68, 68, 0.05)',
                            border: `1px solid ${n.read ? 'var(--border-subtle)' : 'rgba(239, 68, 68, 0.2)'}`,
                            display: 'flex', flexDirection: 'column', gap: '4px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: n.type === 'risk' ? 'var(--red)' : 'var(--tx)' }}>
                              {n.title}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--tx3)' }}>
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--tx2)', lineHeight: 1.3 }}>{n.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="topbar-time" id="liveClock">{time}</div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">
          {user && !user.emailVerified && (
            <div 
              style={{
                background: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderLeft: '4px solid var(--amber)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: 'var(--tx)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  background: 'var(--amber)', 
                  color: '#1e1b4b', 
                  padding: '3px 8px', 
                  borderRadius: '4px', 
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em'
                }}>UNVERIFIED</span>
                <span>Please verify your email address (<strong style={{ color: 'var(--amber)' }}>{user.email}</strong>) to secure your account. Check your inbox/spam folder.</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={async () => {
                    try {
                      if (auth.currentUser) {
                        await auth.currentUser.reload();
                        // Force token refresh to trigger onAuthStateChanged
                        await auth.currentUser.getIdToken(true);
                      }
                    } catch (err) {
                      console.error("Error refreshing user session:", err);
                    }
                  }}
                  className="seg-btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--tx2)',
                    cursor: 'pointer'
                  }}
                >
                  I've Verified
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await resendVerificationEmail();
                    } catch (e: any) {
                      console.error("Resend verification failed:", e);
                    }
                  }}
                  className="seg-btn"
                  style={{ 
                    padding: '4px 10px', 
                    fontSize: '0.75rem', 
                    borderColor: 'rgba(245, 158, 11, 0.4)', 
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: 'var(--amber)',
                    cursor: 'pointer'
                  }}
                >
                  Resend Email
                </button>
              </div>
            </div>
          )}
          {children}
        </div>
      </div>

      {/* V3 Risk Warning Toast Banner Overlay */}
      {activeToast && (
        <div 
          className="animate-fade-in-up"
          style={{
            position: 'fixed', bottom: '20px', right: '20px', 
            width: '320px', background: 'rgba(15, 23, 42, 0.85)', 
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--red)', borderLeft: '4px solid var(--red)',
            borderRadius: 'var(--radius-md)', padding: '16px', zIndex: 100000,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex', flexDirection: 'column', gap: '6px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--red)', letterSpacing: '0.05em' }}>RISK WARNING ALERT</span>
            <button 
              onClick={() => setActiveToast(null)} 
              style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--tx)' }}>{activeToast.title}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--tx2)', lineHeight: 1.3 }}>{activeToast.message}</div>
        </div>
      )}
    </>
  );
};
