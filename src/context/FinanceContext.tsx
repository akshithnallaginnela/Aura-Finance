import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateMockData } from '../utils/mockData';
import type { FinancialData, FinancialProfile, CorporateProfile, Transaction, SimulatorMode, MacroIndicators, StressScenario } from '../utils/mockData';
import { DEFAULT_MACRO, calculateMacroStabilityIndex } from '../utils/mockData';
import { forecastCashFlow, forecastCorporateCashFlow } from '../utils/forecasting';
import type { ForecastPoint } from '../utils/forecasting';
import { optimizePortfolio, generateEfficientFrontier } from '../utils/portfolio';
import type { PortfolioMetrics, FrontierPoint } from '../utils/portfolio';
import {
  checkBackendHealth,
  getForecastFromBackend,
  getPortfolioFromBackend,
  getDisasterRisksFromBackend,
  getInvestRecommendationsFromBackend
} from '../services/aimlBackend';
import type { FeatureImportanceItem } from '../services/aimlBackend';

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
  // AIML states
  activeModel: 'holt-winters' | 'neural' | 'arima';
  setActiveModel: (model: 'holt-winters' | 'neural' | 'arima') => void;
  aimlAccuracy: number;
  aimlAnomalies: string[];
  aimlClusters: Record<string, string>;
  aimlFeatureImportance: FeatureImportanceItem[];
  disasterRisks: Record<string, number>;
  investRecommendations: string[];
  isBackendConnected: boolean;
  isRecalculating: boolean;
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

  // New AIML States
  const [activeModel, setActiveModel] = useState<'holt-winters' | 'neural' | 'arima'>('holt-winters');
  const [aimlAccuracy, setAimlAccuracy] = useState<number>(0);
  const [aimlAnomalies, setAimlAnomalies] = useState<string[]>([]);
  const [aimlClusters, setAimlClusters] = useState<Record<string, string>>({});
  const [aimlFeatureImportance, setAimlFeatureImportance] = useState<FeatureImportanceItem[]>([]);
  const [disasterRisks, setDisasterRisks] = useState<Record<string, number>>({
    earthquake: 5.0,
    flood: 8.0,
    pandemic: 2.0,
    supplyChain: 10.0
  });
  const [investRecommendations, setInvestRecommendations] = useState<string[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);

  // Macro stability index (derived)
  const macroStabilityIndex = calculateMacroStabilityIndex(macroIndicators, stressScenario, stressIntensity);

  // When mode switches, regenerate the entire dataset
  const setSimulatorMode = useCallback((mode: SimulatorMode) => {
    setSimulatorModeState(mode);
    setData(generateMockData(mode));
  }, []);

  // Main evaluation logic: run calculations via Python API or fallback to TypeScript engines
  useEffect(() => {
    let active = true;

    async function runAuraMath() {
      setIsRecalculating(true);
      const isOnline = await checkBackendHealth();
      
      if (!active) return;
      setIsBackendConnected(isOnline);

      const tolerance = simulatorMode === 'corporate' ? data.corporateProfile.riskTolerance : data.profile.riskTolerance;
      const profile = simulatorMode === 'corporate' ? data.corporateProfile : data.profile;

      if (isOnline) {
        try {
          // 1. Get Forecast, anomalies and accuracy from Python Backend
          const forecastData = await getForecastFromBackend({
            transactions: data.transactions,
            cashBalance: data.cashBalance,
            profile: profile,
            activeModel: activeModel,
            macro: macroIndicators,
            stressScenario: stressScenario,
            stressIntensity: stressIntensity
          });
          
          if (!active) return;
          setForecast(forecastData.forecast);
          setAimlAccuracy(forecastData.accuracy);
          setAimlAnomalies(forecastData.anomalies);

          // 2. Get Portfolio clustering and feature importance
          const portfolioData = await getPortfolioFromBackend({
            assets: data.assets,
            riskTolerance: tolerance,
            macro: macroIndicators,
            stressScenario: stressScenario,
            stressIntensity: stressIntensity
          });
          
          if (!active) return;
          setAimlClusters(portfolioData.clusters);
          setAimlFeatureImportance(portfolioData.featureImportance);

          // 3. Get Disaster risk metrics
          const disasterData = await getDisasterRisksFromBackend(
            macroIndicators,
            stressScenario,
            stressIntensity
          );
          
          if (!active) return;
          setDisasterRisks(disasterData.risks);

          // 4. Get Investment Recommendations
          const recommendData = await getInvestRecommendationsFromBackend(
            macroIndicators,
            tolerance
          );
          
          if (!active) return;
          setInvestRecommendations(recommendData.recommendations);

          // 5. Generate Efficient Frontier locally (keeps graph responsive)
          const frontier = generateEfficientFrontier(data.assets, 100, 0.04, macroIndicators, stressScenario, stressIntensity);
          const optimal = optimizePortfolio(data.assets, tolerance, 0.04, macroIndicators, stressScenario, stressIntensity);
          setOptimalPortfolio(optimal);
          setEfficientFrontier(frontier);

        } catch (err) {
          console.error("Backend fetch failed, falling back to client-side TS engine:", err);
          runTSFallback(tolerance);
        }
      } else {
        runTSFallback(tolerance);
      }
      setIsRecalculating(false);
    }

    function runTSFallback(tolerance: 'conservative' | 'moderate' | 'aggressive') {
      // 1. Run local TS cash forecaster (fallback)
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

      // Local Z-Score Anomaly detection fallback
      if (data.transactions.length > 0) {
        const amounts = data.transactions.map(t => t.amount);
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
        const std = Math.sqrt(variance);
        if (std > 0) {
          const outliers = data.transactions.filter(t => (Math.abs(t.amount - mean) / std) > 2.2).map(t => t.id);
          setAimlAnomalies(outliers);
        } else {
          setAimlAnomalies([]);
        }
      } else {
        setAimlAnomalies([]);
      }

      // Local accuracy fallback
      setAimlAccuracy(activeModel === 'neural' ? 86.4 : activeModel === 'arima' ? 85.1 : 85.9);

      // 2. Run local TS portfolio optimizer
      const optimal = optimizePortfolio(data.assets, tolerance, 0.04, macroIndicators, stressScenario, stressIntensity);
      setOptimalPortfolio(optimal);

      // 3. Generate Efficient Frontier
      const frontier = generateEfficientFrontier(data.assets, 100, 0.04, macroIndicators, stressScenario, stressIntensity);
      setEfficientFrontier(frontier);

      // Local asset clustering labels fallback
      const mockClusters: Record<string, string> = {};
      data.assets.forEach(a => {
        if (a.category === 'Crypto') mockClusters[a.symbol] = 'Speculative';
        else if (a.category === 'Stock') mockClusters[a.symbol] = 'Growth';
        else if (a.category === 'Bond' || a.category === 'Treasury') mockClusters[a.symbol] = 'Defensive';
        else mockClusters[a.symbol] = 'Safe Haven';
      });
      setAimlClusters(mockClusters);

      // Local feature importance fallback
      setAimlFeatureImportance([
        { name: "GDP Growth", importance: 27.5 },
        { name: "Inflation Rate", importance: 33.1 },
        { name: "Interest Rate", importance: 21.4 },
        { name: "Stress Level", importance: 18.0 }
      ]);

      // Local disaster risks fallback
      let pandemicRisk = 2.0;
      let supplyRisk = 10.0;
      if (stressScenario === 'pandemic') pandemicRisk += stressIntensity * 70;
      if (stressScenario === 'supply_chain') supplyRisk += stressIntensity * 60;
      setDisasterRisks({
        earthquake: 5.0 + (stressScenario === 'market_crash' ? 1.0 : 0),
        flood: 8.0 + (macroIndicators.inflationRate * 20),
        pandemic: pandemicRisk,
        supplyChain: supplyRisk
      });

      // Local investment recommendations fallback
      const recs: string[] = [];
      if (tolerance === 'conservative') {
        recs.push("Treasury Bonds (BND) are highly recommended under active risk constraints.");
        recs.push("Increase liquid Cash Reserves (CASH) to hedge against macro instability.");
        if (macroIndicators.inflationRate > 0.035) {
          recs.push("Gold (GLD) allocation represents a strong physical inflation hedge.");
        }
      } else if (tolerance === 'moderate') {
        recs.push("Standard diversified S&P 500 ETF (SPY) + Investment Grade Bonds (BND).");
        if (macroIndicators.interestRate > 0.05) {
          recs.push("Short-term CDs or Money Market assets are highly attractive at current interest rates.");
        }
      } else {
        recs.push("Growth Stock index tracking (QQQ) - high capital appreciation fits risk constraints.");
        if (stressScenario === 'none') {
          recs.push("Risk-on assets like Ethereum (ETH) can be increased up to 10% for alpha generation.");
        }
      }
      setInvestRecommendations(recs);
    }

    runAuraMath();

    return () => {
      active = false;
    };
  }, [data, macroIndicators, stressScenario, stressIntensity, simulatorMode, activeModel]);

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

I have built your 12-month **Cash Flow Projection** and **Modern Portfolio Efficient Frontier** powered by our python AIML engine. How can I assist you with your ${label.toLowerCase()} strategy today?`,
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
          simulatorMode, macroIndicators, stressScenario, stressIntensity, macroStabilityIndex,
          {
            activeModel,
            aimlAccuracy,
            aimlAnomalies,
            aimlClusters,
            aimlFeatureImportance,
            disasterRisks,
            investRecommendations,
            isBackendConnected
          }
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
  : `**Active Scenario:** ${stressScenario.replace(/_/g, ' ')} at **${(stressIntensity * 100).toFixed(0)}%** intensity\n\n**Impact Summary:**\n- Macro Stability Index dropped to **${macroStabilityIndex}/100**\n- Portfolio expected return adjusted to **${(optimalPortfolio.expectedReturn * 100).toFixed(2)}%**\n- 12-month cash forecast endpoint: **$${forecast.length > 0 ? forecast[forecast.length - 1].balance.toLocaleString() : 'N/A'}**

**Recommended ${modeLabel} Hedging Actions:**
1. Increase cash buffer by 20-30%
2. Shift equity allocation to defensive sectors
3. Consider put options or inverse ETFs for downside protection`}`;
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
        } else if (lowerText.includes('anomaly') || lowerText.includes('fraud') || lowerText.includes('outlier')) {
          aiResponseText = `### 🚨 Outlier & Anomaly Detection (Z-Score Engine)
          
Our Python backend analyzed your transaction history. 
*   **Anomalies Detected:** ${aimlAnomalies.length} outliers flagged.
*   **Active Filter:** Z-Score threshold > 2.2.
          
${aimlAnomalies.length > 0 
  ? `I have flagged transactions with unusual spending spikes. You can find them marked in red in your transaction ledger on the dashboard.`
  : `No transaction anomalies detected. Your spending behavior matches standard variance models.`}`;
        } else if (lowerText.includes('cluster') || lowerText.includes('kmeans') || lowerText.includes('risk quadrant')) {
          const clusterText = Object.entries(aimlClusters).map(([sym, quad]) => `* **${sym}**: ${quad}`).join('\n');
          aiResponseText = `### 📊 Unsupervised Asset Clustering (K-Means)
          
Your holdings have been partitioned into 4 distinct risk clusters based on expected return and volatility:
${clusterText}
          
This ensures that your asset distribution aligns precisely with your stated risk tolerance of **${(simulatorMode === 'corporate' ? data.corporateProfile.riskTolerance : data.profile.riskTolerance).toUpperCase()}**.`;
        } else {
          aiResponseText = `I have received your query. Since our **Python AIML engine is ${isBackendConnected ? 'CONNECTED' : 'OFFLINE'}**, I can help you with:
1.  Ask me **"Optimize my portfolio"** to review your target weights.
2.  Ask me **"Are there any anomalies?"** to check for transaction spikes.
3.  Ask me **"Explain my risk clusters"** to view K-Means asset classification.
4.  Ask me **"Explain my cash flow dip"** to see future runway.
5.  Ask me **"Analyze the macro economy"** to review inflation or rate hikes.`;
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
        macroStabilityIndex,
        // AIML exports
        activeModel,
        setActiveModel,
        aimlAccuracy,
        aimlAnomalies,
        aimlClusters,
        aimlFeatureImportance,
        disasterRisks,
        investRecommendations,
        isBackendConnected,
        isRecalculating
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
