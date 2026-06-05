import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon, Settings, AlertCircle } from 'lucide-react';

interface Allocation {
  ticker: string;
  weight: number;
}

interface OptimizationResult {
  expected_annual_return: number;
  expected_volatility: number;
  sharpe_ratio: number;
  allocations: Allocation[];
}

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'];

export const Optimizer: React.FC = () => {
  const [tickersInput, setTickersInput] = useState('RELIANCE.NS, TCS.NS, HDFCBANK.NS, INFY.NS');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    const tickers = tickersInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    if (tickers.length < 2) {
      setError("Please enter at least 2 tickers to optimize a portfolio.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5000/api/optimize_portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tickers })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Optimization failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '32px', minHeight: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ padding: '10px', background: 'var(--accent-primary-light)', borderRadius: '12px' }}>
          <PieChartIcon size={24} color="var(--accent-primary)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Modern Portfolio Theory (MPT) Optimizer</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Calculates the Efficient Frontier to find the optimal weighting for maximum Sharpe Ratio.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Input Column */}
        <div style={{ flex: '1 1 350px' }}>
          <form onSubmit={handleOptimize} className="glass-panel" style={{ padding: '24px', background: 'var(--bg-base)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>Assets to Optimize</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                ENTER TICKERS (COMMA SEPARATED)
              </label>
              <textarea 
                className="glass-input"
                style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                value={tickersInput}
                onChange={(e) => setTickersInput(e.target.value)}
                placeholder="e.g. RELIANCE.NS, TCS.NS, ITC.NS"
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              className="glass-btn" 
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Running Monte Carlo Simulation...
                </>
              ) : (
                <>
                  <Settings size={18} />
                  Optimize Portfolio
                </>
              )}
            </button>

            {error && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--accent-danger-light)', borderRadius: '8px', display: 'flex', gap: '8px', color: 'var(--accent-danger)', fontSize: '0.85rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* Details Card */}
          {result && (
            <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-base)', marginTop: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>Risk & Return Profile</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>EXPECTED ANNUAL RETURN</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-success)' }}>+{result.expected_annual_return}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>EXPECTED VOLATILITY (RISK)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-danger)' }}>{result.expected_volatility}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>SHARPE RATIO</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{result.sharpe_ratio}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart Column */}
        <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column' }}>
          {result ? (
            <div className="glass-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px', color: 'var(--text-main)', textAlign: 'center' }}>Optimal Allocation Weights</h3>
              
              <div style={{ flex: 1, minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={result.allocations}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="weight"
                      nameKey="ticker"
                    >
                      {result.allocations.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: any) => [`${value}%`, 'Allocation']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {result.allocations.map((a, i) => (
                  <div key={a.ticker} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--bg-panel)', borderRadius: '20px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    <span style={{ fontWeight: 600 }}>{a.ticker}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{a.weight}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ flex: 1, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', textAlign: 'center' }}>
              <PieChartIcon size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>No Portfolio Computed</h3>
              <p style={{ maxWidth: '300px', fontSize: '0.9rem' }}>Enter tickers and run the optimizer to see the ideal allocations for maximum return relative to risk.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
