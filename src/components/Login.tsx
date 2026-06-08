import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowRight, Mail, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginAction, registerAction, authMode } = useFinance();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(authMode === 'register');

  React.useEffect(() => {
    setIsRegister(authMode === 'register');
  }, [authMode]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (isRegister) {
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        await registerAction(email, password);
        setSuccessMsg("Registration successful! Check your email for a verification link or try logging in.");
        // Clear passwords
        setPassword('');
        setConfirmPassword('');
      } else {
        await loginAction(email, password);
      }
    } catch (err: any) {
      let msg = err.message || "An authentication error occurred.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = "Invalid email or password.";
      } else if (err.code === 'auth/email-already-in-use') {
        msg = "An account already exists with this email address.";
      } else if (err.code === 'auth/weak-password') {
        msg = "Password must be at least 6 characters.";
      } else if (err.code === 'auth/invalid-email') {
        msg = "Invalid email format.";
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', width: '100vw',
      background: 'var(--bg-base)', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="animate-fade-in-up" style={{
        width: '100%', maxWidth: '420px', padding: '40px',
        background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Logo and Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', justifyContent: 'center' }}>
          <img 
            src="/logo.png" 
            alt="Aura Logo" 
            style={{ width: 44, height: 44, objectFit: 'contain' }} 
          />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Aura Finance
          </h1>
        </div>
        
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
          {isRegister ? "Create a new account to access the wealth platform." : "Welcome back to the intelligent wealth platform."}
        </p>

        {/* Tab Selector */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px', gap: '16px' }}>
          <button 
            type="button"
            onClick={() => { if (isRegister) toggleMode(); }}
            style={{
              paddingBottom: '8px',
              background: 'none',
              border: 'none',
              borderBottom: !isRegister ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: !isRegister ? 'var(--text-main)' : 'var(--text-dim)',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              flex: 1,
              textAlign: 'center'
            }}
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={() => { if (!isRegister) toggleMode(); }}
            style={{
              paddingBottom: '8px',
              background: 'none',
              border: 'none',
              borderBottom: isRegister ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: isRegister ? 'var(--text-main)' : 'var(--text-dim)',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              flex: 1,
              textAlign: 'center'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div style={{
            display: 'flex', gap: '8px', alignItems: 'center',
            padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--red)', borderRadius: 'var(--radius-md)',
            color: 'var(--red)', fontSize: '0.85rem', marginBottom: '20px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div style={{
            padding: '10px 14px', background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid var(--green)', borderRadius: 'var(--radius-md)',
            color: 'var(--green)', fontSize: '0.85rem', marginBottom: '20px'
          }}>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit}>
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
              className="login-input"
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: isRegister ? '20px' : '32px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Password
            </label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="login-input"
              disabled={isLoading}
            />
          </div>

          {isRegister && (
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Confirm Password
              </label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="login-input"
                disabled={isLoading}
              />
            </div>
          )}

          <button type="submit" className="login-btn-primary" disabled={isLoading}>
            {isLoading ? "Processing..." : isRegister ? "Sign Up" : "Sign In to Aura"}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0', gap: '16px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SUPPORT & FEEDBACK</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="mailto:support@aurafinance.com" style={{ textDecoration: 'none' }} className="login-btn-secondary">
            <Mail size={18} style={{ marginRight: '8px' }} />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};
