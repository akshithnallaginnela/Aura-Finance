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
  const [investmentCapital, setInvestmentCapital] = useState<number>(100000);

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
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/optimize_portfolio`, {
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
      let friendlyMessage = err.message || 'An unexpected error occurred.';
      if (friendlyMessage.toLowerCase().includes('failed to fetch') || friendlyMessage.toLowerCase().includes('networkerror') || friendlyMessage.toLowerCase().includes('load failed')) {
        friendlyMessage = 'Sorry, I am having trouble connecting to the backend. Please check if the backend service is running and accessible.';
      }
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="panel" style={{ padding: '24px', minHeight: '600px', margin: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ padding: '10px', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: '12px' }}>
          <PieChartIcon size={24} color="var(--amber)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tx)', margin: 0 }}>Modern Portfolio Theory (MPT) Optimizer</h2>
          <p style={{ color: 'var(--tx3)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Calculates the Efficient Frontier to find the optimal weighting for maximum Sharpe Ratio.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Input Column */}
        <div style={{ flex: '1 1 350px' }}>
          <form onSubmit={handleOptimize} className="panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--tx)' }}>Assets to Optimize</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--tx2)', marginBottom: '8px' }}>
                ENTER TICKERS (COMMA SEPARATED)
              </label>
              <textarea 
                className="search-input"
                style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                value={tickersInput}
                onChange={(e) => setTickersInput(e.target.value)}
                placeholder="e.g. RELIANCE.NS, TCS.NS, ITC.NS"
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              className="seg-btn" 
              style={{ width: '100%', justifyContent: 'center', padding: '10px', display: 'flex', gap: '8px' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'currentColor', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
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
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--red-bg)', borderRadius: '8px', display: 'flex', gap: '8px', color: 'var(--red)', fontSize: '0.85rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* Details Card */}
          {result && (
            <div className="panel" style={{ padding: '24px', marginTop: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--tx)' }}>Risk & Return Profile</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--tx3)', fontWeight: 600 }}>EXPECTED ANNUAL RETURN</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)' }}>+{result.expected_annual_return}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--tx3)', fontWeight: 600 }}>EXPECTED VOLATILITY (RISK)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--red)' }}>{result.expected_volatility}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--tx3)', fontWeight: 600 }}>SHARPE RATIO</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--amber)' }}>{result.sharpe_ratio}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart Column */}
        <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column' }}>
          {result ? (
            <div className="panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px', color: 'var(--tx)', textAlign: 'center' }}>Optimal Allocation Weights</h3>
              
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
                  <div key={a.ticker} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--bg2)', borderRadius: '20px', border: '1px solid var(--line)', fontSize: '0.85rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    <span style={{ fontWeight: 600, color: 'var(--tx)' }}>{a.ticker}</span>
                    <span style={{ color: 'var(--tx3)' }}>{a.weight}%</span>
                  </div>
                ))}
              </div>

              {/* TARGET CAPITAL ALLOCATION SIMULATOR */}
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tx3)', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>Simulate Investment Capital</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--amber)' }}>₹{investmentCapital.toLocaleString('en-IN')}</span>
                </div>
                <input 
                  type="range" 
                  min="10000" 
                  max="1000000" 
                  step="10000" 
                  value={investmentCapital} 
                  onChange={(e) => setInvestmentCapital(Number(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--amber)', cursor: 'pointer', marginBottom: '20px' }}
                />

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', color: 'var(--tx)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--tx3)', textAlign: 'left' }}>
                        <th style={{ padding: '6px 8px', fontFamily: 'var(--mono)' }}>ASSET</th>
                        <th style={{ padding: '6px 8px', fontFamily: 'var(--mono)', textAlign: 'right' }}>WEIGHT</th>
                        <th style={{ padding: '6px 8px', fontFamily: 'var(--mono)', textAlign: 'right' }}>ALLOCATION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.allocations.map((a, i) => {
                        const targetAmt = (a.weight / 100) * investmentCapital;
                        return (
                          <tr key={a.ticker} style={{ borderBottom: '1px solid var(--line)', height: '32px' }}>
                            <td style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                              <span style={{ fontWeight: 600 }}>{a.ticker}</span>
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{a.weight}%</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--green)' }}>
                              ₹{targetAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="panel" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--tx)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PieChartIcon size={18} color="var(--amber)" />
                  Select a Quick Preset Portfolio
                </h3>
                <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginBottom: '14px', lineHeight: 1.4 }}>
                  Select one of our pre-configured asset strategies to quickly load their tickers:
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="seg-btn" 
                    onClick={() => setTickersInput('RELIANCE.NS, TCS.NS, HDFCBANK.NS, INFY.NS')}
                    style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: '4px' }}
                  >
                    🇮🇳 Blue Chip Giants
                  </button>
                  <button 
                    type="button" 
                    className="seg-btn" 
                    onClick={() => setTickersInput('TCS.NS, INFY.NS, WIPRO.NS, HCLTECH.NS, TECHM.NS')}
                    style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: '4px' }}
                  >
                    💻 India IT Leaders
                  </button>
                  <button 
                    type="button" 
                    className="seg-btn" 
                    onClick={() => setTickersInput('HDFCBANK.NS, ICICIBANK.NS, SBIN.NS, AXISBANK.NS, KOTAKBANK.NS')}
                    style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: '4px' }}
                  >
                    🏦 Banking Heavyweights
                  </button>
                </div>
              </div>

              <div className="panel" style={{ padding: '20px', flex: 1 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--tx)', marginBottom: '14px' }}>
                  Core MPT Concepts
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '12px', border: '1px solid var(--line)', borderRadius: '6px', background: 'var(--bg2)' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--amber)', fontWeight: 600, margin: '0 0 6px 0' }}>Efficient Frontier</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--tx3)', margin: 0, lineHeight: 1.4 }}>
                      The set of optimal portfolios that offer the highest expected return for a defined level of risk.
                    </p>
                  </div>
                  <div style={{ padding: '12px', border: '1px solid var(--line)', borderRadius: '6px', background: 'var(--bg2)' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--amber)', fontWeight: 600, margin: '0 0 6px 0' }}>Sharpe Ratio</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--tx3)', margin: 0, lineHeight: 1.4 }}>
                      Measures excess return per unit of volatility in an asset or strategy. Higher ratio indicates better risk-adjusted returns.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
