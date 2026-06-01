import type { Transaction, FinancialProfile } from './mockData';

export interface ForecastPoint {
  monthIndex: number;
  monthName: string;
  income: number;
  expense: number;
  balance: number;
  lowerBound: number;
  upperBound: number;
}

// Format month index to MMM YYYY
export function getMonthLabel(offsetMonths: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + offsetMonths);
  return date.toLocaleString('default', { month: 'short', year: '2-digit' });
}

export function forecastCashFlow(
  transactions: Transaction[],
  baseCash: number,
  profile: FinancialProfile,
  monthsAhead: number = 12
): ForecastPoint[] {
  // 1. Analyze historical transactions to estimate discretionary spending volatility
  // Group historical expenses by month (excluding fixed/recurring items)
  const monthlyDiscretionaryExpenses: { [key: string]: number } = {};
  
  transactions.forEach(t => {
    if (t.type === 'expense' && !t.isRecurring) {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthlyDiscretionaryExpenses[monthKey]) {
        monthlyDiscretionaryExpenses[monthKey] = 0;
      }
      monthlyDiscretionaryExpenses[monthKey] += t.amount;
    }
  });

  const discretionaryValues = Object.values(monthlyDiscretionaryExpenses);
  const avgDiscretionary = discretionaryValues.length > 0 
    ? discretionaryValues.reduce((a, b) => a + b, 0) / discretionaryValues.length
    : 800; // fallback default

  // Calculate standard deviation of historical discretionary spending
  let stdDevDiscretionary = 150; // default
  if (discretionaryValues.length > 1) {
    const mean = avgDiscretionary;
    const variance = discretionaryValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (discretionaryValues.length - 1);
    stdDevDiscretionary = Math.sqrt(variance);
  }

  // 2. Projection loop
  const forecast: ForecastPoint[] = [];
  let currentBalance = baseCash;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();

  for (let h = 1; h <= monthsAhead; h++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() + h, 1);
    const monthName = `${monthNames[targetDate.getMonth()]} '${targetDate.getFullYear().toString().substring(2)}`;
    const monthNum = targetDate.getMonth();

    // Determine fixed income
    const projectedIncome = profile.monthlySalary;

    // Determine fixed expenses
    const projectedFixedExpenses = 
      profile.housingCost + 
      profile.utilityCost + 
      profile.subscriptionCost + 
      profile.otherFixedCosts;

    // Estimate discretionary spending with seasonal modifiers
    let seasonalMultiplier = 1.0;
    
    // Holiday season spending in December
    if (monthNum === 11) {
      seasonalMultiplier = 1.35;
    } 
    // Summer travel spending in July/August
    else if (monthNum === 6 || monthNum === 7) {
      seasonalMultiplier = 1.25;
    }
    // Back to school/shopping in September
    else if (monthNum === 8) {
      seasonalMultiplier = 1.10;
    }

    const projectedDiscretionary = avgDiscretionary * seasonalMultiplier;
    const projectedExpense = projectedFixedExpenses + projectedDiscretionary;
    
    const netFlow = projectedIncome - projectedExpense;
    currentBalance += netFlow;

    // The uncertainty (standard error) grows over time proportional to sqrt(h)
    const errorMargin = stdDevDiscretionary * Math.sqrt(h) * 1.5;

    forecast.push({
      monthIndex: h,
      monthName,
      income: Math.round(projectedIncome),
      expense: Math.round(projectedExpense),
      balance: Math.round(currentBalance),
      lowerBound: Math.max(0, Math.round(currentBalance - errorMargin)),
      upperBound: Math.round(currentBalance + errorMargin)
    });
  }

  return forecast;
}
