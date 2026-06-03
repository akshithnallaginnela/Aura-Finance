import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  LayoutDashboard, 
  LineChart, 
  PieChart, 
  MessageSquare, 
  Sparkles, 
  Coins,
  Cpu,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeView, setActiveView, activeTicker, stockData } = useFinance();
  const currentPrice = stockData && stockData.length > 0 ? stockData[stockData.length - 1].Close : 0;
  const prevPrice = stockData && stockData.length > 1 ? stockData[stockData.length - 2].Close : 0;
  const change = currentPrice - prevPrice;
  const changePct = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
  const isUp = change >= 0;

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'optimizer' as const, label: 'MPT Optimizer', icon: PieChart },
    { id: 'advisor' as const, label: 'Aura Advisor', icon: MessageSquare },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary-light)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <Sparkles size={20} color="var(--accent-primary)" />
            </div>
            <span className="logo-text">Aura Finance</span>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border-card)', margin: '12px 0 16px' }} />

          {/* Navigation */}
          <nav className="nav-menu">
            {navItems.map(item => (
              <div 
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => setActiveView(item.id)}
              >
                <item.icon size={18} />
                <span className="nav-label">{item.label}</span>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer — Active Ticker Badge */}
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <div style={{ 
              padding: '16px', 
              borderRadius: 'var(--radius-md)', 
              background: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Coins size={16} color="var(--accent-secondary)" />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracking</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>{activeTicker}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {currentPrice > 1000 ? `₹${currentPrice.toLocaleString('en-IN', {maximumFractionDigits: 2})}` : `$${currentPrice.toFixed(2)}`}
                </span>
                <span style={{ 
                  fontSize: '0.78rem', fontWeight: 600,
                  color: isUp ? 'var(--accent-success)' : 'var(--accent-danger)',
                  display: 'flex', alignItems: 'center', gap: '2px',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  background: isUp ? 'var(--accent-success-light)' : 'var(--accent-danger-light)'
                }}>
                  {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(changePct).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: '32px', paddingBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div>
            <span style={{ 
              fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)',
              textTransform: 'uppercase', letterSpacing: '0.06em' 
            }}>
              Wealth Intelligence Platform
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
              {activeView === 'dashboard' ? 'Market Overview' 
                : activeView === 'optimizer' ? 'Portfolio Optimizer' 
                : 'Aura AI Copilot'}
            </h2>
          </div>
        </header>

        {/* Dynamic View */}
        <div className="animate-fade-in-up" style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
};
