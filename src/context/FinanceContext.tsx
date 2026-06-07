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
  flashClass: 'price-up' | 'price-down' | '';
  domain: string;
  shares?: number;
  avgBuyPrice?: number;
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
  
  activeView: 'login' | 'dashboard' | 'forecaster' | 'optimizer' | 'macro' | 'advisor' | 'settings' | 'watchlist' | 'screener';
  setActiveView: (view: 'login' | 'dashboard' | 'forecaster' | 'optimizer' | 'macro' | 'advisor' | 'settings' | 'watchlist' | 'screener') => void;

  watchlist: WatchlistItem[];
  setWatchlist: React.Dispatch<React.SetStateAction<WatchlistItem[]>>;
  marketIndex: MarketDataPoint[];
  portfolioValue: number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

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
  const [activeView, setActiveView] = useState<'login' | 'dashboard' | 'forecaster' | 'optimizer' | 'macro' | 'advisor' | 'settings' | 'watchlist' | 'screener'>('login');

  // ─── Watchlist (simulated live prices) ────────────────────────────────────
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    { ticker: 'RELIANCE', name: 'Reliance Ind.', exchange: 'NSE', price: 2945.30, prevPrice: 2940.00, change: 5.30, changePct: 0.18, color: '#6366f1', flashClass: '', domain: 'ril.com', shares: 15, avgBuyPrice: 2850.00 },
    { ticker: 'TCS', name: 'Tata Consultancy', exchange: 'NSE', price: 3782.15, prevPrice: 3770.00, change: 12.15, changePct: 0.32, color: '#0d9488', flashClass: '', domain: 'tcs.com', shares: 8, avgBuyPrice: 3600.00 },
    { ticker: 'INFY', name: 'Infosys Ltd.', exchange: 'NSE', price: 1564.80, prevPrice: 1560.00, change: 4.80, changePct: 0.31, color: '#f59e0b', flashClass: '', domain: 'infosys.com', shares: 12, avgBuyPrice: 1500.00 },
    { ticker: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE', price: 1723.45, prevPrice: 1720.00, change: 3.45, changePct: 0.20, color: '#ef4444', flashClass: '', domain: 'hdfcbank.com', shares: 20, avgBuyPrice: 1650.00 },
    { ticker: 'ICICIBANK', name: 'ICICI Bank', exchange: 'NSE', price: 1285.60, prevPrice: 1280.00, change: 5.60, changePct: 0.44, color: '#8b5cf6', flashClass: '', domain: 'icicibank.com', shares: 25, avgBuyPrice: 1200.00 },
    { ticker: 'WIPRO', name: 'Wipro Ltd.', exchange: 'NSE', price: 462.35, prevPrice: 460.00, change: 2.35, changePct: 0.51, color: '#ec4899', flashClass: '', domain: 'wipro.com', shares: 30, avgBuyPrice: 440.00 },
  ]);

  const [marketIndex, setMarketIndex] = useState<MarketDataPoint[]>([]);



  // Portfolio value = sum of (shares * price) for holding stocks, fallback to price * 10 if shares not set
  const portfolioValue = watchlist.reduce((sum, item) => sum + item.price * (item.shares || 10), 0);

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

    // Fetch real-time market index
    const fetchMarket = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/market_index`);
        if (res.ok) {
          const data = await res.json();
          setMarketIndex(data);
        }
      } catch (err) {
        console.error('Market index fetch error', err);
      }
    };
    fetchMarket();

    // Fetch real-time watchlist prices
    const fetchWatchlist = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/watchlist`);
        if (res.ok) {
          const liveData = await res.json();
          setWatchlist(prev => prev.map(item => {
            const update = liveData.find((d: any) => d.ticker === item.ticker + '.NS');
            if (update) {
              const newPrice = update.price;
              const newChange = update.change;
              const newChangePct = update.changePct;
              let fClass: '' | 'price-up' | 'price-down' = '';
              if (newPrice > item.price) fClass = 'price-up';
              if (newPrice < item.price) fClass = 'price-down';
              
              return {
                ...item,
                prevPrice: item.price,
                price: newPrice,
                change: newChange,
                changePct: newChangePct,
                flashClass: fClass
              };
            }
            return item;
          }));
          // clear flash class after animation
          setTimeout(() => {
            setWatchlist(prev => prev.map(item => ({ ...item, flashClass: '' })));
          }, 800);
        }
      } catch (err) {
        console.error('Watchlist fetch error', err);
      }
    };
    fetchWatchlist();
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
      setWatchlist,
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
