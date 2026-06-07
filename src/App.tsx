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

function AppContent() {
  const { activeView, setActiveView } = useFinance();

  if (activeView === 'login') {
    return <Login />;
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
