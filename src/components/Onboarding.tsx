import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowRight, ArrowLeft, Check, Sparkles, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

interface StockOption {
  ticker: string;
  name: string;
  industry: string;
  icon: string;
  color: string;
}

const STOCK_OPTIONS: StockOption[] = [
  { ticker: 'RELIANCE', name: 'Reliance Industries', industry: 'Energy & Retail', icon: 'R', color: '#6366f1' },
  { ticker: 'TCS', name: 'Tata Consultancy Services', industry: 'IT Services', icon: 'T', color: '#0d9488' },
  { ticker: 'INFY', name: 'Infosys Limited', industry: 'IT Services', icon: 'I', color: '#f59e0b' },
  { ticker: 'HDFCBANK', name: 'HDFC Bank', industry: 'Banking', icon: 'H', color: '#ef4444' },
  { ticker: 'ICICIBANK', name: 'ICICI Bank', industry: 'Banking', icon: 'I', color: '#8b5cf6' },
  { ticker: 'WIPRO', name: 'Wipro Limited', industry: 'IT Services', icon: 'W', color: '#ec4899' },
  { ticker: 'SBIN', name: 'State Bank of India', industry: 'Banking', icon: 'S', color: '#3b82f6' },
  { ticker: 'LICI', name: 'LIC of India', industry: 'Insurance', icon: 'L', color: '#eab308' },
  { ticker: 'ITC', name: 'ITC Limited', industry: 'Conglomerate', icon: 'I', color: '#10b981' },
  { ticker: 'HINDUNILVR', name: 'Hindustan Unilever', industry: 'FMCG', icon: 'H', color: '#f43f5e' }
];

export const Onboarding: React.FC = () => {
  const { completeOnboarding } = useFinance();
  const [step, setStep] = useState(1);
  const [selectedTickers, setSelectedTickers] = useState<string[]>(['RELIANCE', 'TCS', 'INFY', 'HDFCBANK']);
  const [isFinishing, setIsFinishing] = useState(false);

  const toggleStock = (ticker: string) => {
    if (selectedTickers.includes(ticker)) {
      // Keep at least 1 stock selected
      if (selectedTickers.length > 1) {
        setSelectedTickers(selectedTickers.filter(t => t !== ticker));
      }
    } else {
      setSelectedTickers([...selectedTickers, ticker]);
    }
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      await completeOnboarding(selectedTickers);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', width: '100vw',
      background: 'var(--bg-base)', alignItems: 'center', justifyContent: 'center',
      padding: '40px', boxSizing: 'border-box'
    }}>
      <div className="animate-fade-in-up" style={{
        width: '100%', maxWidth: step === 2 ? '900px' : '650px',
        background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '40px', boxSizing: 'border-box',
        transition: 'max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="Aura Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>AURA CO-PILOT</span>
          </div>
          
          {/* Progress Indicators */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[1, 2, 3].map(s => (
              <div 
                key={s} 
                style={{
                  width: s === step ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: s === step ? 'var(--accent-primary)' : s < step ? 'var(--green)' : 'var(--border-subtle)',
                  transition: 'all 0.3s ease'
                }} 
              />
            ))}
          </div>
        </div>

        {/* Step 1: Welcome & Highlights */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 12px 0' }}>
              Welcome to Aura Finance
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.5', margin: '0 0 32px 0' }}>
              Your intelligence workspace is ready. Let's take a quick look at the systems we've configured for your portfolio.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '40px' }}>
              <div style={{
                display: 'flex', gap: '20px', padding: '20px',
                background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.15)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <TrendingUp size={20} style={{ color: '#6366f1' }} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
                    5-Model Ensemble Forecasting
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Blends predictions from Chronos-T5, LSTMs, and trees to project asset pathways with custom statistical bands.
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex', gap: '20px', padding: '20px',
                background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px',
                  background: 'rgba(13, 148, 136, 0.15)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Sparkles size={20} style={{ color: '#0d9488' }} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
                    FinBERT Sentiment Analysis
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Processes live market publications to feed real-time sentiment scoring matrices into your optimization loops.
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex', gap: '20px', padding: '20px',
                background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px',
                  background: 'rgba(234, 179, 8, 0.15)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <ShieldCheck size={20} style={{ color: '#eab308' }} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
                    Real-time News Sentinel
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Monitors and catches disaster threats, auto-calculating warning ratings for your portfolio's assets.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleNext} className="login-btn-primary" style={{ width: 'auto', padding: '12px 28px' }}>
                Next Step
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Watchlist */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 12px 0' }}>
              Configure Your Watchlist
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.5', margin: '0 0 32px 0' }}>
              Select the initial Indian equities you wish to track. The system will load their historical records, train ML metrics, and configure your portfolio dashboard.
            </p>

            {/* Grid container */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '8px',
              marginBottom: '32px'
            }}>
              {STOCK_OPTIONS.map(stock => {
                const isSelected = selectedTickers.includes(stock.ticker);
                return (
                  <div
                    key={stock.ticker}
                    onClick={() => toggleStock(stock.ticker)}
                    style={{
                      padding: '16px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                      border: isSelected ? '2px solid var(--accent-primary)' : '2px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.15)' : 'none'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'var(--text-dim)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: stock.color, color: '#ffffff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.95rem'
                      }}>
                        {stock.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {stock.ticker}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {stock.name}
                        </div>
                      </div>
                    </div>
                    
                    {/* Checkbox indicator */}
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '4px',
                      border: isSelected ? 'none' : '1px solid var(--text-dim)',
                      background: isSelected ? 'var(--accent-primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isSelected && <Check size={14} style={{ color: '#ffffff' }} />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={handleBack} 
                style={{ 
                  background: 'none', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                  gap: '8px', padding: '12px 24px', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', fontSize: '0.95rem'
                }}
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button 
                onClick={handleNext} 
                className="login-btn-primary" 
                style={{ width: 'auto', padding: '12px 28px' }}
                disabled={selectedTickers.length === 0}
              >
                Next Step
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Final confirmation */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto'
            }}>
              <Sparkles size={32} style={{ color: 'var(--green)' }} />
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 12px 0' }}>
              Workspace Configured!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.5', margin: '0 0 32px 0', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
              We've successfully prepared metrics for your {selectedTickers.length} selected stocks. Tap below to launch your intelligence dashboard and start exploring predictive insights.
            </p>

            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-subtle)',
              padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '40px'
            }}>
              {selectedTickers.map(ticker => (
                <span key={ticker} style={{
                  padding: '4px 10px', background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)', borderRadius: '12px',
                  fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)'
                }}>
                  {ticker}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={handleBack} 
                style={{ 
                  background: 'none', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                  gap: '8px', padding: '12px 24px', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', fontSize: '0.95rem'
                }}
                disabled={isFinishing}
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button 
                onClick={handleFinish} 
                className="login-btn-primary" 
                style={{ width: 'auto', padding: '12px 28px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff' }}
                disabled={isFinishing}
              >
                {isFinishing ? 'Initializing...' : 'Launch Dashboard'}
                <Check size={18} style={{ marginLeft: '6px' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
