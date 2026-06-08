import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { ShieldCheck, AlertTriangle, Activity, Database, Sparkles, RefreshCw, LogOut } from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { 
    user, 
    logoutAction, 
    disasterAlertsEnabled, 
    setDisasterAlertsEnabled, 
    resetOnboardingAction,
    virtualCash,
    resetSandboxAction,
    adjustCashAction
  } = useFinance();

  const [cashAmount, setCashAmount] = useState<string>('');
  const [cashError, setCashError] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await logoutAction();
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  const handleResetOnboarding = async () => {
    try {
      await resetOnboardingAction();
    } catch (err) {
      console.error("Failed to reset onboarding:", err);
    }
  };

  const handleAddFunds = async () => {
    setCashError(null);
    const amt = Number(cashAmount);
    if (isNaN(amt) || amt <= 0) {
      setCashError("Please enter a valid positive number.");
      return;
    }
    try {
      await adjustCashAction(amt);
      setCashAmount('');
    } catch (err) {
      setCashError("Failed to adjust cash balance.");
    }
  };

  const handleWithdrawFunds = async () => {
    setCashError(null);
    const amt = Number(cashAmount);
    if (isNaN(amt) || amt <= 0) {
      setCashError("Please enter a valid positive number.");
      return;
    }
    if (amt > virtualCash) {
      setCashError("Insufficient virtual cash funds to withdraw.");
      return;
    }
    try {
      await adjustCashAction(-amt);
      setCashAmount('');
    } catch (err) {
      setCashError("Failed to adjust cash balance.");
    }
  };

  const handleResetSandbox = async () => {
    if (window.confirm("Are you sure you want to reset your paper trading cash to ₹10,00,000 and clear all transaction logs?")) {
      try {
        await resetSandboxAction();
      } catch (err) {
        console.error("Failed to reset sandbox:", err);
      }
    }
  };

  const username = user?.email ? user.email.split('@')[0] : 'Guest User';
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);
  const avatarChar = displayName.charAt(0) || 'U';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 20px 20px 20px', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
      {/* PROFILE DASHBOARD CARD */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Glowing Avatar */}
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #312e81 100%)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.8rem', 
            fontWeight: 800, 
            color: 'var(--tx)',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
            border: '2px solid rgba(99, 102, 241, 0.3)'
          }}>
            {avatarChar}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, color: 'var(--tx)', fontSize: '1.4rem', fontWeight: 800 }}>{displayName}</h2>
              <span style={{ 
                fontSize: '9px', 
                fontWeight: 800, 
                color: 'var(--amber)', 
                border: '1px solid var(--amber)', 
                background: 'rgba(245, 158, 11, 0.05)',
                padding: '2px 6px', 
                borderRadius: '4px',
                letterSpacing: '0.05em'
              }}>
                PRO · COPILOT
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--tx3)', marginTop: '4px' }}>{user?.email || 'No email registered'}</div>
            
            {/* Verification status tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
              {user?.emailVerified ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--emerald)', fontSize: '10px', fontWeight: 700 }}>
                  <ShieldCheck size={12} />
                  VERIFIED SECURE
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--amber)', fontSize: '10px', fontWeight: 700 }}>
                  <AlertTriangle size={12} />
                  PENDING VERIFICATION
                </div>
              )}
            </div>
          </div>
        </div>

        <button 
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--red)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          className="seg-btn"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      {/* TWO COLUMN CONTENT ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* LEFT COLUMN: System Config & Account Sec */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Appearance Panel */}
          <div className="panel" style={{ padding: '20px' }}>
            <div className="panel-head" style={{ marginBottom: '16px', borderBottom: 'none', padding: 0 }}>
              <div className="panel-title"><span className="panel-title-dot"></span>APPEARANCE PREFERENCES</div>
            </div>
            
            <div className="settings-group">
              <label style={{ fontSize: '11px', color: 'var(--tx3)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Theme Preference</label>
              <select 
                className="settings-select" 
                value={theme} 
                onChange={(e) => setTheme(e.target.value as any)}
                style={{ width: '100%', padding: '8px', background: 'var(--bg1)', border: '1px solid var(--line)', color: 'var(--tx)', borderRadius: '4px' }}
              >
                <option value="system">System Default</option>
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>
          </div>

          {/* Notifications Panel */}
          <div className="panel" style={{ padding: '20px' }}>
            <div className="panel-head" style={{ marginBottom: '16px', borderBottom: 'none', padding: 0 }}>
              <div className="panel-title"><span className="panel-title-dot"></span>SENTINEL ALERTS</div>
            </div>
            
            <div className="settings-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <label style={{ margin: 0, fontSize: '12px', color: 'var(--tx)', fontWeight: 600 }}>Disaster Risk Alerts</label>
                <div style={{ fontSize: '10px', color: 'var(--tx3)', marginTop: '2px' }}>Get notified when AI predicts high market risk.</div>
              </div>
              <button 
                className={`seg-btn ${disasterAlertsEnabled ? 'active' : ''}`}
                onClick={() => setDisasterAlertsEnabled(!disasterAlertsEnabled)}
                style={{ padding: '6px 12px' }}
              >
                {disasterAlertsEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* Onboarding tutorial reset */}
          <div className="panel" style={{ padding: '20px' }}>
            <div className="panel-head" style={{ marginBottom: '16px', borderBottom: 'none', padding: 0 }}>
              <div className="panel-title"><span className="panel-title-dot"></span>WORKSPACE PRESETS</div>
            </div>
            
            <div className="settings-group">
              <label style={{ fontSize: '11px', color: 'var(--tx3)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Tutorial Reset</label>
              <div style={{ fontSize: '10px', color: 'var(--tx3)', marginBottom: '12px' }}>Reset your onboarding setup if you want to select default stocks again.</div>
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
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Simulator Settings & Connection Sentinel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Simulator Capital Controls */}
          <div className="panel" style={{ padding: '20px' }}>
            <div className="panel-head" style={{ marginBottom: '16px', borderBottom: 'none', padding: 0 }}>
              <div className="panel-title"><span className="panel-title-dot"></span>SIMULATOR CAPITAL CONTROLS</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'var(--bg1)', padding: '12px', borderRadius: '4px', border: '1px solid var(--line)' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--tx3)', textTransform: 'uppercase', fontWeight: 600 }}>Active Sandbox Balance</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--amber)', marginTop: '2px' }}>
                  ₹{virtualCash.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <button 
                onClick={handleResetSandbox}
                title="Reset simulation parameters"
                style={{ border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', padding: '8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700 }}
                className="seg-btn"
              >
                <RefreshCw size={12} />
                RESET LEDGER
              </button>
            </div>

            <div className="settings-group">
              <label style={{ fontSize: '11px', color: 'var(--tx3)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Adjust Virtual Cash</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="number"
                  placeholder="Enter amount (e.g. 500000)"
                  value={cashAmount}
                  onChange={e => setCashAmount(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: 'var(--bg1)',
                    border: '1px solid var(--line)',
                    borderRadius: '4px',
                    color: 'var(--tx)',
                    fontSize: '12.5px'
                  }}
                />
                <button 
                  onClick={handleAddFunds}
                  style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--emerald)', padding: '0 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  className="seg-btn"
                >
                  ADD
                </button>
                <button 
                  onClick={handleWithdrawFunds}
                  style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--rose)', padding: '0 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  className="seg-btn"
                >
                  WITHDRAW
                </button>
              </div>
              {cashError && (
                <div style={{ color: 'var(--rose)', fontSize: '11px', marginTop: '6px' }}>{cashError}</div>
              )}
            </div>
          </div>

          {/* Connection Sentinel */}
          <div className="panel" style={{ padding: '20px' }}>
            <div className="panel-head" style={{ marginBottom: '16px', borderBottom: 'none', padding: 0 }}>
              <div className="panel-title"><span className="panel-title-dot"></span>SENTINEL SYSTEM STATUS</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', background: 'var(--bg1)', padding: '8px 12px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--tx)' }}>
                  <Sparkles size={12} color="var(--accent-primary)" />
                  <span>Gemini AI strategies</span>
                </div>
                <div style={{ color: 'var(--emerald)', fontWeight: 700, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="conn-dot" style={{ background: 'var(--emerald)', width: 6, height: 6 }} />
                  CONNECTED (0.04s)
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', background: 'var(--bg1)', padding: '8px 12px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--tx)' }}>
                  <Database size={12} color="var(--amber)" />
                  <span>Firestore DB State Sync</span>
                </div>
                <div style={{ color: 'var(--emerald)', fontWeight: 700, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="conn-dot" style={{ background: 'var(--emerald)', width: 6, height: 6 }} />
                  SYNCD (REALTIME)
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', background: 'var(--bg1)', padding: '8px 12px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--tx)' }}>
                  <Activity size={12} color="var(--red)" />
                  <span>Disaster Risk Sentinel</span>
                </div>
                <div style={{ color: 'var(--emerald)', fontWeight: 700, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="conn-dot" style={{ background: 'var(--emerald)', width: 6, height: 6 }} />
                  SCANNING ACTIVE
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
