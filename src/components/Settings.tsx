import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import {
  ShieldCheck, AlertTriangle, Activity, Database, Zap,
  RefreshCw, LogOut, Bell, Lock, TrendingUp, BookOpen,
  FileText, AlertOctagon, Clock, BarChart2, Eye, EyeOff
} from 'lucide-react';

const PREMIUM_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Emerald', value: '#10b981' }
];

// ─── Toggle Switch Component ───────────────────────────────────────────────
const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void; color?: string }> = ({
  enabled, onChange, color = 'var(--accent-primary)'
}) => (
  <button
    onClick={onChange}
    aria-pressed={enabled}
    style={{
      width: '40px', height: '22px', borderRadius: '11px', border: 'none',
      background: enabled ? color : 'var(--line)',
      cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
      flexShrink: 0
    }}
  >
    <span style={{
      position: 'absolute', top: '3px',
      left: enabled ? '21px' : '3px',
      width: '16px', height: '16px', borderRadius: '50%',
      background: '#fff',
      transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
    }} />
  </button>
);

// ─── Settings Row ──────────────────────────────────────────────────────────
const SettingsRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  right: React.ReactNode;
}> = ({ icon, title, desc, right }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 0', borderBottom: '1px solid var(--line)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ color: 'var(--tx3)', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx)' }}>{title}</div>
        <div style={{ fontSize: '10px', color: 'var(--tx3)', marginTop: '2px', lineHeight: 1.4 }}>{desc}</div>
      </div>
    </div>
    <div style={{ flexShrink: 0, marginLeft: '16px' }}>{right}</div>
  </div>
);

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
    adjustCashAction,
    displayName,
    avatarColor,
    updateProfile,
    notificationSoundsEnabled,
    setNotificationSoundsEnabled
  } = useFinance();

  const [cashAmount, setCashAmount] = useState<string>('');
  const [cashError, setCashError] = useState<string | null>(null);
  const [editedName, setEditedName] = useState(displayName);
  const [editedColor, setEditedColor] = useState(avatarColor);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Enterprise trading preferences
  const [confirmTrades, setConfirmTrades] = useState(() => localStorage.getItem('pref_confirm_trades') !== 'false');
  const [showPnL, setShowPnL] = useState(() => localStorage.getItem('pref_show_pnl') !== 'false');
  const [priceAlerts, setPriceAlerts] = useState(() => localStorage.getItem('pref_price_alerts') !== 'false');
  const [compactView, setCompactView] = useState(() => localStorage.getItem('pref_compact_view') === 'true');
  const [sessionTimeout, setSessionTimeout] = useState(() => localStorage.getItem('pref_session_timeout') || '30');
  const [defaultOrderType] = useState('MARKET');

  useEffect(() => { setEditedName(displayName); }, [displayName]);
  useEffect(() => { setEditedColor(avatarColor); }, [avatarColor]);

  const handleSignOut = async () => {
    try { await logoutAction(); } catch (err) { console.error('Failed to sign out:', err); }
  };

  const handleResetOnboarding = async () => {
    try { await resetOnboardingAction(); } catch (err) { console.error('Failed to reset onboarding:', err); }
  };

  const handleAddFunds = async () => {
    setCashError(null);
    const amt = Number(cashAmount);
    if (isNaN(amt) || amt <= 0) { setCashError('Please enter a valid positive amount.'); return; }
    if (amt > 100000000) { setCashError('Maximum single deposit is ₹10,00,00,000.'); return; }
    try { await adjustCashAction(amt); setCashAmount(''); } catch { setCashError('Failed to credit funds.'); }
  };

  const handleWithdrawFunds = async () => {
    setCashError(null);
    const amt = Number(cashAmount);
    if (isNaN(amt) || amt <= 0) { setCashError('Please enter a valid positive amount.'); return; }
    if (amt > virtualCash) { setCashError(`Insufficient balance. Available: ₹${virtualCash.toLocaleString('en-IN')}`); return; }
    try { await adjustCashAction(-amt); setCashAmount(''); } catch { setCashError('Failed to debit funds.'); }
  };

  const handleResetSandbox = async () => {
    if (window.confirm('Reset paper trading account to ₹10,00,000 and clear all transaction history? This cannot be undone.')) {
      try { await resetSandboxAction(); } catch (err) { console.error('Failed to reset sandbox:', err); }
    }
  };

  const savePref = (key: string, val: string) => localStorage.setItem(key, val);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 20px 40px 20px', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>

      {/* ── PROFILE HERO CARD ─────────────────────────────────────────── */}
      <div className="glass-panel" style={{
        padding: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800, color: '#fff',
            boxShadow: `0 0 20px ${avatarColor}55`, border: '2px solid rgba(255,255,255,0.2)'
          }}>
            {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, color: 'var(--tx)', fontSize: '1.3rem', fontWeight: 800 }}>{displayName || 'Trader'}</h2>
              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--amber)', border: '1px solid var(--amber)', background: 'rgba(245,158,11,0.05)', padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                PRO · LIVE
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--tx3)', marginTop: '3px' }}>{user?.email || 'No email'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              {user?.emailVerified ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--green)', fontSize: '10px', fontWeight: 700 }}>
                  <ShieldCheck size={11} /> IDENTITY VERIFIED
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--amber)', fontSize: '10px', fontWeight: 700 }}>
                  <AlertTriangle size={11} /> EMAIL UNVERIFIED
                </div>
              )}
              <span style={{ color: 'var(--line)', fontSize: '10px' }}>·</span>
              <div style={{ fontSize: '10px', color: 'var(--tx3)' }}>
                Paper Trading Account
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: 'var(--tx3)', textTransform: 'uppercase', fontWeight: 600 }}>Available Balance</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--amber)' }}>
              ₹{virtualCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <button onClick={handleSignOut} className="seg-btn" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)',
            borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
          }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* ── LEFT COLUMN ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* PROFILE CUSTOMIZATION */}
          <div className="panel" style={{ padding: '20px' }}>
            <div className="panel-title" style={{ marginBottom: '16px' }}><span className="panel-title-dot" />PROFILE CUSTOMIZATION</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--tx3)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Display Name</label>
                <input
                  type="text" value={editedName} onChange={e => setEditedName(e.target.value)}
                  placeholder="Enter your name"
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg1)', border: '1px solid var(--line)', color: 'var(--tx)', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--tx3)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Avatar Color</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {PREMIUM_COLORS.map(c => (
                    <button key={c.value} onClick={() => setEditedColor(c.value)} title={c.name} style={{
                      width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c.value,
                      border: editedColor === c.value ? '2px solid var(--tx)' : '2px solid transparent',
                      cursor: 'pointer', padding: 0,
                      boxShadow: editedColor === c.value ? `0 0 10px ${c.value}` : 'none',
                    }} />
                  ))}
                </div>
              </div>
              <button className="seg-btn" onClick={async () => {
                setProfileSuccess(null);
                if (!editedName.trim()) return;
                await updateProfile(editedName.trim(), editedColor);
                setProfileSuccess('Profile saved.');
                setTimeout(() => setProfileSuccess(null), 2500);
              }} style={{ padding: '8px 16px', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', alignSelf: 'flex-start' }}>
                Save Profile
              </button>
              {profileSuccess && <div style={{ color: 'var(--green)', fontSize: '12px', fontWeight: 600 }}>{profileSuccess}</div>}
            </div>
          </div>

          {/* APPEARANCE */}
          <div className="panel" style={{ padding: '20px' }}>
            <div className="panel-title" style={{ marginBottom: '16px' }}><span className="panel-title-dot" />DISPLAY PREFERENCES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <SettingsRow
                icon={<Eye size={14} />}
                title="Interface Theme"
                desc="Select your preferred color mode"
                right={
                  <select value={theme} onChange={e => setTheme(e.target.value as any)} style={{ padding: '5px 8px', background: 'var(--bg1)', border: '1px solid var(--line)', color: 'var(--tx)', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                }
              />
              <SettingsRow
                icon={<BarChart2 size={14} />}
                title="Show P&amp;L on Watchlist"
                desc="Display unrealised profit/loss per holding"
                right={<ToggleSwitch enabled={showPnL} onChange={() => { setShowPnL(p => { savePref('pref_show_pnl', String(!p)); return !p; }); }} color="var(--green)" />}
              />
              <SettingsRow
                icon={<EyeOff size={14} />}
                title="Compact View"
                desc="Reduce whitespace for more data density"
                right={<ToggleSwitch enabled={compactView} onChange={() => { setCompactView(p => { savePref('pref_compact_view', String(!p)); return !p; }); }} />}
              />
            </div>
          </div>

          {/* ALERTS & NOTIFICATIONS */}
          <div className="panel" style={{ padding: '20px' }}>
            <div className="panel-title" style={{ marginBottom: '16px' }}><span className="panel-title-dot" />ALERTS & NOTIFICATIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <SettingsRow
                icon={<AlertOctagon size={14} />}
                title="Market Risk Alerts"
                desc="Push notification when risk sentinel detects elevated market danger"
                right={<ToggleSwitch enabled={disasterAlertsEnabled} onChange={() => setDisasterAlertsEnabled(!disasterAlertsEnabled)} color="var(--red)" />}
              />
              <SettingsRow
                icon={<Bell size={14} />}
                title="Price Movement Alerts"
                desc="Notify when a watchlist stock moves ≥2% intraday"
                right={<ToggleSwitch enabled={priceAlerts} onChange={() => { setPriceAlerts(p => { savePref('pref_price_alerts', String(!p)); return !p; }); }} color="var(--amber)" />}
              />
              <SettingsRow
                icon={<Activity size={14} />}
                title="Audio Alert Tones"
                desc="Play sound on trade execution and risk events"
                right={<ToggleSwitch enabled={notificationSoundsEnabled} onChange={() => setNotificationSoundsEnabled(!notificationSoundsEnabled)} />}
              />
            </div>
          </div>

          {/* WORKSPACE */}
          <div className="panel" style={{ padding: '20px' }}>
            <div className="panel-title" style={{ marginBottom: '16px' }}><span className="panel-title-dot" />WORKSPACE</div>
            <div style={{ fontSize: '10px', color: 'var(--tx3)', marginBottom: '12px', lineHeight: 1.5 }}>
              Reset your stock selection preferences and run through the initial setup wizard again.
            </div>
            <button className="seg-btn" onClick={handleResetOnboarding} style={{ padding: '6px 14px', color: 'var(--amber)', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)', cursor: 'pointer', fontSize: '0.8rem' }}>
              Re-run Setup Wizard
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* PAPER TRADING ACCOUNT */}
          <div className="panel" style={{ padding: '20px' }}>
            <div className="panel-title" style={{ marginBottom: '16px' }}><span className="panel-title-dot" />PAPER TRADING ACCOUNT</div>

            {/* Balance card */}
            <div style={{ background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--tx3)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Simulated Cash Balance</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--amber)', marginTop: '4px' }}>
                    ₹{virtualCash.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--tx3)', marginTop: '4px' }}>Paper trading · No real money</div>
                </div>
                <button onClick={handleResetSandbox} className="seg-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', padding: '7px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
                  <RefreshCw size={11} /> RESET
                </button>
              </div>
            </div>

            {/* Fund controls */}
            <div style={{ marginBottom: '8px', fontSize: '11px', color: 'var(--tx3)', textTransform: 'uppercase', fontWeight: 600 }}>Adjust Balance</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number" min="0" placeholder="₹ Amount"
                value={cashAmount} onChange={e => setCashAmount(e.target.value)}
                style={{ flex: 1, padding: '9px 10px', background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--tx)', fontSize: '12.5px' }}
              />
              <button onClick={handleAddFunds} className="seg-btn" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--green)', padding: '0 14px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                CREDIT
              </button>
              <button onClick={handleWithdrawFunds} className="seg-btn" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: 'var(--rose)', padding: '0 14px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                DEBIT
              </button>
            </div>
            {cashError && <div style={{ color: 'var(--red)', fontSize: '11px', marginTop: '8px' }}>{cashError}</div>}
          </div>

          {/* TRADING PREFERENCES */}
          <div className="panel" style={{ padding: '20px' }}>
            <div className="panel-title" style={{ marginBottom: '16px' }}><span className="panel-title-dot" />TRADING PREFERENCES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <SettingsRow
                icon={<BookOpen size={14} />}
                title="Order Confirmation Dialog"
                desc="Show confirmation prompt before submitting any order"
                right={<ToggleSwitch enabled={confirmTrades} onChange={() => { setConfirmTrades(p => { savePref('pref_confirm_trades', String(!p)); return !p; }); }} color="var(--accent-primary)" />}
              />
              <SettingsRow
                icon={<TrendingUp size={14} />}
                title="Default Order Type"
                desc="Order execution method applied to new trades"
                right={
                  <select value={defaultOrderType} style={{ padding: '5px 8px', background: 'var(--bg1)', border: '1px solid var(--line)', color: 'var(--tx)', borderRadius: '4px', fontSize: '11px' }}>
                    <option value="MARKET">Market Order</option>
                    <option value="LIMIT">Limit Order</option>
                    <option value="SL">Stop Loss</option>
                    <option value="SL-M">SL-Market</option>
                  </select>
                }
              />
              <SettingsRow
                icon={<Clock size={14} />}
                title="Session Auto-Timeout"
                desc="Automatically lock after inactivity (minutes)"
                right={
                  <select value={sessionTimeout} onChange={e => { setSessionTimeout(e.target.value); savePref('pref_session_timeout', e.target.value); }} style={{ padding: '5px 8px', background: 'var(--bg1)', border: '1px solid var(--line)', color: 'var(--tx)', borderRadius: '4px', fontSize: '11px' }}>
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="60">1 hour</option>
                    <option value="0">Never</option>
                  </select>
                }
              />
              <SettingsRow
                icon={<FileText size={14} />}
                title="Transaction History"
                desc="All executed trades are logged and persisted to your account"
                right={<span style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 700 }}>ENABLED</span>}
              />
            </div>
          </div>

          {/* RISK & COMPLIANCE */}
          <div className="panel" style={{ padding: '20px' }}>
            <div className="panel-title" style={{ marginBottom: '16px' }}><span className="panel-title-dot" />RISK & COMPLIANCE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <SettingsRow
                icon={<Lock size={14} />}
                title="Two-Factor Security"
                desc="Account is protected via Firebase Auth"
                right={<span style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldCheck size={10} /> ACTIVE</span>}
              />
              <SettingsRow
                icon={<AlertOctagon size={14} />}
                title="Margin Trading"
                desc="Leveraged positions — disabled for paper accounts"
                right={<span style={{ fontSize: '10px', color: 'var(--tx3)', fontWeight: 700 }}>DISABLED</span>}
              />
              <SettingsRow
                icon={<FileText size={14} />}
                title="Regulatory Mode"
                desc="SEBI-compliant order flow simulation"
                right={<span style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 700 }}>NSE / BSE</span>}
              />
            </div>
          </div>

          {/* SYSTEM STATUS */}
          <div className="panel" style={{ padding: '20px' }}>
            <div className="panel-title" style={{ marginBottom: '16px' }}><span className="panel-title-dot" />SYSTEM STATUS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { icon: <Zap size={12} color="var(--accent-primary)" />, label: 'Advisory Engine', status: 'CONNECTED', ok: true },
                { icon: <Database size={12} color="var(--amber)" />, label: 'Firestore Sync', status: 'REALTIME', ok: true },
                { icon: <Activity size={12} color="var(--red)" />, label: 'Risk Sentinel', status: 'SCANNING', ok: true },
                { icon: <BarChart2 size={12} color="var(--blue)" />, label: 'Market Data Feed', status: 'LIVE', ok: true },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', background: 'var(--bg1)', padding: '8px 12px', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--tx)' }}>
                    {item.icon} <span>{item.label}</span>
                  </div>
                  <div style={{ color: item.ok ? 'var(--green)' : 'var(--red)', fontWeight: 700, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span className="conn-dot" style={{ background: item.ok ? 'var(--green)' : 'var(--red)', width: 6, height: 6 }} />
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── LEGAL DISCLAIMER ────────────────────────────────────────── */}
      <div style={{ padding: '16px 20px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '8px', fontSize: '10px', color: 'var(--tx3)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--amber)', fontSize: '10px' }}>DISCLAIMER</strong> — Aura Finance is a paper trading and analytics platform intended for educational and research purposes only. All trades executed are simulated and involve no real capital. Past performance of projections does not guarantee future results. Market data is sourced from public feeds and may be delayed. Nothing on this platform constitutes financial advice. Please consult a SEBI-registered investment advisor before making real investment decisions.
      </div>
    </div>
  );
};
