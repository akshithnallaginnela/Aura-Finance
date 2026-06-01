import type { Transaction, FinancialProfile, CorporateProfile, MacroIndicators, StressScenario } from './mockData';

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

// Apply macro + stress to cost multipliers
function getMacroMultiplier(macro: MacroIndicators, stress: StressScenario, intensity: number): { costMult: number; revMult: number } {
  let costMult = 1.0;
  let revMult = 1.0;

  // Inflation increases costs
  const inflDelta = macro.inflationRate - 0.03;
  costMult += inflDelta * 3; // 1% extra inflation => 3% cost increase

  // GDP affects revenue
  const gdpDelta = macro.gdpGrowth - 0.025;
  revMult += gdpDelta * 2; // 1% extra GDP growth => 2% revenue boost

  // Stress scenario impact
  if (stress !== 'none') {
    switch (stress) {
      case 'pandemic':
        revMult -= 0.20 * intensity;
        costMult += 0.05 * intensity;
        break;
      case 'supply_chain':
        costMult += 0.15 * intensity;
        revMult -= 0.08 * intensity;
        break;
      case 'rate_hike':
        costMult += 0.04 * intensity; // borrowing costs increase
        revMult -= 0.03 * intensity;
        break;
      case 'market_crash':
        revMult -= 0.15 * intensity;
        break;
    }
  }

  return { costMult: Math.max(0.5, costMult), revMult: Math.max(0.3, revMult) };
}

// Retail consumer forecast
export function forecastCashFlow(
  transactions: Transaction[],
  baseCash: number,
  profile: FinancialProfile,
  monthsAhead: number = 12,
  macro?: MacroIndicators,
  stress?: StressScenario,
  stressIntensity?: number
): ForecastPoint[] {
  const { costMult, revMult } = getMacroMultiplier(
    macro || { gdpGrowth: 0.025, inflationRate: 0.03, interestRate: 0.05 },
    stress || 'none',
    stressIntensity || 0
  );

  // 1. Analyze historical transactions to estimate discretionary spending volatility
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
    : 800;

  let stdDevDiscretionary = 150;
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

    const projectedIncome = profile.monthlySalary * revMult;

    const projectedFixedExpenses = (
      profile.housingCost + 
      profile.utilityCost + 
      profile.subscriptionCost + 
      profile.otherFixedCosts
    ) * costMult;

    let seasonalMultiplier = 1.0;
    if (monthNum === 11) seasonalMultiplier = 1.35;
    else if (monthNum === 6 || monthNum === 7) seasonalMultiplier = 1.25;
    else if (monthNum === 8) seasonalMultiplier = 1.10;

    const projectedDiscretionary = avgDiscretionary * seasonalMultiplier * costMult;
    const projectedExpense = projectedFixedExpenses + projectedDiscretionary;
    
    const netFlow = projectedIncome - projectedExpense;
    currentBalance += netFlow;

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

// Corporate treasury forecast
export function forecastCorporateCashFlow(
  transactions: Transaction[],
  baseCash: number,
  corpProfile: CorporateProfile,
  monthsAhead: number = 12,
  macro?: MacroIndicators,
  stress?: StressScenario,
  stressIntensity?: number
): ForecastPoint[] {
  const { costMult, revMult } = getMacroMultiplier(
    macro || { gdpGrowth: 0.025, inflationRate: 0.03, interestRate: 0.05 },
    stress || 'none',
    stressIntensity || 0
  );

  // Interest rate directly affects debt service
  const rateEffect = macro ? (macro.interestRate / 0.05) : 1.0;

  // Analyze historical revenue volatility
  const monthlyRevenues: number[] = [];
  transactions.forEach(t => {
    if (t.category === 'Revenue') {
      monthlyRevenues.push(t.amount);
    }
  });

  let stdDevRevenue = corpProfile.monthlyRevenue * 0.08; // default 8% std dev
  if (monthlyRevenues.length > 1) {
    const mean = monthlyRevenues.reduce((a, b) => a + b, 0) / monthlyRevenues.length;
    const variance = monthlyRevenues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (monthlyRevenues.length - 1);
    stdDevRevenue = Math.sqrt(variance);
  }

  const forecast: ForecastPoint[] = [];
  let currentBalance = baseCash;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();

  for (let h = 1; h <= monthsAhead; h++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() + h, 1);
    const monthName = `${monthNames[targetDate.getMonth()]} '${targetDate.getFullYear().toString().substring(2)}`;

    const projectedRevenue = corpProfile.monthlyRevenue * revMult;
    const projectedCOGS = corpProfile.cogsCost * costMult;
    const projectedOpEx = corpProfile.opExCost * costMult;
    const projectedCapEx = corpProfile.capExCost * costMult;
    const projectedDebtService = corpProfile.debtServiceCost * rateEffect;

    const totalExpense = projectedCOGS + projectedOpEx + projectedCapEx + projectedDebtService;
    const netFlow = projectedRevenue - totalExpense;
    currentBalance += netFlow;

    const errorMargin = stdDevRevenue * Math.sqrt(h) * 1.2;

    forecast.push({
      monthIndex: h,
      monthName,
      income: Math.round(projectedRevenue),
      expense: Math.round(totalExpense),
      balance: Math.round(currentBalance),
      lowerBound: Math.max(0, Math.round(currentBalance - errorMargin)),
      upperBound: Math.round(currentBalance + errorMargin)
    });
  }

  return forecast;
}
