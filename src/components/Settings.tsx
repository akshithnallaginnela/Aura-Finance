import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isSmartAlerts, setIsSmartAlerts] = useState(true);

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
          <div style={{ fontSize: '11px', color: 'var(--tx2)', marginBottom: '10px' }}>
            To manage your password, sessions, and two-factor authentication, please use the Supabase Dashboard or wait for the full Auth implementation.
          </div>
          <button className="seg-btn" style={{ padding: '6px 12px' }}>Manage Account</button>
        </div>
      </div>
    </div>
  );
};
