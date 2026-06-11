import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../utils/firebaseClient';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc
} from 'firebase/firestore';

export interface EnsembleWeights {
  chronos: number;
  transformer: number;
  xgboost: number;
  lightgbm: number;
  lstm: number;
}

export interface NotificationItem {
  id: string;
  type: 'risk' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

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
  user: any | null;
  loginAction: (email: string, password: string) => Promise<void>;
  loginWithGoogleAction: () => Promise<void>;
  registerAction: (email: string, password: string) => Promise<void>;
  logoutAction: () => Promise<void>;
  
  activeView: 'login' | 'dashboard' | 'forecaster' | 'optimizer' | 'macro' | 'advisor' | 'settings' | 'watchlist' | 'screener' | 'onboarding' | 'landing';
  setActiveView: (view: 'login' | 'dashboard' | 'forecaster' | 'optimizer' | 'macro' | 'advisor' | 'settings' | 'watchlist' | 'screener' | 'onboarding' | 'landing') => void;
  completeOnboarding: (selectedTickers: string[]) => Promise<void>;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;

  watchlist: WatchlistItem[];
  setWatchlist: React.Dispatch<React.SetStateAction<WatchlistItem[]>>;
  marketIndex: MarketDataPoint[];
  portfolioValue: number;

  // V3 features
  ensembleWeights: EnsembleWeights;
  setEnsembleWeights: React.Dispatch<React.SetStateAction<EnsembleWeights>>;
  tunedForecast: ForecastPoint[];
  
  notifications: NotificationItem[];
  addNotification: (type: 'risk' | 'info' | 'success', title: string, message: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  
  isAuthLoading: boolean;
  disasterAlertsEnabled: boolean;
  setDisasterAlertsEnabled: (enabled: boolean) => Promise<void>;
  resetOnboardingAction: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  virtualCash: number;
  transactions: any[];
  executeTrade: (ticker: string, type: 'BUY' | 'SELL', sharesCount: number, price: number) => Promise<boolean>;
  resetSandboxAction: () => Promise<void>;
  adjustCashAction: (amount: number) => Promise<void>;
  displayName: string;
  avatarColor: string;
  notificationSoundsEnabled: boolean;
  updateProfile: (name: string, color: string) => Promise<void>;
  setNotificationSoundsEnabled: (enabled: boolean) => Promise<void>;
}

const DEFAULT_STOCKS: WatchlistItem[] = [
  { ticker: 'RELIANCE', name: 'Reliance Ind.', exchange: 'NSE', price: 2945.30, prevPrice: 2940.00, change: 5.30, changePct: 0.18, color: '#6366f1', flashClass: '', domain: 'ril.com', shares: 15, avgBuyPrice: 2850.00 },
  { ticker: 'TCS', name: 'Tata Consultancy', exchange: 'NSE', price: 3782.15, prevPrice: 3770.00, change: 12.15, changePct: 0.32, color: '#0d9488', flashClass: '', domain: 'tcs.com', shares: 8, avgBuyPrice: 3600.00 },
  { ticker: 'INFY', name: 'Infosys Ltd.', exchange: 'NSE', price: 1564.80, prevPrice: 1560.00, change: 4.80, changePct: 0.31, color: '#f59e0b', flashClass: '', domain: 'infosys.com', shares: 12, avgBuyPrice: 1500.00 },
  { ticker: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE', price: 1723.45, prevPrice: 1720.00, change: 3.45, changePct: 0.20, color: '#ef4444', flashClass: '', domain: 'hdfcbank.com', shares: 20, avgBuyPrice: 1650.00 },
  { ticker: 'ICICIBANK', name: 'ICICI Bank', exchange: 'NSE', price: 1285.60, prevPrice: 1280.00, change: 5.60, changePct: 0.44, color: '#8b5cf6', flashClass: '', domain: 'icicibank.com', shares: 25, avgBuyPrice: 1200.00 },
  { ticker: 'WIPRO', name: 'Wipro Ltd.', exchange: 'NSE', price: 462.35, prevPrice: 460.00, change: 2.35, changePct: 0.51, color: '#ec4899', flashClass: '', domain: 'wipro.com', shares: 30, avgBuyPrice: 440.00 },
  { ticker: 'SBIN', name: 'State Bank of India', exchange: 'NSE', price: 832.10, prevPrice: 825.00, change: 7.10, changePct: 0.86, color: '#3b82f6', flashClass: '', domain: 'sbi.co.in', shares: 10, avgBuyPrice: 800.00 },
  { ticker: 'LICI', name: 'LIC of India', exchange: 'NSE', price: 985.40, prevPrice: 990.00, change: -4.60, changePct: -0.46, color: '#eab308', flashClass: '', domain: 'licindia.in', shares: 5, avgBuyPrice: 950.00 },
  { ticker: 'ITC', name: 'ITC Limited', exchange: 'NSE', price: 435.50, prevPrice: 434.00, change: 1.50, changePct: 0.35, color: '#10b981', flashClass: '', domain: 'itcportal.com', shares: 40, avgBuyPrice: 420.00 },
  { ticker: 'HINDUNILVR', name: 'Hindustan Unilever', exchange: 'NSE', price: 2345.80, prevPrice: 2360.00, change: -14.20, changePct: -0.60, color: '#f43f5e', flashClass: '', domain: 'hul.co.in', shares: 4, avgBuyPrice: 2300.00 }
];

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTicker, setActiveTicker] = useState('RELIANCE.NS');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(DEFAULT_STOCKS.slice(0, 6));
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
  const [user, setUser] = useState<any | null>(null);
  const [activeView, setActiveView] = useState<'login' | 'dashboard' | 'forecaster' | 'optimizer' | 'macro' | 'advisor' | 'settings' | 'watchlist' | 'screener' | 'onboarding' | 'landing'>('landing');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [disasterAlertsEnabled, setDisasterAlertsEnabledState] = useState(true);
  const [virtualCash, setVirtualCash] = useState(1000000);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState('#6366f1');
  const [notificationSoundsEnabled, setNotificationSoundsEnabledState] = useState(true);

  const [ensembleWeights, setEnsembleWeights] = useState<EnsembleWeights>({
    chronos: 0.35,
    transformer: 0.20,
    xgboost: 0.20,
    lightgbm: 0.15,
    lstm: 0.10
  });

const playNotificationSound = (type: 'risk' | 'info' | 'success') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const playTone = (freq: number, duration: number, startTime: number, typeTone: OscillatorType = 'sine', volEnd: number = 0.0001) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = typeTone;
      osc.frequency.setValueAtTime(freq, startTime);
      gainNode.gain.setValueAtTime(0.12, startTime);
      gainNode.gain.exponentialRampToValueAtTime(volEnd, startTime + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    if (type === 'success') {
      playTone(523.25, 0.15, now, 'sine'); // C5
      playTone(659.25, 0.3, now + 0.08, 'sine'); // E5
    } else if (type === 'risk') {
      playTone(329.63, 0.2, now, 'triangle'); // E4
      playTone(261.63, 0.3, now + 0.15, 'triangle'); // C4
    } else {
      playTone(440, 0.1, now, 'sine'); // A4
    }
  } catch (e) {
    console.warn("AudioContext playback blocked or failed:", e);
  }
};

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'welcome',
      type: 'info',
      title: 'Welcome to Aura v3.0.0',
      message: 'Your AI Wealth Copilot with Firebase sync and risk sentinel is active.',
      timestamp: new Date(),
      read: false
    }
  ]);

  const addNotification = useCallback((type: 'risk' | 'info' | 'success', title: string, message: string) => {
    if (notificationSoundsEnabled) {
      playNotificationSound(type);
    }
    setNotifications(prev => [
      {
        id: Date.now().toString(),
        type,
        title,
        message,
        timestamp: new Date(),
        read: false
      },
      ...prev
    ]);
  }, [notificationSoundsEnabled]);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Compute tuned forecast based on ensemble weights
  const tunedForecast = React.useMemo(() => {
    if (!stockForecast || stockForecast.length === 0) return [];
    
    const w = ensembleWeights;
    const total = w.chronos + w.transformer + w.xgboost + w.lightgbm + w.lstm;
    if (total === 0) return stockForecast;
    
    const cW = w.chronos / total;
    const tW = w.transformer / total;
    const xW = w.xgboost / total;
    const lW = w.lightgbm / total;
    const mW = w.lstm / total;
    
    return stockForecast.map((f, idx) => {
      // Deterministic sinusoidal offsets representing individual models, summing to 0 under defaults
      const dC = 0.04 * Math.sin(idx / 12);
      const dT = 0.06 * Math.cos(idx / 8);
      const dX = -0.03 * Math.sin(idx / 10);
      const dL = 0.02 * Math.cos(idx / 5);
      const dM = -(0.35 * dC + 0.20 * dT + 0.20 * dX + 0.15 * dL) / 0.10;
      
      const multC = 1 + dC;
      const multT = 1 + dT;
      const multX = 1 + dX;
      const multL = 1 + dL;
      const multM = 1 + dM;
      
      const multiplier = (cW * multC) + (tW * multT) + (xW * multX) + (lW * multL) + (mW * multM);
      const baseClose = f.PredictedClose;
      const tunedClose = baseClose * multiplier;
      
      const upperRatio = f.UpperBand ? (f.UpperBand / baseClose) : 1.05;
      const lowerRatio = f.LowerBand ? (f.LowerBand / baseClose) : 0.95;
      
      return {
        Date: f.Date,
        PredictedClose: Number(tunedClose.toFixed(2)),
        UpperBand: Number((tunedClose * upperRatio).toFixed(2)),
        LowerBand: Number((tunedClose * lowerRatio).toFixed(2))
      };
    });
  }, [stockForecast, ensembleWeights]);

  // Wrap setActiveView to persist view on reload
  const handleSetActiveView = useCallback((view: typeof activeView) => {
    setActiveView(view);
    if (auth.currentUser) {
      localStorage.setItem(`aura_active_view_${auth.currentUser.uid}`, view);
    }
  }, []);

  // Firebase Auth session listeners
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsAuthLoading(true);
      if (firebaseUser) {
        setIsAuthenticated(true);
        setUser(firebaseUser);
        
        // Fetch user data from Firestore
        try {
          const docRef = doc(db, 'users_data', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.watchlist && data.watchlist.length > 0) {
              const mergedWatchlist = data.watchlist.map((item: any) => {
                const defaultStock = DEFAULT_STOCKS.find(s => s.ticker === item.ticker);
                return {
                  ...defaultStock,
                  ...item
                };
              });
              setWatchlist(mergedWatchlist);
            }
            if (data.disasterAlertsEnabled !== undefined) {
              setDisasterAlertsEnabledState(data.disasterAlertsEnabled);
            }
            if (data.virtualCash !== undefined) {
              setVirtualCash(data.virtualCash);
            } else {
              setVirtualCash(1000000);
            }
            if (data.transactions !== undefined) {
              setTransactions(data.transactions);
            } else {
              setTransactions([]);
            }
            if (data.displayName !== undefined) {
              setDisplayName(data.displayName);
            } else {
              const emailPrefix = firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User';
              setDisplayName(emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1));
            }
            if (data.avatarColor !== undefined) {
              setAvatarColor(data.avatarColor);
            } else {
              setAvatarColor('#6366f1');
            }
            if (data.notificationSoundsEnabled !== undefined) {
              setNotificationSoundsEnabledState(data.notificationSoundsEnabled);
            } else {
              setNotificationSoundsEnabledState(true);
            }
            if (data.onboardingCompleted) {
              const savedView = localStorage.getItem(`aura_active_view_${firebaseUser.uid}`) as typeof activeView;
              const targetView = (savedView && savedView !== 'login' && savedView !== 'landing' && savedView !== 'onboarding') ? savedView : 'dashboard';
              setActiveView(targetView);
            } else {
              setActiveView('onboarding');
            }
          } else {
            // Initialize document for Google sign-in or new users
            const emailPrefix = firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User';
            const initialName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
            await setDoc(docRef, {
              watchlist: [],
              onboardingCompleted: false,
              disasterAlertsEnabled: true,
              virtualCash: 1000000,
              transactions: [],
              displayName: initialName,
              avatarColor: '#6366f1',
              notificationSoundsEnabled: true
            });
            setDisplayName(initialName);
            setAvatarColor('#6366f1');
            setNotificationSoundsEnabledState(true);
            setActiveView('onboarding');
          }
        } catch (err) {
          console.error("Error fetching Firestore user data:", err);
          const onboardingCompleted = localStorage.getItem(`aura_onboarding_completed_${firebaseUser.uid}`);
          if (onboardingCompleted === 'true') {
            const savedView = localStorage.getItem(`aura_active_view_${firebaseUser.uid}`) as typeof activeView;
            const targetView = (savedView && savedView !== 'login' && savedView !== 'landing' && savedView !== 'onboarding') ? savedView : 'dashboard';
            setActiveView(targetView);
          } else {
            setActiveView('onboarding');
          }
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setActiveView('landing');
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAction = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogleAction = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const registerAction = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Send verification email
    try {
      await sendEmailVerification(userCredential.user);
    } catch (e) {
      console.error("Failed to send email verification during registration:", e);
    }
    const docRef = doc(db, 'users_data', userCredential.user.uid);
    const emailPrefix = email ? email.split('@')[0] : 'User';
    const initialName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    await setDoc(docRef, {
      watchlist: [],
      onboardingCompleted: false,
      disasterAlertsEnabled: true,
      virtualCash: 1000000,
      transactions: [],
      displayName: initialName,
      avatarColor: '#6366f1',
      notificationSoundsEnabled: true
    });
  };

  const logoutAction = async () => {
    // Clear persisted active view on sign out
    if (user) {
      localStorage.removeItem(`aura_active_view_${user.uid}`);
    }
    await signOut(auth);
  };

  const setDisasterAlertsEnabled = async (enabled: boolean) => {
    setDisasterAlertsEnabledState(enabled);
    if (user) {
      try {
        const docRef = doc(db, 'users_data', user.uid);
        await setDoc(docRef, { disasterAlertsEnabled: enabled }, { merge: true });
      } catch (err) {
        console.error("Error saving settings to Firestore:", err);
      }
    }
  };

  const resetOnboardingAction = async () => {
    if (!user) return;
    localStorage.removeItem(`aura_onboarding_completed_${user.uid}`);
    localStorage.removeItem(`aura_active_view_${user.uid}`);
    try {
      const docRef = doc(db, 'users_data', user.uid);
      await setDoc(docRef, { onboardingCompleted: false }, { merge: true });
    } catch (err) {
      console.error("Error resetting onboarding in Firestore:", err);
    }
    setActiveView('onboarding');
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      addNotification('success', 'Verification Resent', 'Verification email link has been sent to your inbox.');
    }
  };

  const executeTrade = useCallback(async (ticker: string, type: 'BUY' | 'SELL', sharesCount: number, currentPrice: number) => {
    if (!user) return false;
    
    let success = false;
    let newCash = virtualCash;
    let newWatchlist = [...watchlist];
    const strippedTicker = ticker.replace('.NS', '');
    const itemIndex = newWatchlist.findIndex(item => item.ticker === strippedTicker || item.ticker + '.NS' === ticker);
    
    if (itemIndex === -1) {
      console.error("Stock not in watchlist. Cannot trade.");
      return false;
    }
    
    const item = newWatchlist[itemIndex];
    const currentShares = item.shares || 0;
    const currentAvgPrice = item.avgBuyPrice || 0;
    
    const tradeValue = sharesCount * currentPrice;
    
    if (type === 'BUY') {
      if (virtualCash < tradeValue) {
        throw new Error(`Insufficient funds. You need ₹${tradeValue.toLocaleString('en-IN')} but only have ₹${virtualCash.toLocaleString('en-IN')}.`);
      }
      newCash = virtualCash - tradeValue;
      const totalShares = currentShares + sharesCount;
      const totalCost = (currentShares * currentAvgPrice) + tradeValue;
      const newAvgPrice = totalShares > 0 ? Number((totalCost / totalShares).toFixed(2)) : 0;
      
      newWatchlist[itemIndex] = {
        ...item,
        shares: totalShares,
        avgBuyPrice: newAvgPrice
      };
      success = true;
    } else {
      // SELL
      if (currentShares < sharesCount) {
        throw new Error(`Insufficient shares. You only own ${currentShares} shares of ${strippedTicker} but tried to sell ${sharesCount}.`);
      }
      newCash = virtualCash + tradeValue;
      const totalShares = currentShares - sharesCount;
      const newAvgPrice = totalShares > 0 ? currentAvgPrice : 0;
      
      newWatchlist[itemIndex] = {
        ...item,
        shares: totalShares,
        avgBuyPrice: newAvgPrice
      };
      success = true;
    }
    
    if (success) {
      const newTx = {
        id: Date.now().toString(),
        ticker: strippedTicker,
        type,
        shares: sharesCount,
        price: currentPrice,
        timestamp: new Date().toISOString()
      };
      
      const updatedTxs = [newTx, ...transactions];
      
      setVirtualCash(newCash);
      setTransactions(updatedTxs);
      setWatchlist(newWatchlist);
      
      // Save changes immediately to Firestore
      try {
        const docRef = doc(db, 'users_data', user.uid);
        await setDoc(docRef, {
          virtualCash: newCash,
          transactions: updatedTxs,
          watchlist: newWatchlist.map(wItem => ({
            ticker: wItem.ticker,
            name: wItem.name,
            exchange: wItem.exchange,
            color: wItem.color,
            domain: wItem.domain,
            shares: wItem.shares ?? 0,
            avgBuyPrice: wItem.avgBuyPrice ?? 0
          }))
        }, { merge: true });
        
        addNotification(
          'success', 
          `Trade Executed: ${type} ${strippedTicker}`, 
          `Successfully ${type === 'BUY' ? 'bought' : 'sold'} ${sharesCount} shares at ₹${currentPrice.toLocaleString('en-IN')}.`
        );
      } catch (err) {
        console.error("Error saving trade to Firestore:", err);
      }
    }
    
    return success;
  }, [user, virtualCash, watchlist, transactions, addNotification]);

  const resetSandboxAction = async () => {
    if (!user) return;
    setVirtualCash(1000000);
    setTransactions([]);
    try {
      const docRef = doc(db, 'users_data', user.uid);
      await setDoc(docRef, {
        virtualCash: 1000000,
        transactions: []
      }, { merge: true });
      addNotification('success', 'Sandbox Reset', 'Your virtual cash balance has been reset to ₹10,00,000 and transaction logs cleared.');
    } catch (e) {
      console.error("Failed to reset sandbox:", e);
    }
  };

  const adjustCashAction = async (amount: number) => {
    if (!user) return;
    const newCash = Math.max(0, virtualCash + amount);
    setVirtualCash(newCash);
    try {
      const docRef = doc(db, 'users_data', user.uid);
      await setDoc(docRef, {
        virtualCash: newCash
      }, { merge: true });
      addNotification('success', 'Cash Adjusted', `Virtual cash balance adjusted by ₹${amount.toLocaleString('en-IN')}.`);
    } catch (e) {
      console.error("Failed to adjust cash:", e);
    }
  };

  const updateProfile = async (name: string, color: string) => {
    if (!user) return;
    setDisplayName(name);
    setAvatarColor(color);
    try {
      const docRef = doc(db, 'users_data', user.uid);
      await setDoc(docRef, {
        displayName: name,
        avatarColor: color
      }, { merge: true });
      addNotification('success', 'Profile Updated', 'Your display name and avatar color preference have been synchronized.');
    } catch (e) {
      console.error("Failed to update profile:", e);
    }
  };

  const setNotificationSoundsEnabled = async (enabled: boolean) => {
    setNotificationSoundsEnabledState(enabled);
    if (user) {
      try {
        const docRef = doc(db, 'users_data', user.uid);
        await setDoc(docRef, { notificationSoundsEnabled: enabled }, { merge: true });
      } catch (err) {
        console.error("Error saving sound preference:", err);
      }
    }
  };

  // ─── Fetch Stock Data ──────────────────────────────────────────────────────
  
  const fetchStockData = useCallback(async (ticker: string, silent = false) => {
    if (!silent) {
      setIsLoadingData(true);
    }
    setErrorData(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/stock/${ticker}`);
      if (!response.ok) {
        let errMsg = 'Failed to fetch stock data';
        try {
          const errData = await response.json();
          if (errData.error) errMsg = errData.error;
        } catch(e) { /* ignore parse error */ }
        throw new Error(errMsg);
      }
      const data = await response.json();
      setStockData(data.historical || []);
      setStockForecast(data.forecast || []);
      setSentimentScore(data.sentiment_score ?? null);
      setFundamentalSummary(data.fundamental_summary || null);
      setFundamentals(data.fundamentals || {});
      setBacktestAccuracy(data.backtest_accuracy || 0.0);
      const risk = data.disaster_risk_score ?? 0.0;
      setDisasterRiskScore(risk);
      if (risk > 0.15) {
        addNotification(
          'risk',
          `Risk Alert: ${ticker.replace('.NS', '')}`,
          `Elevated market risk detected. Sentinel risk rating is ${(risk * 100).toFixed(0)}%.`
        );
      }
      setLastUpdated(data.last_updated || null);
      setActiveTicker(ticker.toUpperCase());
    } catch (err: any) {
      let friendlyMessage = err.message || 'Error fetching data';
      if (
        friendlyMessage.toLowerCase().includes('failed to fetch') ||
        friendlyMessage.toLowerCase().includes('networkerror') ||
        friendlyMessage.toLowerCase().includes('load failed')
      ) {
        friendlyMessage = 'Unable to connect to the backend service. Please ensure it is running and accessible.';
      }
      setErrorData(friendlyMessage);
      console.error(err);
    } finally {
      if (!silent) {
        setIsLoadingData(false);
      }
    }
  }, [addNotification]);

  const completeOnboarding = useCallback(async (selectedTickers: string[]) => {
    if (!user) return;
    localStorage.setItem(`aura_onboarding_completed_${user.uid}`, 'true');

    const filtered = DEFAULT_STOCKS.filter(s => selectedTickers.includes(s.ticker));
    const finalWatchlist = filtered.length > 0 ? filtered : DEFAULT_STOCKS.slice(0, 4);

    setWatchlist(finalWatchlist);

    // Save onboarding state to Firestore
    try {
      const docRef = doc(db, 'users_data', user.uid);
      await setDoc(docRef, {
        watchlist: finalWatchlist,
        onboardingCompleted: true
      }, { merge: true });
    } catch (err) {
      console.error("Error saving onboarding to Firestore:", err);
    }

    const firstTicker = finalWatchlist[0].ticker + '.NS';
    setActiveTicker(firstTicker);
    await fetchStockData(firstTicker);
    setActiveView('dashboard');
  }, [user, fetchStockData]);

  // ─── Watchlist (simulated live prices) ────────────────────────────────────

  const [marketIndex, setMarketIndex] = useState<MarketDataPoint[]>([]);



  // Portfolio value = sum of (shares * price) — only count holdings where shares > 0
  const portfolioValue = watchlist.reduce((sum, item) => {
    const shares = item.shares ?? 0;
    if (shares <= 0) return sum;
    return sum + (item.price || 0) * shares;
  }, 0);

  // Sync watchlist and holdings to Firestore on changes
  const lastSyncRef = React.useRef<string>('');
  useEffect(() => {
    if (!user) return;
    
    // Core parameters to identify edits (to ignore price fluctuations)
    const minimalWatchlist = watchlist.map(item => ({
      ticker: item.ticker,
      shares: item.shares ?? 0,
      avgBuyPrice: item.avgBuyPrice ?? 0
    }));
    const serialized = JSON.stringify(minimalWatchlist);
    
    if (serialized === lastSyncRef.current) {
      return;
    }
    lastSyncRef.current = serialized;

    const syncToFirestore = async () => {
      try {
        const docRef = doc(db, 'users_data', user.uid);
        await setDoc(docRef, {
          watchlist: watchlist.map(item => ({
            ticker: item.ticker,
            name: item.name,
            exchange: item.exchange,
            color: item.color,
            domain: item.domain,
            shares: item.shares ?? 0,
            avgBuyPrice: item.avgBuyPrice ?? 0
          }))
        }, { merge: true });
      } catch (err) {
        console.error("Error syncing watchlist to Firestore:", err);
      }
    };

    const timeoutId = setTimeout(syncToFirestore, 1000);
    return () => clearTimeout(timeoutId);
  }, [watchlist, user]);

  // Fetch market data only after authentication is resolved and user is logged in
  useEffect(() => {
    if (isAuthLoading) return;          // Wait until Firebase auth state is known
    if (!isAuthenticated) return;       // Don't hit backend for unauthenticated visitors

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
              if (item.price && newPrice > item.price) fClass = 'price-up';
              if (item.price && newPrice < item.price) fClass = 'price-down';
              
              return {
                ...item,
                price: newPrice,
                change: newChange,
                changePct: newChangePct,
                prevPrice: Number((newPrice - newChange).toFixed(2)),
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

    // Simulated micro-fluctuations (every 4 seconds) to keep UI dynamic and high-speed
    const simulatePriceTick = () => {
      setWatchlist(prev => {
        const next = prev.map(item => {
          const defaultStock = DEFAULT_STOCKS.find(s => s.ticker === item.ticker);
          const basePrevPrice = item.prevPrice || defaultStock?.prevPrice || 100.0;
          const currentPrice = item.price || defaultStock?.price || 100.0;
          
          // Random walk factor between -0.06% and +0.06%
          const pctChange = (Math.random() * 0.12 - 0.06) / 100;
          const priceShift = currentPrice * pctChange;
          const newPrice = Number((currentPrice + priceShift).toFixed(2));
          
          let fClass: '' | 'price-up' | 'price-down' = '';
          if (newPrice > currentPrice) fClass = 'price-up';
          if (newPrice < currentPrice) fClass = 'price-down';
          
          const newChange = Number((newPrice - basePrevPrice).toFixed(2));
          const newChangePct = basePrevPrice > 0 ? Number((newChange / basePrevPrice * 100).toFixed(2)) : 0.0;
          
          return {
            ...item,
            price: newPrice,
            change: newChange,
            changePct: newChangePct,
            prevPrice: basePrevPrice,
            flashClass: fClass
          };
        });
        
        // Clear flash class after animation
        setTimeout(() => {
          setWatchlist(currentList => currentList.map(item => ({ ...item, flashClass: '' })));
        }, 800);
        
        return next;
      });
    };

    // Intervals for updates
    const pollInterval = setInterval(fetchWatchlist, 2000); // 2s backend poll
    const simInterval = setInterval(simulatePriceTick, 4000); // 4s local micro-fluctuations

    return () => {
      clearInterval(pollInterval);
      clearInterval(simInterval);
    };
  }, [fetchStockData, isAuthLoading, isAuthenticated]);

  // Poll active stock data every 2 seconds silently in the background
  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !activeTicker) return;

    const pollActiveStock = () => {
      fetchStockData(activeTicker, true);
    };

    const intervalId = setInterval(pollActiveStock, 2000); // Poll every 2 seconds

    return () => clearInterval(intervalId);
  }, [activeTicker, fetchStockData, isAuthLoading, isAuthenticated]);

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
          history: chatHistory
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
      user,
      loginAction,
      loginWithGoogleAction,
      registerAction,
      logoutAction,
      completeOnboarding,
      authMode,
      setAuthMode,
      activeView,
      setActiveView: handleSetActiveView,
      watchlist,
      setWatchlist,
      marketIndex,
      portfolioValue,
      isAuthLoading,
      disasterAlertsEnabled,
      setDisasterAlertsEnabled,
      resetOnboardingAction,
      resendVerificationEmail,
      virtualCash,
      transactions,
      executeTrade,
      resetSandboxAction,
      adjustCashAction,
      displayName,
      avatarColor,
      notificationSoundsEnabled,
      updateProfile,
      setNotificationSoundsEnabled,
      
      // V3 features
      ensembleWeights,
      setEnsembleWeights,
      tunedForecast,
      notifications,
      addNotification,
      markAllNotificationsAsRead,
      clearNotifications
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
