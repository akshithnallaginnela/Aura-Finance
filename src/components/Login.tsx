import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowRight, Mail, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginAction, loginWithGoogleAction, registerAction, authMode } = useFinance();
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

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      await loginWithGoogleAction();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

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

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '16px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        <button 
          type="button" 
          onClick={handleGoogleSignIn} 
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--tx)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'background 0.2s, border-color 0.2s',
            marginBottom: '8px'
          }}
          className="seg-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Sign In with Google
        </button>

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
