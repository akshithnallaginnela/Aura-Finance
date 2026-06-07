import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setActiveView, setAuthMode } = useFinance();

  const handleAuthNavigate = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setActiveView('login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'var(--bg-base)',
      color: 'var(--text-main)',
      fontFamily: 'var(--sans)',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }}>
      {/* NAVBAR */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 8%',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(15, 19, 24, 0.7)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Aura Logo" style={{ width: 34, height: 34, objectFit: 'contain' }} />
          <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '0.5px' }}>Aura Finance</span>
        </div>

        <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }} className="landing-nav-links">
          <a href="#features" style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.2s' }}>Features</a>
          <a href="#models" style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.2s' }}>ML Models</a>
          <a href="#security" style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.2s' }}>Security</a>
        </nav>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button 
            onClick={() => handleAuthNavigate('login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px 16px',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Sign In
          </button>
          <button 
            onClick={() => handleAuthNavigate('register')}
            style={{
              background: 'var(--accent-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '10px 20px',
              boxShadow: '0 4px 14px var(--accent-primary-light)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.filter = 'brightness(1.1)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.filter = 'none';
              e.currentTarget.style.transform = 'none';
            }}
          >
            Create Account
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{
        padding: '80px 8% 120px 8%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Background glow blur */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, var(--accent-primary-light) 0%, transparent 70%)',
          filter: 'blur(80px)',
          zIndex: -1,
          opacity: 0.6
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--amber)',
          marginBottom: '24px'
        }} className="animate-fade-in-up">
          <Sparkles size={14} />
          <span>Intelligent Wealth Co-Pilot v2.4</span>
        </div>

        <h1 style={{
          fontSize: '3.6rem',
          fontWeight: 850,
          lineHeight: '1.15',
          maxWidth: '850px',
          margin: '0 0 24px 0',
          letterSpacing: '-1px',
          background: 'linear-gradient(to bottom, var(--text-main) 60%, var(--text-dim) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }} className="animate-fade-in-up">
          Intelligent Wealth, Driven by <span style={{ color: 'var(--accent-primary)', WebkitTextFillColor: 'initial' }}>AI Forecasting</span>
        </h1>

        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-muted)',
          maxWidth: '620px',
          lineHeight: '1.5',
          margin: '0 0 40px 0'
        }} className="animate-fade-in-up">
          Combine 5 predictive machine learning models, real-time news sentiment processing, and Modern Portfolio Theory to optimize your long-term returns.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '80px' }} className="animate-fade-in-up">
          <button 
            onClick={() => handleAuthNavigate('register')}
            className="login-btn-primary"
            style={{
              width: 'auto',
              padding: '14px 32px',
              fontSize: '1rem',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            Get Started Free
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Dashboard Mockup Frame */}
        <div style={{
          width: '100%',
          maxWidth: '1000px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.4), 0 0 50px rgba(0, 192, 118, 0.03)',
          overflow: 'hidden',
          aspectRatio: '16/9',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }} className="animate-fade-in-up">
          {/* Mockup Title bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(255, 255, 255, 0.01)'
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>workspace: reliance-forecast</div>
            <div style={{ width: '40px' }} />
          </div>

          {/* Mockup Body split screen */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Sidebar list mock */}
            <div style={{ width: '20%', borderRight: '1px solid var(--border-subtle)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: '32px', borderRadius: '6px', background: i === 1 ? 'rgba(0,192,118,0.08)' : 'rgba(255, 255, 255, 0.01)', border: i === 1 ? '1px solid var(--accent-primary)' : '1px solid transparent' }} />
              ))}
            </div>
            
            {/* Chart mock */}
            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '80px', height: '24px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.02)' }} />
                  <div style={{ width: '120px', height: '24px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.02)' }} />
                </div>
                <div style={{ width: '100px', height: '24px', borderRadius: '4px', background: 'rgba(0,192,118,0.1)' }} />
              </div>

              {/* Grid chart mockup lines */}
              <div style={{
                flex: 1,
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '20px'
              }}>
                {/* Horizontal lines */}
                <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: '1px', background: 'var(--border-subtle)' }} />
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border-subtle)' }} />
                <div style={{ position: 'absolute', top: '75%', left: 0, right: 0, height: '1px', background: 'var(--border-subtle)' }} />
                
                {/* Visual Chart Wave SVG */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Confidence Interval Gradient Area */}
                  <path d="M 0,60 Q 20,40 40,55 T 80,30 T 100,20 L 100,50 Q 80,60 40,80 T 0,90 Z" fill="rgba(0, 192, 118, 0.03)" />
                  {/* Historical close path */}
                  <path d="M 0,60 Q 20,40 40,55" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" />
                  {/* Predicted Close path */}
                  <path d="M 40,55 Q 60,70 80,30 T 100,20" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="3,3" />
                </svg>

                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: 'var(--text-dim)', fontSize: '0.7rem', fontFamily: 'var(--mono)', zIndex: 10 }}>
                  <span>JAN 2026</span>
                  <span>MAR 2026</span>
                  <span>MAY 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" style={{
        padding: '100px 8%',
        background: 'rgba(255, 255, 255, 0.01)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 12px 0' }}>Engineered for Precision</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>
            We've built core analysis frameworks into a single unified interface.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {/* Card 1 */}
          <div style={{
            padding: '32px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '8px',
              background: 'rgba(0, 192, 118, 0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)'
            }}>
              <TrendingUp size={22} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Ensemble ML Forecasting</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Generates five-model projection paths using deep learning LSTMs, attention transformers, and gradient boosting trees for high-probability trajectories.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{
            padding: '32px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--blue)'
            }}>
              <Sparkles size={22} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Conversational AI Copilot</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Interact directly with an AI investment strategist broker. Get real-time stock profiles, risk parameters, and customized portfolio optimization breakdowns.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{
            padding: '32px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '8px',
              background: 'rgba(232, 168, 0, 0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--amber)'
            }}>
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Real-Time News Sentinel</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Scans global financial publications instantly, returning dynamic sentiment indices and immediate warnings if disaster conditions are flagged.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '40px 8%',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.15)',
        color: 'var(--text-dim)',
        fontSize: '0.85rem'
      }}>
        <span>© 2026 Aura Finance. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="#" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};
