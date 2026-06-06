import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface StockDataPoint {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

export interface ForecastPoint {
  Date: string;
  PredictedClose: number;
  UpperBand?: number;
  LowerBand?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'aura';
  content: string;
  timestamp: Date;
}

export interface WatchlistItem {
  ticker: string;
  name: string;
  exchange: string;
  price: number;
  prevPrice: number;
  change: number;
  changePct: number;
  color: string;
  flashClass: string;
}

export interface MarketDataPoint {
  date: string;
  value: number;
}

interface FinanceContextType {
  activeTicker: string;
  setActiveTicker: (ticker: string) => void;
  stockData: StockDataPoint[];
  stockForecast: ForecastPoint[];
  sentimentScore: number | null;
  fundamentalSummary: string | null;
  disasterRiskScore: number;
  lastUpdated: string | null;
  isLoadingData: boolean;
  errorData: string | null;
  fetchStockData: (ticker: string) => Promise<void>;
  
  fundamentals: any;
  backtestAccuracy: number;
  
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
  sendAdvisorMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  
  activeView: 'login' | 'dashboard' | 'forecaster' | 'optimizer' | 'macro' | 'advisor' | 'settings';
  setActiveView: (view: 'login' | 'dashboard' | 'forecaster' | 'optimizer' | 'macro' | 'advisor' | 'settings') => void;

  watchlist: WatchlistItem[];
  marketIndex: MarketDataPoint[];
  portfolioValue: number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const BACKEND_URL = 'http://localhost:5000';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTicker, setActiveTicker] = useState('RELIANCE.NS');
  const [stockData, setStockData] = useState<StockDataPoint[]>([]);
  const [stockForecast, setStockForecast] = useState<ForecastPoint[]>([]);
  const [sentimentScore, setSentimentScore] = useState<number | null>(null);
  const [fundamentalSummary, setFundamentalSummary] = useState<string | null>(null);
  const [disasterRiskScore, setDisasterRiskScore] = useState(0.0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [fundamentals, setFundamentals] = useState<any>({});
  const [backtestAccuracy, setBacktestAccuracy] = useState<number>(0.0);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errorData, setErrorData] = useState<string | null>(null);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<'login' | 'dashboard' | 'forecaster' | 'optimizer' | 'macro' | 'advisor' | 'settings'>('login');

  // ─── Watchlist (simulated live prices) ────────────────────────────────────
  const DEFAULT_WATCHLIST: WatchlistItem[] = [
    { ticker: 'RELIANCE', name: 'Reliance Ind.', exchange: 'NSE', price: 2945.30, prevPrice: 2945.30, change: 0, changePct: 0, color: '#6366f1', flashClass: '' },
    { ticker: 'TCS', name: 'Tata Consultancy', exchange: 'NSE', price: 3782.15, prevPrice: 3782.15, change: 0, changePct: 0, color: '#0d9488', flashClass: '' },
    { ticker: 'INFY', name: 'Infosys Ltd.', exchange: 'NSE', price: 1564.80, prevPrice: 1564.80, change: 0, changePct: 0, color: '#f59e0b', flashClass: '' },
    { ticker: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE', price: 1723.45, prevPrice: 1723.45, change: 0, changePct: 0, color: '#ef4444', flashClass: '' },
    { ticker: 'ICICIBANK', name: 'ICICI Bank', exchange: 'NSE', price: 1285.60, prevPrice: 1285.60, change: 0, changePct: 0, color: '#8b5cf6', flashClass: '' },
    { ticker: 'WIPRO', name: 'Wipro Ltd.', exchange: 'NSE', price: 462.35, prevPrice: 462.35, change: 0, changePct: 0, color: '#ec4899', flashClass: '' },
  ];

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(DEFAULT_WATCHLIST);

  // Generate synthetic market index data (Nifty-like)
  const generateMarketIndex = (): MarketDataPoint[] => {
    const data: MarketDataPoint[] = [];
    let value = 24850;
    const now = new Date();
    for (let i = 90; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      value += (Math.random() - 0.48) * 120; // Slight upward bias
      value = Math.max(value, 22000);
      data.push({
        date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        value: Math.round(value * 100) / 100,
      });
    }
    return data;
  };

  const [marketIndex, setMarketIndex] = useState<MarketDataPoint[]>(() => generateMarketIndex());



  // Portfolio value = sum of all watchlist prices × 10 units each
  const portfolioValue = watchlist.reduce((sum, item) => sum + item.price * 10, 0);

  const fetchStockData = useCallback(async (ticker: string) => {
    setIsLoadingData(true);
    setErrorData(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/stock/${ticker}`);
      if (!response.ok) {
        let errMsg = 'Failed to fetch stock data';
        try {
          const errData = await response.json();
          if (errData.error) errMsg = errData.error;
        } catch(e) {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      setStockData(data.historical || []);
      setStockForecast(data.forecast || []);
      setSentimentScore(data.sentiment_score ?? null);
      setFundamentalSummary(data.fundamental_summary || null);
      setFundamentals(data.fundamentals || {});
      setBacktestAccuracy(data.backtest_accuracy || 0.0);
      setDisasterRiskScore(data.disaster_risk_score ?? 0.0);
      setLastUpdated(data.last_updated || null);
      setActiveTicker(ticker.toUpperCase());
    } catch (err: any) {
      setErrorData(err.message || 'Error fetching data');
      console.error(err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchStockData('RELIANCE.NS');
  }, [fetchStockData]);

  const sendAdvisorMessage = async (message: string) => {
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, newUserMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/advisor/strategy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticker: activeTicker,
          prompt: message,
          historical: stockData,
          forecast: stockForecast
        })
      });

      if (!response.ok) throw new Error('Failed to fetch strategy');
      const data = await response.json();

      const newAuraMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'aura',
        content: data.response || "I could not generate a strategy at this time.",
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, newAuraMsg]);
    } catch (error) {
      console.error('Advisor Error:', error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'aura',
        content: "Sorry, I am having trouble connecting to the backend right now.",
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  return (
    <FinanceContext.Provider value={{
      activeTicker,
      setActiveTicker,
      stockData,
      stockForecast,
      sentimentScore,
      fundamentalSummary,
      disasterRiskScore,
      lastUpdated,
      fundamentals,
      backtestAccuracy,
      isLoadingData,
      errorData,
      fetchStockData,
      chatHistory,
      isChatLoading,
      sendAdvisorMessage,
      clearChat,
      isAuthenticated,
      setIsAuthenticated,
      activeView,
      setActiveView,
      watchlist,
      marketIndex,
      portfolioValue,
    }}>
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
