import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { 
  Sliders, 
  Plus, 
  Calendar
} from 'lucide-react';

export const CashFlowForecaster: React.FC = () => {
  const { data, forecast, updateProfile, addTransaction } = useFinance();
  
  // Simulated transaction input states
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState('');
  const [cat, setCat] = useState<'Salary' | 'Shopping' | 'Other'>('Other');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');

  // Format helper
  const fmt = (val: number) => `$${val.toLocaleString()}`;

  const handleAddSimulatedTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amt || isNaN(Number(amt))) return;

    addTransaction({
      description: desc + ' (Simulated)',
      amount: Number(amt),
      category: cat,
      type: txType,
      isRecurring: false
    });

    setDesc('');
    setAmt('');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px' }}>
      
      {/* 1. Left Controls: Sliders and Simulator */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Sliders Profile Adjuster */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Sliders size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.15rem' }}>Forecaster Variable Knobs</h3>
          </div>

          {/* Monthly Salary */}
          <div className="glass-slider-group">
            <div className="slider-header">
              <span className="glass-label" style={{ marginBottom: 0 }}>Monthly Salary</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{fmt(data.profile.monthlySalary)}</span>
            </div>
            <input 
              type="range" 
              min="1000" 
              max="15000" 
              step="100"
              className="glass-range"
              value={data.profile.monthlySalary}
              onChange={(e) => updateProfile({ monthlySalary: Number(e.target.value) })}
            />
          </div>

          {/* Housing Cost */}
          <div className="glass-slider-group">
            <div className="slider-header">
              <span className="glass-label" style={{ marginBottom: 0 }}>Rent / Mortgage</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{fmt(data.profile.housingCost)}</span>
            </div>
            <input 
              type="range" 
              min="200" 
              max="5000" 
              step="50"
              className="glass-range"
              value={data.profile.housingCost}
              onChange={(e) => updateProfile({ housingCost: Number(e.target.value) })}
            />
          </div>

          {/* Utilities */}
          <div className="glass-slider-group">
            <div className="slider-header">
              <span className="glass-label" style={{ marginBottom: 0 }}>Utilities</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{fmt(data.profile.utilityCost)}</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="1000" 
              step="10"
              className="glass-range"
              value={data.profile.utilityCost}
              onChange={(e) => updateProfile({ utilityCost: Number(e.target.value) })}
            />
          </div>

          {/* Subscriptions */}
          <div className="glass-slider-group">
            <div className="slider-header">
              <span className="glass-label" style={{ marginBottom: 0 }}>Subscriptions</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{fmt(data.profile.subscriptionCost)}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="500" 
              step="5"
              className="glass-range"
              value={data.profile.subscriptionCost}
              onChange={(e) => updateProfile({ subscriptionCost: Number(e.target.value) })}
            />
          </div>

          {/* Other Fixed Bills */}
          <div className="glass-slider-group">
            <div className="slider-header">
              <span className="glass-label" style={{ marginBottom: 0 }}>Other Fixed Bills</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{fmt(data.profile.otherFixedCosts)}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="3000" 
              step="50"
              className="glass-range"
              value={data.profile.otherFixedCosts}
              onChange={(e) => updateProfile({ otherFixedCosts: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Transaction Simulator */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Calendar size={20} color="var(--accent-secondary)" />
            <h3 style={{ fontSize: '1.15rem' }}>One-Off Event Simulator</h3>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '16px' }}>
            Simulate a lump-sum cash flow (e.g. bonus checks or hardware upgrades) to observe immediate runway feedback.
          </p>

          <form onSubmit={handleAddSimulatedTx} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="glass-label">Description</label>
              <input 
                type="text" 
                className="glass-input" 
                value={desc} 
                onChange={(e) => setDesc(e.target.value)} 
                placeholder="e.g. MacBook Pro M4 Upgrade" 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="glass-label">Amount ($)</label>
                <input 
                  type="number" 
                  className="glass-input" 
                  value={amt} 
                  onChange={(e) => setAmt(e.target.value)} 
                  placeholder="2499" 
                  required 
                />
              </div>

              <div>
                <label className="glass-label">Type</label>
                <select 
                  className="glass-input"
                  style={{ background: 'var(--bg-input)' }}
                  value={txType} 
                  onChange={(e) => {
                    const val = e.target.value as 'income' | 'expense';
                    setTxType(val);
                    setCat(val === 'income' ? 'Salary' : 'Shopping');
                  }}
                >
                  <option value="expense">Expense (-)</option>
                  <option value="income">Income (+)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="glass-btn glass-btn-secondary" style={{ marginTop: '6px', justifyContent: 'center' }}>
              <Plus size={16} /> Inject Simulated Event
            </button>
          </form>
        </div>

      </div>

      {/* 2. Right Panels: Detailed Chart and Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Forecaster Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>12-Month Projected Liquidity</h3>
          
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCashFull" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsla(180, 85%, 50%, 0.08)" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="hsla(180, 85%, 50%, 0.08)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsla(0, 0%, 100%, 0.05)" />
                <XAxis dataKey="monthName" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-panel)', borderColor: 'var(--border-card)', borderRadius: '8px' }} 
                  labelStyle={{ color: 'var(--text-muted)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="upperBound" 
                  stroke="none"
                  fill="url(#colorConfidence)" 
                  name="Confidence Band Upper"
                />
                <Area 
                  type="monotone" 
                  dataKey="lowerBound" 
                  stroke="none"
                  fill="var(--bg-card)" 
                  name="Confidence Band Lower"
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="var(--accent-secondary)" 
                  strokeWidth={3}
                  fill="url(#colorCashFull)" 
                  name="Forecasted Cash"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projection Data Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Expected Cash Flow Ledger</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>Month</th>
                  <th style={{ padding: '12px 16px' }}>Projected Income</th>
                  <th style={{ padding: '12px 16px' }}>Projected Expense</th>
                  <th style={{ padding: '12px 16px' }}>Net Monthly Save</th>
                  <th style={{ padding: '12px 16px' }}>Ending Cash</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map((f) => {
                  const netSave = f.income - f.expense;
                  return (
                    <tr key={f.monthIndex} style={{ borderBottom: '1px solid hsla(0, 0%, 100%, 0.03)', height: '48px' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>{f.monthName}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--accent-success)' }}>{fmt(f.income)}</td>
                      <td style={{ padding: '12px 16px' }}>{fmt(f.expense)}</td>
                      <td style={{ 
                        padding: '12px 16px', 
                        fontWeight: '600',
                        color: netSave >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' 
                      }}>
                        {netSave >= 0 ? '+' : ''}{fmt(netSave)}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--accent-secondary)' }}>{fmt(f.balance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
