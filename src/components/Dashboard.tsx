import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Wallet, 
  LineChart as ChartIcon, 
  PlusCircle, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { data, forecast, setActiveView } = useFinance();

  // Summarize stats
  const totalInvested = data.assets
    .filter(a => a.category !== 'Cash')
    .reduce((sum, a) => sum + a.balance, 0);

  const forecastEnd = forecast.length > 0 ? forecast[forecast.length - 1].balance : data.cashBalance;
  const monthlySavings = data.profile.monthlySalary - (
    data.profile.housingCost + 
    data.profile.utilityCost + 
    data.profile.subscriptionCost + 
    data.profile.otherFixedCosts
  );

  // Identify any forecast alerts (months where projected expenses > salary)
  const lowCashAlerts = forecast.filter(f => f.expense > f.income);

  // Format currency helper
  const fmt = (val: number) => `$${val.toLocaleString()}`;

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-card)',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{payload[0].payload.monthName}</p>
          <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-secondary)' }}>
            Cash: {fmt(payload[0].value)}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Interval: {fmt(payload[0].payload.lowerBound)} - {fmt(payload[0].payload.upperBound)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. KPI Cards */}
      <section className="kpi-grid">
        <div className="glass-panel kpi-card glass-panel-glow-purple">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">Net Worth</span>
            <Wallet size={20} color="var(--accent-primary)" />
          </div>
          <span className="kpi-value" style={{ marginTop: '8px' }}>{fmt(data.netWorth)}</span>
          <span className="kpi-trend trend-up">
            <ArrowUpRight size={14} />
            <span>Liquid + Invested Assets</span>
          </span>
        </div>

        <div className="glass-panel kpi-card glass-panel-glow-cyan">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">Cash Reserves</span>
            <Activity size={20} color="var(--accent-secondary)" />
          </div>
          <span className="kpi-value" style={{ marginTop: '8px' }}>{fmt(data.cashBalance)}</span>
          <span className="kpi-trend" style={{ color: monthlySavings >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
            {monthlySavings >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>Net Monthly Saving: {fmt(Math.abs(monthlySavings))}</span>
          </span>
        </div>

        <div className="glass-panel kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">Invested Funds</span>
            <ChartIcon size={20} color="var(--accent-success)" />
          </div>
          <span className="kpi-value" style={{ marginTop: '8px' }}>{fmt(totalInvested)}</span>
          <span className="kpi-trend" style={{ color: 'var(--text-muted)' }}>
            <span>{((totalInvested / data.netWorth) * 100).toFixed(0)}% of Assets Deploy</span>
          </span>
        </div>

        <div className="glass-panel kpi-card" style={{ borderColor: forecastEnd < data.cashBalance ? 'var(--accent-warning)' : 'var(--border-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">12M Cash Forecast</span>
            <TrendingUp size={20} color="var(--accent-warning)" />
          </div>
          <span className="kpi-value" style={{ marginTop: '8px' }}>{fmt(forecastEnd)}</span>
          <span className="kpi-trend" style={{ color: forecastEnd >= data.cashBalance ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
            {forecastEnd >= data.cashBalance ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{forecastEnd >= data.cashBalance ? 'Growth projected' : 'Runway decay predicted'}</span>
          </span>
        </div>
      </section>

      {/* 2. Main Row: Forecast Chart & Portfolio Allocation */}
      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Forecast Area Chart */}
        <div className="glass-panel" style={{ padding: '24px', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Cash Runway Projection</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>Holt-Winters time series modeling with 95% error margin band</p>
            </div>
            <button className="glass-btn-text" onClick={() => setActiveView('forecaster')} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Details <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ flex: 1, width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsla(180, 85%, 50%, 0.1)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsla(180, 85%, 50%, 0.1)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="monthName" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                {/* Confidence Band Area */}
                <Area 
                  type="monotone" 
                  dataKey="upperBound" 
                  stroke="none"
                  fill="url(#colorMargin)" 
                  connectNulls
                />
                <Area 
                  type="monotone" 
                  dataKey="lowerBound" 
                  stroke="none"
                  fill="var(--bg-card)" 
                  connectNulls
                />
                {/* Actual Forecast Line */}
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="var(--accent-secondary)" 
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCash)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Mini Breakdown */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Asset Allocations</h3>
            <button className="glass-btn-text" onClick={() => setActiveView('optimizer')} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Optimize <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
            {data.assets.map(a => {
              const allocationPct = (a.balance / data.netWorth) * 100;
              const colorMap = {
                Stock: 'var(--accent-primary)',
                Bond: 'var(--accent-secondary)',
                Crypto: 'var(--accent-warning)',
                Commodity: '#fb7185',
                Cash: 'var(--accent-success)'
              };
              const color = colorMap[a.category];

              return (
                <div key={a.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600' }}>{a.symbol} <span style={{ color: 'var(--text-dim)', fontWeight: '400' }}>({a.category})</span></span>
                    <span>{fmt(a.balance)} ({allocationPct.toFixed(1)}%)</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: '6px', background: 'hsla(0, 0%, 100%, 0.05)', borderRadius: '3px', width: '100%', overflow: 'hidden' }}>
                    <div style={{ width: `${allocationPct}%`, height: '100%', background: color, borderRadius: '3px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Bottom Row: Smart Alerts and Recent Transactions */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* AI Financial Health Watch */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="var(--accent-success)" />
            Aura Intelligence Guard
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {lowCashAlerts.length > 0 ? (
              <div className="glass-panel" style={{ 
                padding: '16px', 
                background: 'rgba(239, 68, 68, 0.04)', 
                borderColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                gap: '14px',
                borderRadius: '8px'
              }}>
                <ShieldAlert size={24} color="var(--accent-danger)" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>Expected Cash Reserves Contraction</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '4px' }}>
                    Due to seasonal variables, projected expense rates cross income margins in **{lowCashAlerts[0].monthName}**. Click **Runway Predictor** to adjust recurring costs and test savings scenarios.
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ 
                padding: '16px', 
                background: 'rgba(16, 185, 129, 0.04)', 
                borderColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                gap: '14px',
                borderRadius: '8px'
              }}>
                <ShieldCheck size={24} color="var(--accent-success)" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>Cash Flows Stable</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '4px' }}>
                    Your income surpasses total recurring expenses for all projected 12 months. Your current runway margin is excellent, allowing safe extra allocation to investments.
                  </p>
                </div>
              </div>
            )}

            {/* MPT Recommendation Alert */}
            <div className="glass-panel" style={{ 
              padding: '16px', 
              background: 'rgba(147, 51, 234, 0.04)', 
              borderColor: 'rgba(147, 51, 234, 0.15)',
              display: 'flex',
              gap: '14px',
              borderRadius: '8px'
            }}>
              <TrendingUp size={24} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>Portfolio Optimality Available</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '4px' }}>
                  Your current portfolio lies below the Markowitz Efficient Frontier. Running MPT rebalancing will improve your expected return without increasing risk. Talk to Aura in the **Aura Advisor** tab for a detailed strategy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Ledger Entries */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Recent Transactions</h3>
            <button className="glass-btn" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setActiveView('advisor')}>
              <PlusCircle size={14} /> Add Transaction
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', maxHeight: '240px' }}>
            {data.transactions.slice(0, 5).map(t => (
              <div 
                key={t.id} 
                className="glass-panel" 
                style={{ 
                  padding: '12px 16px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: 'hsla(0, 0%, 100%, 0.01)',
                  borderRadius: '8px'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{t.description}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{t.date} • {t.category}</span>
                </div>
                <div style={{ 
                  fontWeight: '700', 
                  fontSize: '0.95rem',
                  color: t.type === 'income' ? 'var(--accent-success)' : 'var(--text-main)' 
                }}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
    </div>
  );
};
