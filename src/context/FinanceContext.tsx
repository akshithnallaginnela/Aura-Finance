import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateMockData } from '../utils/mockData';
import type { FinancialData, FinancialProfile, CorporateProfile, Transaction, SimulatorMode, MacroIndicators, StressScenario } from '../utils/mockData';
import { DEFAULT_MACRO, calculateMacroStabilityIndex } from '../utils/mockData';
import { forecastCashFlow, forecastCorporateCashFlow } from '../utils/forecasting';
import type { ForecastPoint } from '../utils/forecasting';
import { optimizePortfolio, generateEfficientFrontier } from '../utils/portfolio';
import type { PortfolioMetrics, FrontierPoint } from '../utils/portfolio';


export interface ChatMessage {
  id: string;
  sender: 'user' | 'aura';
  content: string;
  timestamp: Date;
}

interface FinanceContextType {
  data: FinancialData;
  forecast: ForecastPoint[];
  optimalPortfolio: PortfolioMetrics;
  efficientFrontier: FrontierPoint[];
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
  activeView: 'dashboard' | 'forecaster' | 'optimizer' | 'advisor' | 'macro';
  setActiveView: (view: 'dashboard' | 'forecaster' | 'optimizer' | 'advisor' | 'macro') => void;
  updateProfile: (profile: Partial<FinancialProfile>) => void;
  updateCorporateProfile: (profile: Partial<CorporateProfile>) => void;
  updateAssetBalance: (id: string, amount: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  sendAdvisorMessage: (message: string, apiKey?: string) => Promise<void>;
  clearChat: () => void;
  // Macro & Simulator controls
  simulatorMode: SimulatorMode;
  setSimulatorMode: (mode: SimulatorMode) => void;
  macroIndicators: MacroIndicators;
  setMacroIndicators: (macro: MacroIndicators) => void;
  stressScenario: StressScenario;
  setStressScenario: (scenario: StressScenario) => void;
  stressIntensity: number;
  setStressIntensity: (intensity: number) => void;
  macroStabilityIndex: number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [simulatorMode, setSimulatorModeState] = useState<SimulatorMode>('retail');
  const [macroIndicators, setMacroIndicators] = useState<MacroIndicators>({ ...DEFAULT_MACRO });
  const [stressScenario, setStressScenario] = useState<StressScenario>('none');
  const [stressIntensity, setStressIntensity] = useState(0.5);
  
  const [data, setData] = useState<FinancialData>(() => generateMockData('retail'));
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [optimalPortfolio, setOptimalPortfolio] = useState<PortfolioMetrics>({ expectedReturn: 0, volatility: 0, sharpeRatio: 0, weights: [] });
  const [efficientFrontier, setEfficientFrontier] = useState<FrontierPoint[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'forecaster' | 'optimizer' | 'advisor' | 'macro'>('dashboard');

  // Macro stability index (derived)
  const macroStabilityIndex = calculateMacroStabilityIndex(macroIndicators, stressScenario, stressIntensity);

  // When mode switches, regenerate the entire dataset
  const setSimulatorMode = useCallback((mode: SimulatorMode) => {
    setSimulatorModeState(mode);
    setData(generateMockData(mode));
  }, []);

  // Load calculations on data/profile/macro change
  useEffect(() => {
    // 1. Run Cash Flow Forecast
    let fc: ForecastPoint[];
    if (simulatorMode === 'corporate') {
      fc = forecastCorporateCashFlow(
        data.transactions, data.cashBalance, data.corporateProfile, 12,
        macroIndicators, stressScenario, stressIntensity
      );
    } else {
      fc = forecastCashFlow(
        data.transactions, data.cashBalance, data.profile, 12,
        macroIndicators, stressScenario, stressIntensity
      );
    }
    setForecast(fc);

    // 2. Run Portfolio Optimizer
    const tolerance = simulatorMode === 'corporate' ? data.corporateProfile.riskTolerance : data.profile.riskTolerance;
    const optimal = optimizePortfolio(data.assets, tolerance, 0.04, macroIndicators, stressScenario, stressIntensity);
    setOptimalPortfolio(optimal);

    // 3. Generate Efficient Frontier
    const frontier = generateEfficientFrontier(data.assets, 100, 0.04, macroIndicators, stressScenario, stressIntensity);
    setEfficientFrontier(frontier);
  }, [data, macroIndicators, stressScenario, stressIntensity, simulatorMode]);

  // Handle profile edits (Salary, housing, etc.)
  const updateProfile = (profileUpdates: Partial<FinancialProfile>) => {
    setData(prev => {
      const updatedProfile = { ...prev.profile, ...profileUpdates };
      return {
        ...prev,
        profile: updatedProfile
      };
    });
  };

  // Handle corporate profile edits
  const updateCorporateProfile = (profileUpdates: Partial<CorporateProfile>) => {
    setData(prev => {
      const updatedProfile = { ...prev.corporateProfile, ...profileUpdates };
      return {
        ...prev,
        corporateProfile: updatedProfile
      };
    });
  };

  // Handle asset amount additions/subtractions
  const updateAssetBalance = (id: string, amount: number) => {
    setData(prev => {
      const updatedAssets = prev.assets.map(asset => {
        if (asset.id === id) {
          const newBalance = Math.max(0, amount);
          return { ...asset, balance: newBalance };
        }
        return asset;
      });

      // Recalculate cash if cash itself changed
      const cashBalance = updatedAssets.find(a => a.symbol === 'CASH')?.balance || 12000;
      const investmentSum = updatedAssets.filter(a => a.category !== 'Cash').reduce((sum, a) => sum + a.balance, 0);

      return {
        ...prev,
        assets: updatedAssets,
        cashBalance,
        netWorth: cashBalance + investmentSum
      };
    });
  };

  // Add simulated ledger item
  const addTransaction = (t: Omit<Transaction, 'id' | 'date'>) => {
    setData(prev => {
      const today = new Date().toISOString().split('T')[0];
      const newTransaction: Transaction = {
        ...t,
        id: `t_${Date.now()}`,
        date: today
      };

      const updatedTransactions = [newTransaction, ...prev.transactions];
      let cashBalance = prev.cashBalance;

      // Adjust cash balance depending on type
      if (t.type === 'income') {
        cashBalance += t.amount;
      } else {
        cashBalance -= t.amount;
      }

      // Update CASH asset balance to match
      const updatedAssets = prev.assets.map(asset => {
        if (asset.symbol === 'CASH') {
          return { ...asset, balance: cashBalance };
        }
        return asset;
      });

      const investmentSum = updatedAssets.filter(a => a.category !== 'Cash').reduce((sum, a) => sum + a.balance, 0);

      return {
        ...prev,
        transactions: updatedTransactions,
        cashBalance,
        assets: updatedAssets,
        netWorth: cashBalance + investmentSum
      };
    });
  };

  // Clear chat logs
  const clearChat = useCallback(() => {
    const label = simulatorMode === 'corporate' ? 'Corporate Treasury' : 'Personal Wealth';
    setChatHistory([
      {
        id: 'msg_welcome',
        sender: 'aura',
        content: `Greetings! I am **Aura**, your AI ${label} Strategist. 🌌 

I have analyzed your current financial metrics:
*   **Net Worth:** $${data.netWorth.toLocaleString()}
*   **Liquid Cash:** $${data.cashBalance.toLocaleString()}
*   **Assigned Risk Profile:** ${(simulatorMode === 'corporate' ? data.corporateProfile.riskTolerance : data.profile.riskTolerance).toUpperCase()}
*   **Macro Stability Index:** ${macroStabilityIndex}/100

I have built your 12-month **Cash Flow Projection** and **Modern Portfolio Efficient Frontier**. How can I assist you with your ${label.toLowerCase()} strategy today?`,
        timestamp: new Date()
      }
    ]);
  }, [data, simulatorMode, macroStabilityIndex]);

  // Seed welcome message on load
  useEffect(() => {
    clearChat();
  }, [clearChat]);

  // AI Advisor Chat Client
  const sendAdvisorMessage = async (text: string, apiKey?: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      let aiResponseText = '';

      if (apiKey) {
        const { getGeminiFinancialAdvice } = await import('../services/gemini');
        aiResponseText = await getGeminiFinancialAdvice(
          text, data, forecast, optimalPortfolio, apiKey,
          simulatorMode, macroIndicators, stressScenario, stressIntensity, macroStabilityIndex
        );
      } else {
        // Local intelligence fallback simulator
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const lowerText = text.toLowerCase();
        const modeLabel = simulatorMode === 'corporate' ? 'Corporate' : 'Personal';
        
        if (lowerText.includes('macro') || lowerText.includes('economy') || lowerText.includes('gdp') || lowerText.includes('inflation')) {
          aiResponseText = `### Macro-Economic Assessment 🌐

**Current Macro State:**
| Indicator | Value | Status |
| :--- | :--- | :--- |
| **GDP Growth** | ${(macroIndicators.gdpGrowth * 100).toFixed(1)}% | ${macroIndicators.gdpGrowth >= 0.02 ? '✅ Healthy' : '⚠️ Weak'} |
| **Inflation Rate** | ${(macroIndicators.inflationRate * 100).toFixed(1)}% | ${macroIndicators.inflationRate <= 0.04 ? '✅ Controlled' : '🔴 Elevated'} |
| **Interest Rate** | ${(macroIndicators.interestRate * 100).toFixed(1)}% | ${macroIndicators.interestRate <= 0.06 ? '✅ Manageable' : '⚠️ Restrictive'} |

**Macro Stability Index:** ${macroStabilityIndex}/100
${stressScenario !== 'none' ? `\n⚠️ **Active Stress Scenario:** ${stressScenario.replace(/_/g, ' ').toUpperCase()} at ${(stressIntensity * 100).toFixed(0)}% intensity.` : ''}

**${modeLabel} Strategy Recommendations:**
${macroIndicators.inflationRate > 0.04 
  ? '1. **Hedge inflation:** Increase commodity and inflation-protected security allocation.\n2. **Reduce long-duration bonds:** They lose value when inflation rises.'
  : '1. **Balanced allocation:** Current inflation is within target range.\n2. **Consider extending bond duration** for yield pickup.'}
${macroIndicators.interestRate > 0.06 
  ? '\n3. **Lock in high yields:** Money market and short-term treasury positions benefit from high rates.'
  : ''}`;
        } else if (lowerText.includes('stress') || lowerText.includes('disaster') || lowerText.includes('crash') || lowerText.includes('black swan')) {
          aiResponseText = `### Black Swan Stress Analysis 🦢

${stressScenario === 'none' 
  ? 'No stress scenario is currently active. Navigate to the **Macro Simulator** tab to trigger a Black Swan event and see how your portfolio and cash flows respond.\n\n**Available scenarios:**\n- 🦠 **Pandemic:** Revenue drops, costs spike\n- 🚢 **Supply Chain Shock:** Commodity inflation, production delays\n- 📈 **Rate Hike:** Borrowing costs surge, bonds devalue\n- 📉 **Market Crash:** Equities and crypto plummet'
  : `**Active Scenario:** ${stressScenario.replace(/_/g, ' ')} at **${(stressIntensity * 100).toFixed(0)}%** intensity\n\n**Impact Summary:**\n- Macro Stability Index dropped to **${macroStabilityIndex}/100**\n- Portfolio expected return adjusted to **${(optimalPortfolio.expectedReturn * 100).toFixed(2)}%**\n- 12-month cash forecast endpoint: **$${forecast.length > 0 ? forecast[forecast.length - 1].balance.toLocaleString() : 'N/A'}**\n\n**Recommended ${modeLabel} Hedging Actions:**\n1. Increase cash buffer by 20-30%\n2. Shift equity allocation to defensive sectors\n3. Consider put options or inverse ETFs for downside protection`}`;
        } else if (lowerText.includes('optimize') || lowerText.includes('portfolio') || lowerText.includes('mpt') || lowerText.includes('weights')) {
          const currentAllocations = data.assets.map((a, idx) => {
            const pct = (a.balance / data.netWorth) * 100;
            return `*   **${a.symbol} (${a.name}):** Current ${pct.toFixed(1)}% vs. Target ${(optimalPortfolio.weights[idx] * 100).toFixed(1)}%`;
          }).join('\n');

          aiResponseText = `### ${modeLabel} Portfolio Optimization Analysis (Markowitz Model) 📈

Based on your target **${(simulatorMode === 'corporate' ? data.corporateProfile.riskTolerance : data.profile.riskTolerance)}** risk profile, our optimizer has evaluated the asset class covariances to find the maximum Sharpe ratio portfolio.

#### Current vs. Recommended Allocations:
${currentAllocations}

#### Recommended Adjustments:
1.  **Expected Portfolio Annual Return:** ${(optimalPortfolio.expectedReturn * 100).toFixed(2)}%
2.  **Portfolio Volatility (Risk):** ${(optimalPortfolio.volatility * 100).toFixed(2)}%
3.  **Maximum Portfolio Sharpe Ratio:** ${optimalPortfolio.sharpeRatio.toFixed(2)}

${stressScenario !== 'none' ? `\n> ⚠️ These recommendations factor in the active **${stressScenario.replace(/_/g, ' ')}** stress scenario at ${(stressIntensity * 100).toFixed(0)}% intensity.` : ''}`;
        } else if (lowerText.includes('forecast') || lowerText.includes('cash') || lowerText.includes('dip') || lowerText.includes('future') || lowerText.includes('runway')) {
          const targetDip = forecast.find(f => f.expense > f.income);
          const income = simulatorMode === 'corporate' ? data.corporateProfile.monthlyRevenue : data.profile.monthlySalary;
          
          aiResponseText = `### ${modeLabel} Cash Flow & Runway Forecast 🔮

Analyzing your 12-month projections, your average monthly ${simulatorMode === 'corporate' ? 'revenue' : 'cash inflow'} is **$${income.toLocaleString()}**.

${targetDip 
  ? `⚠️ **Identified Bottleneck Month:** In **${targetDip.monthName}**, our algorithms detect a potential drop in savings capacity.` 
  : `✅ **Positive cash flow:** Your runway is excellent across all 12 projected months.`}

**12-Month Cash Endpoint:** $${forecast.length > 0 ? forecast[forecast.length - 1].balance.toLocaleString() : 'N/A'}
${stressScenario !== 'none' ? `\n> 📊 Forecast includes macro stress adjustments from the **${stressScenario.replace(/_/g, ' ')}** scenario.` : ''}`;
        } else if (lowerText.includes('challenge') || lowerText.includes('saving') || lowerText.includes('save')) {
          aiResponseText = `### 🌌 ${modeLabel} Savings Challenge: The 30-Day Optimizer

I have tailored a challenge matching your financial behavior:

| Challenge Action | Expected Savings | Difficulty |
| :--- | :--- | :--- |
| **SaaS Audit:** Cancel 1 unused service | $${simulatorMode === 'corporate' ? '5,000' : '15–$25'} | Easy |
| **${simulatorMode === 'corporate' ? 'Vendor Renegotiation' : 'Dining Cap'}** | $${simulatorMode === 'corporate' ? '12,000' : '80'} | Medium |
| **${simulatorMode === 'corporate' ? 'Energy Optimization' : 'Utility Save'}** | $${simulatorMode === 'corporate' ? '3,000' : '30'} | Easy |

Shall we update your profile to simulate these savings?`;
        } else {
          aiResponseText = `I have received your query. To give you the best tactical advice:
1.  Ask me **"Optimize my portfolio"** to review your Modern Portfolio Theory weights.
2.  Ask me **"Explain my cash flow dip"** to search for seasonal savings blocks.
3.  Ask me **"Analyze the macro economy"** to review GDP, inflation, and rate impacts.
4.  Ask me **"What if a market crash happens?"** to stress-test your position.

*Tip: Connect your Gemini API key in the settings to enable full generative analysis!*`;
        }
      }

      const aiMessage: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        sender: 'aura',
        content: aiResponseText,
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, aiMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'aura',
        content: `❌ **Connection Error:** Could not contact Gemini AI: ${err?.message || 'Unknown network error'}. Falling back to offline advice.`,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        data,
        forecast,
        optimalPortfolio,
        efficientFrontier,
        chatHistory,
        isChatLoading,
        activeView,
        setActiveView,
        updateProfile,
        updateCorporateProfile,
        updateAssetBalance,
        addTransaction,
        sendAdvisorMessage,
        clearChat,
        simulatorMode,
        setSimulatorMode,
        macroIndicators,
        setMacroIndicators,
        stressScenario,
        setStressScenario,
        stressIntensity,
        setStressIntensity,
        macroStabilityIndex
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
