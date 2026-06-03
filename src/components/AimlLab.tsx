import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Database, Activity, Code, Zap } from 'lucide-react';

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
      background: '#0d1117', // Github dark background
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
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#8b949e' }}>Aura ML Pipeline / system.log</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
        </div>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Scikit-Learn Model Stats */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#58a6ff' }}>
            <Cpu size={18} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Random Forest Regressor (Technical)</span>
          </div>
          
          <div style={{ background: '#010409', padding: '16px', borderRadius: '6px', border: '1px solid #21262d' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>N_ESTIMATORS</div>
                <div style={{ color: '#79c0ff', fontSize: '1.2rem', fontWeight: 600 }}>{metrics.random_forest.n_estimators}</div>
              </div>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>R2 SCORE (ACCURACY)</div>
                <div style={{ color: '#3fb950', fontSize: '1.2rem', fontWeight: 600 }}>{(metrics.random_forest.r2_score * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>AVG MSE</div>
                <div style={{ color: '#d2a8ff', fontSize: '1.2rem', fontWeight: 600 }}>{metrics.random_forest.average_mse}</div>
              </div>
            </div>

            <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '8px' }}>FEATURE IMPORTANCE (LIVE)</div>
            {metrics.random_forest.feature_importance.map((f: any) => (
              <div key={f.feature} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '120px', fontSize: '0.85rem' }}>{f.feature}</div>
                <div style={{ flex: 1, height: '8px', background: '#21262d', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${f.importance * 100}%`, height: '100%', background: '#58a6ff', borderRadius: '4px' }} />
                </div>
                <div style={{ width: '40px', fontSize: '0.85rem', color: '#79c0ff', textAlign: 'right' }}>{(f.importance * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Gemini Model Stats */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#ff7b72' }}>
            <Zap size={18} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Google Gemini AI (Fundamental)</span>
          </div>
          
          <div style={{ background: '#010409', padding: '16px', borderRadius: '6px', border: '1px solid #21262d' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>MODEL VERSION</div>
                <div style={{ color: '#79c0ff', fontSize: '0.9rem', fontWeight: 600 }}>{metrics.gemini.model_version}</div>
              </div>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>LATENCY</div>
                <div style={{ color: '#d2a8ff', fontSize: '0.9rem', fontWeight: 600 }}>{metrics.gemini.last_latency_ms}ms</div>
              </div>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '4px' }}>RATE LIMIT STATUS</div>
                <div style={{ color: '#3fb950', fontSize: '0.9rem', fontWeight: 600 }}>{metrics.gemini.rate_limit_status}</div>
              </div>
            </div>

            <div style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: '8px' }}>BASE SYSTEM PROMPT</div>
            <div style={{ padding: '12px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', fontSize: '0.85rem', color: '#a5d6ff', lineHeight: 1.5 }}>
              {metrics.gemini.system_prompt}
            </div>
          </div>
        </div>

        {/* Console logs */}
        <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#8b949e', lineHeight: 1.6 }}>
          <div>[INFO] Connect to SQLite Database (Cloud)... OK</div>
          <div>[INFO] Training Random Forest Models... OK</div>
          <div>[INFO] Batch fetching News from yfinance... OK</div>
          <div>[INFO] Awaiting frontend WebSocket connections on port 5000...</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span style={{ width: 8, height: 8, background: '#3fb950', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
            <span style={{ color: '#3fb950' }}>System is fully operational</span>
          </div>
        </div>

      </div>
    </div>
  );
};
