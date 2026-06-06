import React, { useState } from 'react';
import { Bell, Shield, Sliders } from 'lucide-react';

export const Settings: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isCompactView, setIsCompactView] = useState(false);
  const [isSmartAlerts, setIsSmartAlerts] = useState(true);
  const [isEmailSummary, setIsEmailSummary] = useState(false);

  const getBadgeStyle = (isActive: boolean, color: string) => ({
    padding: '8px 16px',
    background: isActive ? color : 'var(--bg-elevated)',
    border: isActive ? 'none' : '1px solid var(--border-input)',
    color: isActive ? '#fff' : 'var(--text-main)',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none' as const
  });

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={20} color="var(--accent-primary)" />
          Preferences
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Dark Mode</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Toggle the dark theme across the application.</div>
            </div>
            <div 
              style={getBadgeStyle(isDarkMode, 'var(--accent-primary)')}
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? 'Active' : 'Inactive'}
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Compact View</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Show more data on the screen by reducing padding.</div>
            </div>
            <div 
              style={getBadgeStyle(isCompactView, 'var(--accent-primary)')}
              onClick={() => setIsCompactView(!isCompactView)}
            >
              {isCompactView ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={20} color="var(--accent-secondary)" />
          Notifications
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>AI Smart Alerts</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Get notified when Aura Intelligence detects anomalies or major news.</div>
            </div>
            <div 
              style={getBadgeStyle(isSmartAlerts, 'var(--accent-secondary)')}
              onClick={() => setIsSmartAlerts(!isSmartAlerts)}
            >
              {isSmartAlerts ? 'Active' : 'Inactive'}
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Email Summary</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Receive a daily market summary and portfolio update via email.</div>
            </div>
            <div 
              style={getBadgeStyle(isEmailSummary, 'var(--accent-secondary)')}
              onClick={() => setIsEmailSummary(!isEmailSummary)}
            >
              {isEmailSummary ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--accent-danger)" />
          Security
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Two-Factor Authentication</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Secure your account with an extra layer of security.</div>
            </div>
            <button 
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              onClick={(e) => {
                e.currentTarget.innerText = e.currentTarget.innerText === 'Enable 2FA' ? 'Disable 2FA' : 'Enable 2FA';
              }}
            >
              Enable 2FA
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
};
