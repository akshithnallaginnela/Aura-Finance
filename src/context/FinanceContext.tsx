import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateMockData } from '../utils/mockData';
import type { FinancialData, FinancialProfile, Transaction } from '../utils/mockData';
import { forecastCashFlow } from '../utils/forecasting';
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
  activeView: 'dashboard' | 'forecaster' | 'optimizer' | 'advisor';
  setActiveView: (view: 'dashboard' | 'forecaster' | 'optimizer' | 'advisor') => void;
  updateProfile: (profile: Partial<FinancialProfile>) => void;
  updateAssetBalance: (id: string, amount: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  sendAdvisorMessage: (message: string, apiKey?: string) => Promise<void>;
  clearChat: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<FinancialData>(() => generateMockData());
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [optimalPortfolio, setOptimalPortfolio] = useState<PortfolioMetrics>({ expectedReturn: 0, volatility: 0, sharpeRatio: 0, weights: [] });
  const [efficientFrontier, setEfficientFrontier] = useState<FrontierPoint[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'forecaster' | 'optimizer' | 'advisor'>('dashboard');

  // Load calculations on data/profile change
  useEffect(() => {
    // 1. Run Cash Flow Forecast
    const fc = forecastCashFlow(data.transactions, data.cashBalance, data.profile, 12);
    setForecast(fc);

    // 2. Run Portfolio Optimizer
    const optimal = optimizePortfolio(data.assets, data.profile.riskTolerance);
    setOptimalPortfolio(optimal);

    // 3. Generate Efficient Frontier
    const frontier = generateEfficientFrontier(data.assets, 100);
    setEfficientFrontier(frontier);
  }, [data]);

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
  const clearChat = () => {
    setChatHistory([
      {
        id: 'msg_welcome',
        sender: 'aura',
        content: `Greetings! I am **Aura**, your AI Wealth Strategist. 🌌 

I have analyzed your current financial metrics:
*   **Net Worth:** $${data.netWorth.toLocaleString()}
*   **Liquid Cash:** $${data.cashBalance.toLocaleString()}
*   **Assigned Risk Profile:** ${data.profile.riskTolerance.toUpperCase()}

I have built your 12-month **Cash Flow Projection** and **Modern Portfolio Efficient Frontier**. How can I assist you with your wealth strategy today?`,
        timestamp: new Date()
      }
    ]);
  };

  // Seed welcome message on load
  useEffect(() => {
    clearChat();
  }, []);

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
        // We'll call the actual service inside services/gemini.ts when it's created
        const { getGeminiFinancialAdvice } = await import('../services/gemini');
        aiResponseText = await getGeminiFinancialAdvice(text, data, forecast, optimalPortfolio, apiKey);
      } else {
        // Local intelligence fallback simulator
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('optimize') || lowerText.includes('portfolio') || lowerText.includes('mpt') || lowerText.includes('weights')) {
          const currentAllocations = data.assets.map(a => {
            const pct = (a.balance / data.netWorth) * 100;
            return `*   **${a.symbol} (${a.name}):** Current ${pct.toFixed(1)}% vs. Target ${(optimalPortfolio.weights[data.assets.indexOf(a)] * 100).toFixed(1)}%`;
          }).join('\n');

          aiResponseText = `### Portfolio Optimization Analysis (Markowitz Model) 📈

Based on your target **${data.profile.riskTolerance}** risk profile, our optimizer has evaluated the asset class covariances to find the maximum Sharpe ratio portfolio.

#### Current vs. Recommended Allocations:
${currentAllocations}

#### Recommended Adjustments:
1.  **Expected Portfolio Annual Return:** ${(optimalPortfolio.expectedReturn * 100).toFixed(2)}%
2.  **Portfolio Volatility (Risk):** ${(optimalPortfolio.volatility * 100).toFixed(2)}%
3.  **Maximum Portfolio Sharpe Ratio:** ${optimalPortfolio.sharpeRatio.toFixed(2)}

To align with this boundary, consider rebalancing assets from your over-weighted slots (like crypto/cash) into standard bonds and S&P index shares. Let me know if you want me to simulate a specific trade!`;
        } else if (lowerText.includes('forecast') || lowerText.includes('cash') || lowerText.includes('dip') || lowerText.includes('future')) {
          const targetDip = forecast.find(f => f.expense > f.income);
          
          aiResponseText = `### Cash Flow & Runway Forecast 🔮

Analyzing your 12-month projections, your average monthly cash inflow is **$${data.profile.monthlySalary.toLocaleString()}** against fixed operational costs of **$${(data.profile.housingCost + data.profile.utilityCost + data.profile.subscriptionCost + data.profile.otherFixedCosts).toLocaleString()}**.

${targetDip 
  ? `⚠️ **Identified Bottleneck Month:** In **${targetDip.monthName}**, our algorithms detect a potential drop in savings capacity due to seasonal expenses (e.g. holiday or summer holiday adjustments).` 
  : `✅ **Positive cash flow:** Your runway is excellent. You are saving an average of **$${(data.profile.monthlySalary - forecast[0].expense).toLocaleString()}** per month.`}

#### Ways to optimize runway:
*   **Review Subscriptions:** You currently spend $${data.profile.subscriptionCost} monthly. Deactivating unused SaaS tools adds direct liquidity.
*   **Risk Mitigation:** Ensure you hold at least 3-6 months of fixed expenses ($${((data.profile.housingCost + data.profile.utilityCost + data.profile.subscriptionCost + data.profile.otherFixedCosts) * 3).toLocaleString()}) in your CASH account before deploying additional cash to equities.`;
        } else if (lowerText.includes('challenge') || lowerText.includes('saving') || lowerText.includes('save')) {
          aiResponseText = `### 🌌 Savings Challenge: The 30-Day "Cash Flow Optimizer"

I have tailored a challenge matching your financial behavior:

| Challenge Action | Expected Savings | Difficulty |
| :--- | :--- | :--- |
| **SaaS Audit:** Cancel 1 unused streaming/cloud sub | $15–$25 | Easy |
| **Dining Cap:** Limit Friday dining to $50 max | $80 | Medium |
| **Utility Save:** Smart thermostat adjustments | $30 | Easy |
| **Subtotal Savings:** | **$135 / month** | |

Deploying this extra **$135/month** directly to S&P 500 equities (averaging 9% return) over 10 years would yield **~$26,100**! Shall we update your profile to simulate this?`;
        } else {
          aiResponseText = `I have received your query. To give you the best tactical advice:
1.  Ask me **"Optimize my portfolio"** to review your Modern Portfolio Theory weights.
2.  Ask me **"Explain my cash flow dip"** to search for seasonal savings blocks.
3.  Ask me **"Suggest a savings challenge"** to deploy compound interest micro-challenges.

*Tip: Connect your Gemini API key in the top settings bar to enable full generative analysis of your specific financial goals!*`;
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
        updateAssetBalance,
        addTransaction,
        sendAdvisorMessage,
        clearChat
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
