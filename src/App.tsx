import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AuraAdvisor } from './components/AuraAdvisor';
import { Optimizer } from './components/Optimizer';
import { Login } from './components/Login';
import { Settings } from './components/Settings';

function AppContent() {
  const { activeView } = useFinance();

  if (activeView === 'login') {
    return <Login />;
  }

  return (
    <Layout>
      {activeView === 'dashboard' && <Dashboard />}
      {activeView === 'advisor' && <AuraAdvisor />}
      {activeView === 'optimizer' && <Optimizer />}
      {activeView === 'settings' && <Settings />}
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
      {activeView === 'watchlist' && (
        <div className="panel" style={{ margin: '20px', padding: '40px', textAlign: 'center', color: 'var(--tx3)' }}>
          <h2 style={{ color: 'var(--tx)' }}>Standalone Watchlist</h2>
          <p>This view will provide an expanded, full-screen grid of your watched assets.</p>
          <p>For now, you can view your real-time watchlist in the <strong style={{ color: 'var(--amber)', cursor: 'pointer' }} onClick={() => setActiveView('dashboard')}>Dashboard</strong>.</p>
        </div>
      )}
      {activeView === 'screener' && (
        <div className="panel" style={{ margin: '20px', padding: '40px', textAlign: 'center', color: 'var(--tx3)' }}>
          <h2 style={{ color: 'var(--tx)' }}>Market Screener</h2>
          <p>The advanced multi-factor stock screener is currently under development.</p>
          <p>It will allow filtering the market by P/E ratio, Market Cap, Technicals, and AI Disaster Risk.</p>
        </div>
      )}
    </Layout>
  );
}

export default function App() {
  return <AppContent />;
}
