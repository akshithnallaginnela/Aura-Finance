export type SimulatorMode = 'retail' | 'corporate';

export type StressScenario = 'none' | 'pandemic' | 'supply_chain' | 'rate_hike' | 'market_crash';

export interface MacroIndicators {
  gdpGrowth: number;       // e.g. 0.025 for 2.5%
  inflationRate: number;   // e.g. 0.035 for 3.5%
  interestRate: number;    // e.g. 0.05 for 5% (Fed Funds)
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: 'Salary' | 'Investment' | 'Housing' | 'Utilities' | 'Subscriptions' | 'Groceries' | 'Dining Out' | 'Transport' | 'Shopping' | 'Entertainment' | 'Other'
    | 'Revenue' | 'COGS' | 'OpEx' | 'CapEx' | 'Debt Service' | 'Corporate Investment';
  type: 'income' | 'expense';
  isRecurring: boolean;
}

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  balance: number; // Current value in USD
  category: 'Stock' | 'Crypto' | 'Bond' | 'Cash' | 'Commodity' | 'Treasury' | 'Corporate Bond' | 'Money Market';
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

export interface CorporateProfile {
  monthlyRevenue: number;
  cogsCost: number;         // Cost of Goods Sold
  opExCost: number;         // Operating Expenses
  capExCost: number;        // Capital Expenditures
  debtServiceCost: number;  // Monthly debt servicing
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

export interface FinancialData {
  netWorth: number;
  cashBalance: number;
  profile: FinancialProfile;
  corporateProfile: CorporateProfile;
  assets: Asset[];
  transactions: Transaction[];
  mode: SimulatorMode;
  macro: MacroIndicators;
  stressScenario: StressScenario;
  stressIntensity: number; // 0..1
}

// Apply macro adjustments to expected returns
export function macroAdjustedReturn(baseReturn: number, category: string, macro: MacroIndicators, stress: StressScenario, intensity: number): number {
  let adjusted = baseReturn;

  // GDP effect: higher GDP boosts equities, lower hurts them
  const gdpDelta = macro.gdpGrowth - 0.025; // baseline 2.5%
  if (category === 'Stock' || category === 'Crypto') {
    adjusted += gdpDelta * 1.5;
  }

  // Inflation effect: high inflation hurts bonds, boosts commodities
  const inflDelta = macro.inflationRate - 0.03; // baseline 3%
  if (category === 'Bond' || category === 'Corporate Bond') {
    adjusted -= inflDelta * 2.0;
  }
  if (category === 'Commodity') {
    adjusted += inflDelta * 0.8;
  }

  // Interest rate effect: high rates hurt equities, boost money market/treasury
  const rateDelta = macro.interestRate - 0.05; // baseline 5%
  if (category === 'Stock' || category === 'Crypto') {
    adjusted -= rateDelta * 1.2;
  }
  if (category === 'Cash' || category === 'Treasury' || category === 'Money Market') {
    adjusted += rateDelta * 0.6;
  }

  // Stress scenario impact
  if (stress !== 'none') {
    const stressMult = intensity;
    switch (stress) {
      case 'pandemic':
        if (category === 'Stock') adjusted -= 0.15 * stressMult;
        if (category === 'Crypto') adjusted -= 0.25 * stressMult;
        if (category === 'Bond' || category === 'Treasury') adjusted += 0.02 * stressMult; // flight to safety
        break;
      case 'supply_chain':
        if (category === 'Stock') adjusted -= 0.08 * stressMult;
        if (category === 'Commodity') adjusted += 0.12 * stressMult;
        break;
      case 'rate_hike':
        if (category === 'Bond' || category === 'Corporate Bond') adjusted -= 0.10 * stressMult;
        if (category === 'Stock') adjusted -= 0.06 * stressMult;
        if (category === 'Cash' || category === 'Money Market') adjusted += 0.03 * stressMult;
        break;
      case 'market_crash':
        if (category === 'Stock') adjusted -= 0.30 * stressMult;
        if (category === 'Crypto') adjusted -= 0.45 * stressMult;
        if (category === 'Bond' || category === 'Treasury') adjusted += 0.04 * stressMult;
        if (category === 'Commodity') adjusted -= 0.10 * stressMult;
        break;
    }
  }

  return adjusted;
}

// Calculate the Macro Stability Index (0-100)
export function calculateMacroStabilityIndex(macro: MacroIndicators, stress: StressScenario, intensity: number): number {
  let score = 100;

  // GDP penalty: ideal range 2-3%
  const gdpPct = macro.gdpGrowth * 100;
  if (gdpPct < 1) score -= (1 - gdpPct) * 15;
  else if (gdpPct > 4) score -= (gdpPct - 4) * 8;

  // Inflation penalty: ideal range 1.5-3%
  const inflPct = macro.inflationRate * 100;
  if (inflPct > 4) score -= (inflPct - 4) * 12;
  else if (inflPct < 1) score -= (1 - inflPct) * 5;

  // Interest rate penalty: ideal 3-5%
  const ratePct = macro.interestRate * 100;
  if (ratePct > 6) score -= (ratePct - 6) * 8;
  else if (ratePct < 2) score -= (2 - ratePct) * 6;

  // Stress scenario penalty
  const stressPenalties: Record<StressScenario, number> = {
    'none': 0,
    'pandemic': 30,
    'supply_chain': 18,
    'rate_hike': 12,
    'market_crash': 35
  };
  score -= stressPenalties[stress] * intensity;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Default macro indicators
export const DEFAULT_MACRO: MacroIndicators = {
  gdpGrowth: 0.025,
  inflationRate: 0.03,
  interestRate: 0.05
};

// Generate random transactions with seasonal elements, salary, bills, and discretionary spending
export function generateMockData(mode: SimulatorMode = 'retail'): FinancialData {
  const transactions: Transaction[] = [];
  const profile: FinancialProfile = {
    monthlySalary: 5500,
    housingCost: 1500,
    utilityCost: 220,
    subscriptionCost: 80,
    otherFixedCosts: 400,
    riskTolerance: 'moderate'
  };

  const corporateProfile: CorporateProfile = {
    monthlyRevenue: 450000,
    cogsCost: 180000,
    opExCost: 95000,
    capExCost: 35000,
    debtServiceCost: 22000,
    riskTolerance: 'moderate'
  };

  const macro = { ...DEFAULT_MACRO };

  let assets: Asset[];

  if (mode === 'corporate') {
    assets = [
      { id: '1', name: 'US Treasury Bills', symbol: 'T-BILL', balance: 2500000, category: 'Treasury', expectedReturn: 0.05, volatility: 0.02 },
      { id: '2', name: 'Corporate Bond Fund', symbol: 'CORP-BD', balance: 1200000, category: 'Corporate Bond', expectedReturn: 0.065, volatility: 0.08 },
      { id: '3', name: 'Money Market Fund', symbol: 'MMF', balance: 800000, category: 'Money Market', expectedReturn: 0.048, volatility: 0.01 },
      { id: '4', name: 'S&P 500 Index Fund', symbol: 'SPY', balance: 600000, category: 'Stock', expectedReturn: 0.09, volatility: 0.15 },
      { id: '5', name: 'Gold Reserve ETF', symbol: 'GLD', balance: 350000, category: 'Commodity', expectedReturn: 0.06, volatility: 0.12 },
      { id: '6', name: 'Operating Cash Reserve', symbol: 'CASH', balance: 1500000, category: 'Cash', expectedReturn: 0.045, volatility: 0.01 }
    ];
  } else {
    assets = [
      { id: '1', name: 'US Equities (S&P 500 ETF)', symbol: 'SPY', balance: 14500, category: 'Stock', expectedReturn: 0.09, volatility: 0.15 },
      { id: '2', name: 'Tech Growth Stock', symbol: 'QQQ', balance: 8200, category: 'Stock', expectedReturn: 0.12, volatility: 0.22 },
      { id: '3', name: 'Government Bonds', symbol: 'BND', balance: 7500, category: 'Bond', expectedReturn: 0.04, volatility: 0.05 },
      { id: '4', name: 'Ethereum', symbol: 'ETH', balance: 3400, category: 'Crypto', expectedReturn: 0.25, volatility: 0.65 },
      { id: '5', name: 'Physical Gold ETF', symbol: 'GLD', balance: 2500, category: 'Commodity', expectedReturn: 0.06, volatility: 0.12 },
      { id: '6', name: 'High Yield Savings', symbol: 'CASH', balance: 12000, category: 'Cash', expectedReturn: 0.045, volatility: 0.01 }
    ];
  }

  // Base cash is what we have left in checkout
  const cashBalance = assets.find(a => a.symbol === 'CASH')?.balance || (mode === 'corporate' ? 1500000 : 12000);
  const investmentSum = assets.filter(a => a.category !== 'Cash').reduce((sum, a) => sum + a.balance, 0);
  const netWorth = cashBalance + investmentSum;

  const today = new Date();
  let idCounter = 1;

  if (mode === 'corporate') {
    // Corporate transaction generation
    for (let i = 180; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayOfMonth = date.getDate();

      // Monthly Revenue (1st of month)
      if (dayOfMonth === 1) {
        transactions.push({
          id: `t_${idCounter++}`,
          date: dateString,
          description: 'Monthly Product Revenue',
          amount: corporateProfile.monthlyRevenue * (0.9 + Math.random() * 0.2),
          category: 'Revenue',
          type: 'income',
          isRecurring: true
        });
      }

      // COGS (5th of month)
      if (dayOfMonth === 5) {
        transactions.push({
          id: `t_${idCounter++}`,
          date: dateString,
          description: 'Cost of Goods Sold / Manufacturing',
          amount: corporateProfile.cogsCost * (0.95 + Math.random() * 0.1),
          category: 'COGS',
          type: 'expense',
          isRecurring: true
        });
      }

      // OpEx (10th of month)
      if (dayOfMonth === 10) {
        transactions.push({
          id: `t_${idCounter++}`,
          date: dateString,
          description: 'Operating Expenses (Payroll, SaaS, Office)',
          amount: corporateProfile.opExCost * (0.95 + Math.random() * 0.1),
          category: 'OpEx',
          type: 'expense',
          isRecurring: true
        });
      }

      // CapEx (15th of month)
      if (dayOfMonth === 15) {
        transactions.push({
          id: `t_${idCounter++}`,
          date: dateString,
          description: 'Capital Expenditures (Equipment & R&D)',
          amount: corporateProfile.capExCost * (0.8 + Math.random() * 0.4),
          category: 'CapEx',
          type: 'expense',
          isRecurring: false
        });
      }

      // Debt Service (20th of month)
      if (dayOfMonth === 20) {
        transactions.push({
          id: `t_${idCounter++}`,
          date: dateString,
          description: 'Debt Amortization & Interest',
          amount: corporateProfile.debtServiceCost,
          category: 'Debt Service',
          type: 'expense',
          isRecurring: true
        });
      }

      // Random corporate investment event
      if (Math.random() > 0.95) {
        transactions.push({
          id: `t_${idCounter++}`,
          date: dateString,
          description: 'Strategic Treasury Investment',
          amount: 50000 + Math.random() * 100000,
          category: 'Corporate Investment',
          type: 'expense',
          isRecurring: false
        });
      }
    }
  } else {
    // Retail consumer transaction generation (original logic)
    for (let i = 180; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayOfMonth = date.getDate();
      const dayOfWeek = date.getDay();

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

      if (dayOfMonth === 5) {
        transactions.push({
          id: `t_${idCounter++}`,
          date: dateString,
          description: 'Electric & Internet Utilities',
          amount: profile.utilityCost + (Math.sin(date.getMonth()) * 30),
          category: 'Utilities',
          type: 'expense',
          isRecurring: true
        });
      }

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
  }

  // Sort transactions by date descending (newest first)
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  return {
    netWorth,
    cashBalance,
    profile,
    corporateProfile,
    assets,
    transactions,
    mode,
    macro,
    stressScenario: 'none',
    stressIntensity: 0.5
  };
}
