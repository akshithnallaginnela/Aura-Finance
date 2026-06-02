import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AuraAdvisor } from './components/AuraAdvisor';

function AppContent() {
  const { activeView } = useFinance();

  return (
    <Layout>
      {activeView === 'dashboard' && <Dashboard />}
      {activeView === 'advisor' && <AuraAdvisor />}
      {/* 
        Other views like forecaster, optimizer, and macro were deprecated 
        as part of the shift to real stock data. We can add them back later 
        if we build ML features for them.
      */}
      {['forecaster', 'optimizer', 'macro'].includes(activeView) && (
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
