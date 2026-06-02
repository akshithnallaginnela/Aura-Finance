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
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Brain,
  AlertTriangle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    data, 
    forecast, 
    setActiveView, 
    // AIML states
    activeModel,
    aimlAccuracy,
    aimlAnomalies,
    aimlFeatureImportance,
    isBackendConnected
  } = useFinance();

  // Summarize stats
  const forecastEnd = forecast.length > 0 ? forecast[forecast.length - 1].balance : data.cashBalance;
  
  const incomeVal = data.mode === 'corporate' ? data.corporateProfile.monthlyRevenue : data.profile.monthlySalary;
  const expenseVal = sumFixedExpenses();

  function sumFixedExpenses() {
    if (data.mode === 'corporate') {
      return (
        data.corporateProfile.cogsCost +
        data.corporateProfile.opExCost +
        data.corporateProfile.capExCost +
        data.corporateProfile.debtServiceCost
      );
    } else {
      return (
        data.profile.housingCost + 
        data.profile.utilityCost + 
        data.profile.subscriptionCost + 
        data.profile.otherFixedCosts
      );
    }
  }

  const monthlySavings = incomeVal - expenseVal;

  // Identify any forecast alerts (months where projected expenses > income)
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
      
      {/* 1. KPI Cards Row */}
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

        <div className="glass-panel kpi-card glass-panel-glow-yellow">
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

        {/* New AIML Intelligence guard card */}
        <div className="glass-panel kpi-card glass-panel-glow-green" onClick={() => setActiveView('macro')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">AIML Forecaster</span>
            <Brain size={20} color="var(--accent-success)" />
          </div>
          <span className="kpi-value" style={{ marginTop: '8px' }}>{aimlAccuracy}%</span>
          <span className="kpi-trend" style={{ color: isBackendConnected ? 'var(--accent-success)' : 'var(--text-muted)' }}>
            <span>Model: {activeModel.toUpperCase()} ({isBackendConnected ? 'Python' : 'JS Fallback'})</span>
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
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                {activeModel === 'holt-winters' ? 'Holt-Winters Seasonal Additive' : activeModel === 'neural' ? 'MLP Feedforward Neural Network' : 'ARIMA Autoregressive'} model prediction
              </p>
            </div>
            <button className="glass-btn-text" onClick={() => setActiveView('forecaster')} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Runway Predictor <ArrowRight size={14} />
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
                Cash: 'var(--accent-success)',
                Treasury: 'var(--accent-primary)',
                'Money Market': '#818cf8',
                'Corporate Bond': '#a855f7'
              };
              const color = colorMap[a.category] || 'var(--text-dim)';

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

      {/* 3. Bottom Row: Smart Alerts, Feature Importance, and Ledger */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Column 1: AI Financial Health Watch */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--accent-success)" />
            Aura Intel Guard
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, contentVisibility: 'auto' }}>
            {lowCashAlerts.length > 0 ? (
              <div className="glass-panel animate-pulse" style={{ 
                padding: '12px', 
                background: 'rgba(239, 68, 68, 0.03)', 
                borderColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                gap: '10px',
                borderRadius: '8px'
              }}>
                <ShieldAlert size={20} color="var(--accent-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>Cash Runways Contraction</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3', marginTop: '2px' }}>
                    Expenses exceed inflows in **{lowCashAlerts[0].monthName}**. Adjust macro variables in the simulator view to mitigate.
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ 
                padding: '12px', 
                background: 'rgba(16, 185, 129, 0.03)', 
                borderColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                gap: '10px',
                borderRadius: '8px'
              }}>
                <ShieldCheck size={20} color="var(--accent-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Stable Net Cash Flow</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3', marginTop: '2px' }}>
                    Your income surpasses total recurring expenses for all projected 12 months. Runway margin is stable.
                  </p>
                </div>
              </div>
            )}

            {/* Anomaly Alerts KPI card */}
            {aimlAnomalies.length > 0 ? (
              <div className="glass-panel" style={{ 
                padding: '12px', 
                background: 'rgba(245, 158, 11, 0.03)', 
                borderColor: 'rgba(245, 158, 11, 0.2)',
                display: 'flex',
                gap: '10px',
                borderRadius: '8px'
              }}>
                <AlertTriangle size={20} color="var(--accent-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Outliers Flagged</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3', marginTop: '2px' }}>
                    **{aimlAnomalies.length} spending anomalies** detected by Z-Score engine. Review red indicators in transaction ledger.
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ 
                padding: '12px', 
                background: 'rgba(99, 102, 241, 0.03)', 
                borderColor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                gap: '10px',
                borderRadius: '8px'
              }}>
                <Cpu size={20} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Ledger Normalcy Verified</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3', marginTop: '2px' }}>
                    All recent transactions lie within standard statistical bounds (Z-Score &lt; 2.2).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Macro Feature Importance */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="var(--accent-primary)" />
              ML Regressor Importance
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>Factors driving projected portfolio volatility (Random Forest Importance)</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'center' }}>
            {aimlFeatureImportance.slice(0, 4).map((f, idx) => {
              const colors = ['var(--accent-warning)', 'var(--accent-primary)', 'var(--accent-secondary)', 'var(--text-muted)'];
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: '600' }}>{f.name}</span>
                    <span style={{ fontWeight: '700' }}>{f.importance.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '5px', background: 'hsla(0, 0%, 100%, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${f.importance}%`, height: '100%', background: colors[idx % 4], borderRadius: '3px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Recent Ledger Entries */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Transaction Ledger</h3>
            <button className="glass-btn" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setActiveView('advisor')}>
              <PlusCircle size={12} /> Add
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', maxHeight: '230px' }}>
            {data.transactions.slice(0, 5).map(t => {
              const isAnomaly = aimlAnomalies.includes(t.id);
              return (
                <div 
                  key={t.id} 
                  className={`glass-panel ${isAnomaly ? 'glass-panel-anomaly' : ''}`}
                  style={{ 
                    padding: '10px 14px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: isAnomaly ? 'rgba(239, 68, 68, 0.04)' : 'hsla(0, 0%, 100%, 0.01)',
                    borderColor: isAnomaly ? 'rgba(239, 68, 68, 0.25)' : 'var(--border-card)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isAnomaly && <AlertTriangle size={14} color="var(--accent-danger)" style={{ flexShrink: 0 }} />}
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.description}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{t.date} • {t.category}</span>
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: '700', 
                    fontSize: '0.9rem',
                    color: t.type === 'income' ? 'var(--accent-success)' : isAnomaly ? 'var(--accent-danger)' : 'var(--text-main)' 
                  }}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
    </div>
  );
};
