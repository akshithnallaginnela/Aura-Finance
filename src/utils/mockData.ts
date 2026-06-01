export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: 'Salary' | 'Investment' | 'Housing' | 'Utilities' | 'Subscriptions' | 'Groceries' | 'Dining Out' | 'Transport' | 'Shopping' | 'Entertainment' | 'Other';
  type: 'income' | 'expense';
  isRecurring: boolean;
}

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  balance: number; // Current value in USD
  category: 'Stock' | 'Crypto' | 'Bond' | 'Cash' | 'Commodity';
  expectedReturn: number; // Annualized (e.g., 0.08 for 8%)
  volatility: number; // Annualized Std Dev (e.g., 0.15 for 15%)
}

export interface FinancialProfile {
  monthlySalary: number;
  housingCost: number; // Rent/Mortgage
  utilityCost: number;
  subscriptionCost: number;
  otherFixedCosts: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

export interface FinancialData {
  netWorth: number;
  cashBalance: number;
  profile: FinancialProfile;
  assets: Asset[];
  transactions: Transaction[];
}

// Generate random transactions with seasonal elements, salary, bills, and discretionary spending
export function generateMockData(): FinancialData {
  const transactions: Transaction[] = [];
  const profile: FinancialProfile = {
    monthlySalary: 5500,
    housingCost: 1500,
    utilityCost: 220,
    subscriptionCost: 80,
    otherFixedCosts: 400,
    riskTolerance: 'moderate'
  };

  const assets: Asset[] = [
    { id: '1', name: 'US Equities (S&P 500 ETF)', symbol: 'SPY', balance: 14500, category: 'Stock', expectedReturn: 0.09, volatility: 0.15 },
    { id: '2', name: 'Tech Growth Stock', symbol: 'QQQ', balance: 8200, category: 'Stock', expectedReturn: 0.12, volatility: 0.22 },
    { id: '3', name: 'Government Bonds', symbol: 'BND', balance: 7500, category: 'Bond', expectedReturn: 0.04, volatility: 0.05 },
    { id: '4', name: 'Ethereum', symbol: 'ETH', balance: 3400, category: 'Crypto', expectedReturn: 0.25, volatility: 0.65 },
    { id: '5', name: 'Physical Gold ETF', symbol: 'GLD', balance: 2500, category: 'Commodity', expectedReturn: 0.06, volatility: 0.12 },
    { id: '6', name: 'High Yield Savings', symbol: 'CASH', balance: 12000, category: 'Cash', expectedReturn: 0.045, volatility: 0.01 }
  ];

  // Base cash is what we have left in checkout
  const cashBalance = assets.find(a => a.symbol === 'CASH')?.balance || 12000;
  const investmentSum = assets.filter(a => a.category !== 'Cash').reduce((sum, a) => sum + a.balance, 0);
  const netWorth = cashBalance + investmentSum;

  const today = new Date();
  let idCounter = 1;

  // Let's create transactions for the last 180 days
  for (let i = 180; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.getDay(); // 0 = Sunday, etc.

    // 1. Monthly Recurring Salary (1st of month)
    if (dayOfMonth === 1) {
      transactions.push({
        id: `t_${idCounter++}`,
        date: dateString,
        description: 'Employer Direct Deposit',
        amount: profile.monthlySalary,
        category: 'Salary',
        type: 'income',
        isRecurring: true
      });
    }

    // 2. Monthly Rent/Housing (2nd of month)
    if (dayOfMonth === 2) {
      transactions.push({
        id: `t_${idCounter++}`,
        date: dateString,
        description: 'Rent Payment',
        amount: profile.housingCost,
        category: 'Housing',
        type: 'expense',
        isRecurring: true
      });
    }

    // 3. Monthly Utilities (5th of month)
    if (dayOfMonth === 5) {
      transactions.push({
        id: `t_${idCounter++}`,
        date: dateString,
        description: 'Electric & Internet Utilities',
        amount: profile.utilityCost + (Math.sin(date.getMonth()) * 30), // some seasonal variance
        category: 'Utilities',
        type: 'expense',
        isRecurring: true
      });
    }

    // 4. Subscriptions (10th of month)
    if (dayOfMonth === 10) {
      transactions.push({
        id: `t_${idCounter++}`,
        date: dateString,
        description: 'Cloud & Stream Services Bundle',
        amount: profile.subscriptionCost,
        category: 'Subscriptions',
        type: 'expense',
        isRecurring: true
      });
    }

    // 5. Weekly Groceries (every Saturday)
    if (dayOfWeek === 6) {
      transactions.push({
        id: `t_${idCounter++}`,
        date: dateString,
        description: 'Supermarket Grocery Run',
        amount: 120 + (Math.random() * 40),
        category: 'Groceries',
        type: 'expense',
        isRecurring: false
      });
    }

    // 6. Weekend Dining out (Friday and Saturday nights)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      if (Math.random() > 0.3) {
        transactions.push({
          id: `t_${idCounter++}`,
          date: dateString,
          description: dayOfWeek === 5 ? 'Friday Night Drinks & Bistro' : 'Saturday Dinner Out',
          amount: 45 + (Math.random() * 70),
          category: 'Dining Out',
          type: 'expense',
          isRecurring: false
        });
      }
    }

    // 7. Regular Petrol/Transit (roughly every 10 days)
    if (i % 10 === 0) {
      transactions.push({
        id: `t_${idCounter++}`,
        date: dateString,
        description: 'Transit Gas Station',
        amount: 45 + (Math.random() * 15),
        category: 'Transport',
        type: 'expense',
        isRecurring: false
      });
    }

    // 8. Discretionary Shopping / Amazon (random days)
    if (Math.random() > 0.9) {
      transactions.push({
        id: `t_${idCounter++}`,
        date: dateString,
        description: 'Online Retailer Purchase',
        amount: 30 + (Math.random() * 180),
        category: 'Shopping',
        type: 'expense',
        isRecurring: false
      });
    }

    // 9. Holiday/Seasonal Events (Special larger spends)
    // E.g. Late Dec (Christmas spending)
    const month = date.getMonth();
    if (month === 11 && dayOfMonth >= 20 && dayOfMonth <= 24) {
      if (Math.random() > 0.5) {
        transactions.push({
          id: `t_${idCounter++}`,
          date: dateString,
          description: 'Holiday Gifts and Party Catering',
          amount: 150 + (Math.random() * 150),
          category: 'Shopping',
          type: 'expense',
          isRecurring: false
        });
      }
    }

    // E.g. Summer Vacation (July/August)
    if ((month === 6 || month === 7) && dayOfMonth === 15) {
      transactions.push({
        id: `t_${idCounter++}`,
        date: dateString,
        description: 'Summer Escape - Flight/Hotel Booking',
        amount: 600 + (Math.random() * 200),
        category: 'Entertainment',
        type: 'expense',
        isRecurring: false
      });
    }
  }

  // Sort transactions by date descending (newest first)
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  return {
    netWorth,
    cashBalance,
    profile,
    assets,
    transactions
  };
}
