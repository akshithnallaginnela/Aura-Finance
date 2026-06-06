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
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <h2>This view is currently under construction.</h2>
          <p>We are migrating this tool to use real financial data and machine learning.</p>
        </div>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
