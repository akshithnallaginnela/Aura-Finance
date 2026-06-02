import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  TrendingUp, 
  Percent, 
  AlertTriangle, 
  Flame, 
  Activity, 
  Database,
  Cpu,
  RefreshCw
} from 'lucide-react';

export const MacroSimulator: React.FC = () => {
  const {
    simulatorMode,
    setSimulatorMode,
    macroIndicators,
    setMacroIndicators,
    stressScenario,
    setStressScenario,
    stressIntensity,
    setStressIntensity,
    macroStabilityIndex,
    // AIML states
    activeModel,
    setActiveModel,
    aimlAccuracy,
    disasterRisks,
    investRecommendations,
    isBackendConnected,
    isRecalculating
  } = useFinance();

  const handleIndicatorChange = (key: keyof typeof macroIndicators, val: number) => {
    setMacroIndicators({
      ...macroIndicators,
      [key]: val
    });
  };

  // Dial SVG calculation
  const radius = 50;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (macroStabilityIndex / 100) * circumference;

  // Determine dial color
  let stabilityColor = 'var(--accent-success)';
  if (macroStabilityIndex < 40) {
    stabilityColor = 'var(--accent-danger)';
  } else if (macroStabilityIndex < 70) {
    stabilityColor = 'var(--accent-warning)';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header with Mode Toggle & Backend Status */}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={24} color="var(--accent-primary)" />
            AIML Lab & Macro Simulator
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            Interact with macroeconomic indicators and test machine learning forecasting models
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isRecalculating && <RefreshCw size={16} className="spin" color="var(--text-dim)" />}
          
          <div className={`status-badge ${isBackendConnected ? 'status-connected' : 'status-offline'}`}>
            <span className="status-dot"></span>
            {isBackendConnected ? 'Python ML Server Connected' : 'Offline Fallback Active'}
          </div>

          <div style={{ display: 'flex', background: 'hsla(0, 0%, 100%, 0.03)', borderRadius: '30px', padding: '3px', border: '1px solid var(--border-card)' }}>
            <button 
              className={`glass-tab-btn ${simulatorMode === 'retail' ? 'active' : ''}`}
              onClick={() => setSimulatorMode('retail')}
            >
              Retail Mode
            </button>
            <button 
              className={`glass-tab-btn ${simulatorMode === 'corporate' ? 'active' : ''}`}
              onClick={() => setSimulatorMode('corporate')}
            >
              Corporate Mode
            </button>
          </div>
        </div>
      </section>

      {/* 2. Main Lab Row */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Left Column: Sliders and Scenario Tester */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>Macroeconomic Regressors</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Slide values to re-train the models with custom interest and inflation projections</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* GDP Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <TrendingUp size={16} color="var(--accent-primary)" />
                  Annual GDP Growth Rate
                </span>
                <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{(macroIndicators.gdpGrowth * 100).toFixed(1)}%</span>
              </div>
              <input 
                type="range" 
                min="-0.04" 
                max="0.08" 
                step="0.005"
                value={macroIndicators.gdpGrowth} 
                onChange={(e) => handleIndicatorChange('gdpGrowth', parseFloat(e.target.value))}
                className="glass-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                <span>-4.0% (Recession)</span>
                <span>2.0% (Stable)</span>
                <span>8.0% (Expansion)</span>
              </div>
            </div>

            {/* Inflation Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <Percent size={16} color="var(--accent-warning)" />
                  Annual Inflation Rate (CPI)
                </span>
                <span style={{ fontWeight: '700', color: 'var(--accent-warning)' }}>{(macroIndicators.inflationRate * 100).toFixed(1)}%</span>
              </div>
              <input 
                type="range" 
                min="0.0" 
                max="0.12" 
                step="0.005"
                value={macroIndicators.inflationRate} 
                onChange={(e) => handleIndicatorChange('inflationRate', parseFloat(e.target.value))}
                className="glass-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                <span>0.0% (Deflation)</span>
                <span>2.5% (Target)</span>
                <span>12.0% (Hyperinflation)</span>
              </div>
            </div>

            {/* Interest Rate Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <Activity size={16} color="var(--accent-secondary)" />
                  Fed Funds Interest Rate
                </span>
                <span style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>{(macroIndicators.interestRate * 100).toFixed(1)}%</span>
              </div>
              <input 
                type="range" 
                min="0.0" 
                max="0.14" 
                step="0.005"
                value={macroIndicators.interestRate} 
                onChange={(e) => handleIndicatorChange('interestRate', parseFloat(e.target.value))}
                className="glass-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                <span>0.0% (Zero Bound)</span>
                <span>4.5% (Neutral)</span>
                <span>14.0% (Restrictive)</span>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-card)', margin: '10px 0' }} />

          {/* Black Swan Scenario Trigger */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={18} color="var(--accent-danger)" />
              Black Swan Stress Scenario
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
              <div>
                <label className="glass-label">Select Stressor</label>
                <select 
                  className="glass-input" 
                  value={stressScenario}
                  onChange={(e) => setStressScenario(e.target.value as any)}
                >
                  <option value="none">No Shock (Standard Baseline)</option>
                  <option value="pandemic">🦠 Global Health Pandemic</option>
                  <option value="supply_chain_shock">🚢 Supply Chain Gridlock</option>
                  <option value="rate_hike">📈 Shock Rate Hike (Tightening)</option>
                  <option value="market_crash">📉 Tech Market Correction</option>
                </select>
              </div>
              
              {stressScenario !== 'none' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <label className="glass-label">Intensity</label>
                    <span style={{ fontWeight: '700', color: 'var(--accent-danger)' }}>{(stressIntensity * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.1"
                    value={stressIntensity} 
                    onChange={(e) => setStressIntensity(parseFloat(e.target.value))}
                    className="glass-slider"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Stability Gauge & Active Forecasting Model */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Stability Gauge Panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', minHeight: '180px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Macro Stability Index</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', maxWidth: '160px', lineHeight: '1.4' }}>
                Mathematical model calculating country liquidity & inflation thresholds
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                <span className="badge" style={{ backgroundColor: stabilityColor, color: '#000', fontWeight: '700' }}>
                  {macroStabilityIndex >= 70 ? 'STABLE' : macroStabilityIndex >= 40 ? 'WARNING' : 'VOLATILE'}
                </span>
              </div>
            </div>
            
            {/* Circular Gauge */}
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  stroke="hsla(0, 0%, 100%, 0.05)"
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                <circle
                  stroke={stabilityColor}
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference + ' ' + circumference}
                  style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.35s' }}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: '800',
                color: '#fff'
              }}>
                {macroStabilityIndex}
              </div>
            </div>
          </div>

          {/* Model Settings Panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.15rem' }}>Active Forecasting Model</h3>
                <span className="badge font-mono" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', color: 'var(--accent-secondary)' }}>
                  Acc: {aimlAccuracy}%
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>Choose which mathematical model predicts cash runway positions</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                className={`model-option-btn ${activeModel === 'holt-winters' ? 'active' : ''}`}
                onClick={() => setActiveModel('holt-winters')}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Holt-Winters Seasonal Additive</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Double/Triple Exponential Smoothing</div>
                </div>
              </button>

              <button 
                className={`model-option-btn ${activeModel === 'neural' ? 'active' : ''}`}
                onClick={() => setActiveModel('neural')}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>MLP Feedforward Neural Net (Python)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Backpropagation network fitted to history</div>
                </div>
              </button>

              <button 
                className={`model-option-btn ${activeModel === 'arima' ? 'active' : ''}`}
                onClick={() => setActiveModel('arima')}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>ARIMA Autoregressive (Python)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Lag-regression trend projector</div>
                </div>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Bottom Row: Natural Disaster Risks and Investment recommendations */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Disaster risk panels */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={20} color="var(--accent-warning)" />
              Natural Disaster Risk Scorer
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Calculates probability risk scores factoring into future cash reserves depletion
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', flex: 1, contentVisibility: 'auto' }}>
            {/* Pandemic card */}
            <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'hsla(0, 0%, 100%, 0.01)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>🦠 Pandemic Risk</span>
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: disasterRisks.pandemic > 40 ? 'var(--accent-danger)' : 'var(--text-dim)' }}>Risk Index</span>
                  <span style={{ fontWeight: '700' }}>{disasterRisks.pandemic}%</span>
                </div>
                <div style={{ height: '4px', background: 'hsla(0, 0%, 100%, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${disasterRisks.pandemic}%`, 
                    height: '100%', 
                    background: disasterRisks.pandemic > 45 ? 'var(--accent-danger)' : 'var(--accent-warning)', 
                    borderRadius: '2px' 
                  }}></div>
                </div>
              </div>
            </div>

            {/* Supply chain card */}
            <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'hsla(0, 0%, 100%, 0.01)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>🚢 Supply Chain Risk</span>
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: disasterRisks.supplyChain > 40 ? 'var(--accent-danger)' : 'var(--text-dim)' }}>Risk Index</span>
                  <span style={{ fontWeight: '700' }}>{disasterRisks.supplyChain}%</span>
                </div>
                <div style={{ height: '4px', background: 'hsla(0, 0%, 100%, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${disasterRisks.supplyChain}%`, 
                    height: '100%', 
                    background: disasterRisks.supplyChain > 45 ? 'var(--accent-danger)' : 'var(--accent-warning)', 
                    borderRadius: '2px' 
                  }}></div>
                </div>
              </div>
            </div>

            {/* Earthquake card */}
            <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'hsla(0, 0%, 100%, 0.01)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>🌋 Earthquake Risk</span>
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Risk Index</span>
                  <span style={{ fontWeight: '700' }}>{disasterRisks.earthquake}%</span>
                </div>
                <div style={{ height: '4px', background: 'hsla(0, 0%, 100%, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${disasterRisks.earthquake}%`, 
                    height: '100%', 
                    background: 'var(--accent-success)', 
                    borderRadius: '2px' 
                  }}></div>
                </div>
              </div>
            </div>

            {/* Flood card */}
            <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'hsla(0, 0%, 100%, 0.01)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>🌧️ Flood Risk</span>
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Risk Index</span>
                  <span style={{ fontWeight: '700' }}>{disasterRisks.flood}%</span>
                </div>
                <div style={{ height: '4px', background: 'hsla(0, 0%, 100%, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${disasterRisks.flood}%`, 
                    height: '100%', 
                    background: 'var(--accent-secondary)', 
                    borderRadius: '2px' 
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Investment recommendations panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={20} color="var(--accent-primary)" />
              Quantitative Investment Allocator
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Recommends asset class targets by cross-referencing public datasets with your risk tolerance
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
            {investRecommendations.map((rec, idx) => (
              <div 
                key={idx} 
                className="glass-panel" 
                style={{ 
                  padding: '12px 16px', 
                  fontSize: '0.85rem', 
                  lineHeight: '1.5',
                  background: 'rgba(99, 102, 241, 0.02)',
                  borderColor: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: '8px'
                }}
              >
                💡 {rec}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
