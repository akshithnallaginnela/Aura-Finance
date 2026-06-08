import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user, logoutAction, setActiveView } = useFinance();
  const [isSmartAlerts, setIsSmartAlerts] = useState(true);

  const handleSignOut = async () => {
    try {
      await logoutAction();
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  const handleResetOnboarding = () => {
    if (user) {
      localStorage.removeItem(`aura_onboarding_completed_${user.uid}`);
      setActiveView('onboarding');
    }
  };

  return (
    <div className="settings-panel">
      <div className="panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div className="panel-head" style={{ marginBottom: '16px', borderBottom: 'none', padding: 0 }}>
          <div className="panel-title"><span className="panel-title-dot"></span>APPEARANCE</div>
        </div>
        
        <div className="settings-group">
          <label>Theme Preference</label>
          <select 
            className="settings-select" 
            value={theme} 
            onChange={(e) => setTheme(e.target.value as any)}
          >
            <option value="system">System Default</option>
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>
      </div>

      <div className="panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div className="panel-head" style={{ marginBottom: '16px', borderBottom: 'none', padding: 0 }}>
          <div className="panel-title"><span className="panel-title-dot"></span>NOTIFICATIONS & ALERTS</div>
        </div>
        
        <div className="settings-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '400px' }}>
          <div>
            <label style={{ margin: 0, fontSize: '12px', color: 'var(--tx)' }}>Disaster Risk Alerts</label>
            <div style={{ fontSize: '10px', color: 'var(--tx3)' }}>Get notified when AI detects high market risk.</div>
          </div>
          <button 
            className={`seg-btn ${isSmartAlerts ? 'active' : ''}`}
            onClick={() => setIsSmartAlerts(!isSmartAlerts)}
            style={{ padding: '6px 12px' }}
          >
            {isSmartAlerts ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
      </div>
      
      <div className="panel" style={{ padding: '20px' }}>
        <div className="panel-head" style={{ marginBottom: '16px', borderBottom: 'none', padding: 0 }}>
          <div className="panel-title"><span className="panel-title-dot"></span>ACCOUNT SECURITY</div>
        </div>
        
        <div className="settings-group">
          {user && (
            <div style={{ fontSize: '12.5px', color: 'var(--tx)', marginBottom: '8px', fontWeight: 600 }}>
              Logged in as: <span style={{ color: 'var(--amber)' }}>{user.email}</span>
            </div>
          )}
          <div style={{ fontSize: '11px', color: 'var(--tx2)', marginBottom: '16px' }}>
            Your authentication session is managed securely via Firebase Auth. Click the button below to sign out of your current session.
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="seg-btn" 
              onClick={handleResetOnboarding}
              style={{ 
                padding: '6px 12px', 
                color: 'var(--amber)', 
                borderColor: 'rgba(245, 158, 11, 0.3)', 
                background: 'rgba(245, 158, 11, 0.05)',
                cursor: 'pointer' 
              }}
            >
              Reset Onboarding Tutorial
            </button>
            <button 
              className="seg-btn" 
              onClick={handleSignOut}
              style={{ 
                padding: '6px 12px', 
                color: 'var(--red)', 
                borderColor: 'rgba(239, 68, 68, 0.3)', 
                background: 'rgba(239, 68, 68, 0.05)',
                cursor: 'pointer' 
              }}
            >
              Sign Out of Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
