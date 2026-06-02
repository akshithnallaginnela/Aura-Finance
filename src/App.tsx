import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CashFlowForecaster } from './components/CashFlowForecaster';
import { PortfolioOptimizer } from './components/PortfolioOptimizer';
import { AuraAdvisor } from './components/AuraAdvisor';
import { MacroSimulator } from './components/MacroSimulator';

function AppContent() {
  const { activeView } = useFinance();

  return (
    <Layout>
      {activeView === 'dashboard' && <Dashboard />}
      {activeView === 'forecaster' && <CashFlowForecaster />}
      {activeView === 'optimizer' && <PortfolioOptimizer />}
      {activeView === 'advisor' && <AuraAdvisor />}
      {activeView === 'macro' && <MacroSimulator />}
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
