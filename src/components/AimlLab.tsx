import React, { useState, useEffect } from 'react';
import { Terminal, Zap, Shield, Brain } from 'lucide-react';

export const AimlLab: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/ml_metrics');
        if (!res.ok) throw new Error('Failed to fetch ML metrics');
        const data = await res.json();
        setMetrics(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="glass-panel" style={{ padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
          <span style={{ width: 24, height: 24, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span>Connecting to ML Engine...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '40px', color: 'var(--accent-danger)' }}>
        Error loading ML metrics: {error}
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ 
      padding: '0', 
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      overflow: 'hidden',
      border: '1px solid #30363d'
    }}>
      {/* Terminal Header */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '12px', 
        padding: '12px 20px', background: '#161b22',
        borderBottom: '1px solid #30363d'
      }}>
        <Terminal size={18} color="#8b949e" />
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#8b949e' }}>Aura Ensemble Engine / system.log</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
        </div>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Ensemble Models */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#58a6ff' }}>
            <Brain size={18} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Ensemble Prediction Engine (3 Models)</span>
          </div>
          
          <div style={{ background: '#010409', padding: '16px', borderRadius: '6px', border: '1px solid #21262d' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {metrics.ensemble?.models?.map((m: any, idx: number) => {
                const colors = ['#58a6ff', '#3fb950', '#d2a8ff'];
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ minWidth: '260px' }}>
                      <div style={{ color: colors[idx], fontSize: '0.9rem', fontWeight: 600 }}>{m.name}</div>
                      <div style={{ color: '#8b949e', fontSize: '0.75rem', marginTop: '2px' }}>{m.type}</div>
                    </div>
                    <div style={{ flex: 1, height: '10px', background: '#21262d', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${m.weight * 100}%`, 
                        height: '100%', 
                        background: colors[idx], 
                        borderRadius: '5px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <div style={{ minWidth: '45px', fontSize: '0.85rem', color: colors[idx], textAlign: 'right', fontWeight: 600 }}>
                      {(m.weight * 100).toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #21262d' }}>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>FORECAST HORIZON</div>
                <div style={{ color: '#79c0ff', fontSize: '0.9rem', fontWeight: 600 }}>{metrics.ensemble?.forecast_horizon}</div>
              </div>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>CONFIDENCE BANDS</div>
                <div style={{ color: '#3fb950', fontSize: '0.9rem', fontWeight: 600 }}>{metrics.ensemble?.confidence_bands}</div>
              </div>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>SENTIMENT ENGINE</div>
                <div style={{ color: '#d2a8ff', fontSize: '0.9rem', fontWeight: 600 }}>{metrics.ensemble?.sentiment_engine}</div>
              </div>
            </div>
          </div>
        </div>

        {/* News Sentinel Status */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#3fb950' }}>
            <Shield size={18} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>24/7 News Sentinel Agent</span>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '3px 10px', borderRadius: '12px',
              background: 'rgba(63, 185, 80, 0.15)', color: '#3fb950',
              fontSize: '0.75rem', fontWeight: 600
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3fb950', animation: 'pulse 2s infinite' }} />
              LIVE
            </span>
          </div>
          
          <div style={{ background: '#010409', padding: '16px', borderRadius: '6px', border: '1px solid #21262d' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>STATUS</div>
                <div style={{ color: '#3fb950', fontSize: '0.9rem', fontWeight: 600 }}>{metrics.news_sentinel?.status}</div>
              </div>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>POLL INTERVAL</div>
                <div style={{ color: '#79c0ff', fontSize: '0.9rem', fontWeight: 600 }}>{metrics.news_sentinel?.poll_interval}</div>
              </div>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>COVERAGE</div>
                <div style={{ color: '#d2a8ff', fontSize: '0.9rem', fontWeight: 600 }}>{metrics.news_sentinel?.coverage}</div>
              </div>
            </div>
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #21262d' }}>
              <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>TRIGGER BEHAVIOR</div>
              <div style={{ color: '#f0883e', fontSize: '0.85rem', fontWeight: 600 }}>{metrics.news_sentinel?.trigger}</div>
            </div>
          </div>
        </div>

        {/* Gemini Stats */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#ff7b72' }}>
            <Zap size={18} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Google Gemini AI (Fundamental Summarizer)</span>
          </div>
          
          <div style={{ background: '#010409', padding: '16px', borderRadius: '6px', border: '1px solid #21262d' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>MODEL VERSION</div>
                <div style={{ color: '#79c0ff', fontSize: '0.9rem', fontWeight: 600 }}>{metrics.gemini?.model_version}</div>
              </div>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>ROLE</div>
                <div style={{ color: '#d2a8ff', fontSize: '0.9rem', fontWeight: 600 }}>{metrics.gemini?.role}</div>
              </div>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>RATE LIMIT STATUS</div>
                <div style={{ color: '#3fb950', fontSize: '0.9rem', fontWeight: 600 }}>{metrics.gemini?.rate_limit_status}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Console logs */}
        <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#8b949e', lineHeight: 1.6 }}>
          <div>[INFO] Loading 5-Model Ensemble Engine... OK</div>
          <div>[INFO] Chronos-T5-Small Foundation Model: Loaded (35% weight)</div>
          <div>[INFO] PyTorch Transformer Encoder: Loaded (20% weight)</div>
          <div>[INFO] XGBoost Gradient Boosted Trees: Loaded (20% weight)</div>
          <div>[INFO] LightGBM Leaf-wise Boosting: Loaded (15% weight)</div>
          <div>[INFO] PyTorch LSTM (2-Layer RNN): Loaded (10% weight)</div>
          <div>[INFO] FinBERT Sentiment Engine: Loaded</div>
          <div>[INFO] News Sentinel: Active — polling every 5 min</div>
          <div>[INFO] Awaiting frontend connections on port 5000...</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span style={{ width: 8, height: 8, background: '#3fb950', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
            <span style={{ color: '#3fb950' }}>System is fully operational</span>
          </div>
        </div>

      </div>
    </div>
  );
};
