import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { getPortfolioMetrics } from '../utils/portfolio';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis,
  Tooltip, 
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from 'recharts';
import { 
  ShieldCheck, 
  Scale, 
  TrendingUp,
  ArrowRightLeft,
  Cpu
} from 'lucide-react';

export const PortfolioOptimizer: React.FC = () => {
  const { 
    data, 
    efficientFrontier, 
    optimalPortfolio, 
    updateProfile, 
    updateCorporateProfile,
    updateAssetBalance,
    simulatorMode,
    aimlClusters,
    aimlFeatureImportance
  } = useFinance();

  const fmt = (val: number) => `$${val.toLocaleString()}`;
  const pct = (val: number) => `${(val * 100).toFixed(1)}%`;

  // Calculate current portfolio return & volatility
  const totalAssetsVal = data.netWorth;
  const currentWeights = data.assets.map(a => a.balance / (totalAssetsVal || 1));
  
  // Calculate current performance
  const currentMetrics = getPortfolioMetrics(currentWeights, data.assets, 0.04);

  const activeTolerance = simulatorMode === 'corporate' 
    ? data.corporateProfile.riskTolerance 
    : data.profile.riskTolerance;

  const handleRiskChange = (level: 'conservative' | 'moderate' | 'aggressive') => {
    if (simulatorMode === 'corporate') {
      updateCorporateProfile({ riskTolerance: level });
    } else {
      updateProfile({ riskTolerance: level });
    }
  };

  // Construct chart data
  const scatterPoints = efficientFrontier.map(p => ({
    x: Number((p.volatility * 100).toFixed(2)),
    y: Number((p.returnVal * 100).toFixed(2)),
    name: 'Simulated Portfolio'
  }));

  const currentPoint = {
    x: Number((currentMetrics.volatility * 100).toFixed(2)),
    y: Number((currentMetrics.expectedReturn * 100).toFixed(2)),
    name: 'Current Portfolio'
  };

  const optimalPoint = {
    x: Number((optimalPortfolio.volatility * 100).toFixed(2)),
    y: Number((optimalPortfolio.expectedReturn * 100).toFixed(2)),
    name: 'Optimal Portfolio'
  };

  // Compile trade steps to rebalance
  const rebalanceSteps: { asset: string; action: 'buy' | 'sell' | 'hold'; amount: number }[] = [];
  data.assets.forEach((asset, idx) => {
    const currentWeight = currentWeights[idx];
    const optimalWeight = optimalPortfolio.weights[idx] || 0;
    const diffVal = (optimalWeight - currentWeight) * totalAssetsVal;
    
    if (Math.abs(diffVal) > 100) {
      rebalanceSteps.push({
        asset: asset.symbol,
        action: diffVal > 0 ? 'buy' : 'sell',
        amount: Math.abs(diffVal)
      });
    }
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px' }}>
      
      {/* 1. Left Controls: Risk selection and asset size adjusters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Risk profile Selector */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Scale size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.15rem' }}>Risk Target Boundary</h3>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '20px' }}>
            Select target risk boundaries. The quantitative optimizer solves asset allocations to match.
          </p>

          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            {['conservative', 'moderate', 'aggressive'].map((level) => (
              <button
                key={level}
                onClick={() => handleRiskChange(level as any)}
                className="glass-btn"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  background: activeTolerance === level 
                    ? 'var(--accent-primary)' 
                    : 'hsla(0, 0%, 100%, 0.02)',
                  borderColor: activeTolerance === level 
                    ? 'var(--accent-primary)' 
                    : 'var(--border-card)',
                  justifyContent: 'center'
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Assets Holdings Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <TrendingUp size={20} color="var(--accent-secondary)" />
            <h3 style={{ fontSize: '1.15rem' }}>Current Holdings Size</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.assets.map((asset) => {
              const clusterLabel = aimlClusters[asset.symbol] || 'Safe Haven';
              let badgeColor = 'rgba(16, 185, 129, 0.1)';
              let textHex = 'var(--accent-success)';
              if (clusterLabel === 'Speculative') {
                badgeColor = 'rgba(239, 68, 68, 0.1)';
                textHex = 'var(--accent-danger)';
              } else if (clusterLabel === 'Growth') {
                badgeColor = 'rgba(99, 102, 241, 0.1)';
                textHex = 'var(--accent-primary)';
              } else if (clusterLabel === 'Defensive') {
                badgeColor = 'rgba(245, 158, 11, 0.1)';
                textHex = 'var(--accent-warning)';
              }

              return (
                <div key={asset.id} className="glass-slider-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {asset.symbol} 
                      <span className="badge mini" style={{ backgroundColor: badgeColor, color: textHex, fontSize: '0.65rem' }}>
                        {clusterLabel}
                      </span>
                    </span>
                    <span style={{ fontWeight: '700' }}>{fmt(asset.balance)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="40000" 
                    step="500"
                    className="glass-range"
                    value={asset.balance}
                    onChange={(e) => updateAssetBalance(asset.id, Number(e.target.value))}
                  />
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 2. Right Panels: Efficient Frontier Plot & Recommendations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Scatter Efficient Frontier Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Markowitz Efficient Frontier</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '20px' }}>
            Plots 100 randomized portfolios displaying Volatility vs Expected Returns. Upper edge forms optimal asset combinations.
          </p>

          <div style={{ width: '100%', height: '300px', position: 'relative' }}>
            {/* Custom Legend */}
            <div style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '6px',
              fontSize: '0.75rem',
              background: 'var(--bg-panel)',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid var(--border-card)',
              zIndex: 5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'hsla(270, 85%, 65%, 0.45)' }}></span>
                <span>Simulated Mixes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-danger)', boxShadow: '0 0 10px var(--accent-danger)' }}></span>
                <span>Current Profile</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-success)', boxShadow: '0 0 10px var(--accent-success)' }}></span>
                <span>Optimal (Max Sharpe)</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsla(0, 0%, 100%, 0.04)" />
                <XAxis type="number" dataKey="x" name="Risk (Volatility)" unit="%" stroke="var(--text-dim)" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
                <YAxis type="number" dataKey="y" name="Expected Return" unit="%" stroke="var(--text-dim)" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
                <ZAxis type="number" range={[50, 200]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ background: 'var(--bg-panel)', borderColor: 'var(--border-card)', borderRadius: '8px' }}
                />
                
                {/* Efficient frontier randomized points */}
                <Scatter name="Efficient Frontier Portfolio" data={scatterPoints} fill="var(--accent-primary)" opacity={0.35} shape="circle" />
                
                {/* Current Portfolio point */}
                <Scatter name="Current Portfolio" data={[currentPoint]} fill="var(--accent-danger)">
                  <Cell fill="var(--accent-danger)" stroke="var(--text-main)" strokeWidth={1} style={{ filter: 'drop-shadow(0 0 8px var(--accent-danger))' }} />
                </Scatter>
                
                {/* Optimal Portfolio point */}
                <Scatter name="Optimal Portfolio" data={[optimalPoint]} fill="var(--accent-success)">
                  <Cell fill="var(--accent-success)" stroke="var(--text-main)" strokeWidth={1} style={{ filter: 'drop-shadow(0 0 8px var(--accent-success))' }} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Optimizations Recommendations Panels Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
          
          {/* Column 1: Detailed Allocation Comparer */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Current vs. Target Weights</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.assets.map((asset, idx) => {
                const currentWeight = currentWeights[idx];
                const optimalWeight = optimalPortfolio.weights[idx] || 0;
                
                return (
                  <div key={asset.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ fontWeight: '600' }}>{asset.symbol}</span>
                      <span>Curr: {pct(currentWeight)} | <strong style={{ color: 'var(--accent-success)' }}>Opt: {pct(optimalWeight)}</strong></span>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', height: '6px', width: '100%', background: 'hsla(0, 0%, 100%, 0.02)', borderRadius: '3px', overflow: 'hidden' }}>
                      {/* Current weight bar */}
                      <div style={{ height: '100%', width: '50%', background: 'hsla(0, 0%, 100%, 0.05)', display: 'flex', justifyContent: 'flex-end', borderRadius: '3px 0 0 3px' }}>
                        <div style={{ width: `${currentWeight * 100}%`, height: '100%', background: 'var(--accent-danger)' }}></div>
                      </div>
                      {/* Optimal weight bar */}
                      <div style={{ height: '100%', width: '50%', background: 'hsla(0, 0%, 100%, 0.05)', display: 'flex', borderRadius: '0 3px 3px 0' }}>
                        <div style={{ width: `${optimalWeight * 100}%`, height: '100%', background: 'var(--accent-success)' }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Macro Feature Importance (Random Forest) */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Cpu size={16} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.05rem' }}>ML Volatility Drivers</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {aimlFeatureImportance.map((f, idx) => {
                const colors = ['var(--accent-warning)', 'var(--accent-primary)', 'var(--accent-secondary)', 'var(--text-muted)'];
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ fontWeight: '600' }}>{f.name}</span>
                      <span style={{ fontWeight: '700' }}>{f.importance.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'hsla(0, 0%, 100%, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${f.importance}%`, height: '100%', background: colors[idx % 4], borderRadius: '3px' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 3: Trade instructions list */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ArrowRightLeft size={16} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1rem' }}>Rebalancing Trades</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', maxHeight: '160px' }}>
              {rebalanceSteps.length > 0 ? (
                rebalanceSteps.map((step, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    fontSize: '0.8rem',
                    padding: '6px 10px',
                    background: 'hsla(0, 0%, 100%, 0.01)',
                    borderLeft: `3px solid ${step.action === 'buy' ? 'var(--accent-success)' : 'var(--accent-danger)'}`,
                    borderRadius: '4px'
                  }}>
                    <span>{step.action === 'buy' ? 'Buy' : 'Sell'} <strong>{step.asset}</strong></span>
                    <span style={{ fontWeight: '700', color: step.action === 'buy' ? 'var(--accent-success)' : 'var(--text-main)' }}>
                      {fmt(Math.round(step.amount))}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '10px' }}>
                  <ShieldCheck size={16} color="var(--accent-success)" style={{ flexShrink: 0 }} />
                  <span>Portfolio matches target optimization. No trades needed.</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
