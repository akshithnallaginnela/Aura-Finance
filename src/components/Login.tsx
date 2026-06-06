import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Sparkles, ArrowRight, Github, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const { setActiveView, setIsAuthenticated } = useFinance();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - immediately authenticate
    setIsAuthenticated(true);
    setActiveView('dashboard');
  };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', width: '100vw',
      background: 'var(--bg-base)', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="animate-fade-in-up" style={{
        width: '100%', maxWidth: '420px', padding: '40px',
        background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', justifyContent: 'center' }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary-light)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <Sparkles size={28} color="var(--accent-primary)" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Aura Finance
          </h1>
        </div>
        
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
          Welcome back to the intelligent wealth platform.
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Email Address
            </label>
            <input 
              type="email" 
              required
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px',
                background: 'var(--bg-base)', border: '1px solid var(--border-input)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-main)',
                fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s'
              }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Password
            </label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px',
                background: 'var(--bg-base)', border: '1px solid var(--border-input)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-main)',
                fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s'
              }}
            />
          </div>

          <button type="submit" style={{
            width: '100%', padding: '14px',
            background: 'var(--accent-primary)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'background 0.2s'
          }}>
            Sign In to Aura
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0', gap: '16px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button type="button" onClick={handleLogin} style={{
            flex: 1, padding: '12px', background: 'var(--bg-base)',
            border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background 0.2s'
          }}>
            <Github size={20} />
          </button>
          <button type="button" onClick={handleLogin} style={{
            flex: 1, padding: '12px', background: 'var(--bg-base)',
            border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background 0.2s'
          }}>
            <Mail size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
