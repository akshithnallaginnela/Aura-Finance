import { useFinance } from './context/FinanceContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AuraAdvisor } from './components/AuraAdvisor';
import { Optimizer } from './components/Optimizer';
import { Login } from './components/Login';
import { Settings } from './components/Settings';
import { Screener } from './components/Screener';
import { MacroView } from './components/MacroView';
import { Watchlist } from './components/Watchlist';
import { Onboarding } from './components/Onboarding';
import { LandingPage } from './components/LandingPage';

function AppContent() {
  const { activeView, isAuthLoading } = useFinance();

  if (isAuthLoading) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        background: 'var(--bg-base)',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--tx)',
        fontFamily: 'Inter, sans-serif',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/logo.png" style={{ width: '48px', height: '48px', objectFit: 'contain' }} alt="Aura Logo" />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '0.05em' }}>
            AURA
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--tx3)' }}>
          <span className="conn-dot" style={{ background: 'var(--accent-primary)', animation: 'blink 1.5s ease-in-out infinite' }}></span>
          Securing session with Firebase Auth...
        </div>
      </div>
    );
  }

  if (activeView === 'landing') {
    return <LandingPage />;
  }

  if (activeView === 'login') {
    return <Login />;
  }

  if (activeView === 'onboarding') {
    return <Onboarding />;
  }

  return (
    <Layout>
      {activeView === 'dashboard' && <Dashboard />}
      {activeView === 'advisor' && <AuraAdvisor />}
      {activeView === 'optimizer' && <Optimizer />}
      {activeView === 'settings' && <Settings />}
      {activeView === 'macro' && <MacroView />}
      {/* 
        Runway Predictor (forecaster) can remain under construction 
        or be mapped to something else later.
      */}
      {activeView === 'forecaster' && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--tx3)' }}>
          <h2 style={{ color: 'var(--tx)' }}>This view is currently under construction.</h2>
          <p>We are migrating this tool to use real financial data and machine learning.</p>
        </div>
      )}
      {activeView === 'watchlist' && <Watchlist />}
      {activeView === 'screener' && <Screener />}
    </Layout>
  );
}

export default function App() {
  return <AppContent />;
}
