import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FinancialData } from '../utils/mockData';
import type { ForecastPoint } from '../utils/forecasting';
import type { PortfolioMetrics } from '../utils/portfolio';

export async function getGeminiFinancialAdvice(
  userQuery: string,
  data: FinancialData,
  forecast: ForecastPoint[],
  optimalPortfolio: PortfolioMetrics,
  apiKey: string
): Promise<string> {
  // Initialize SDK
  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Format asset details
  const assetSummaries = data.assets.map((a, idx) => {
    const pct = (a.balance / data.netWorth) * 100;
    const optPct = (optimalPortfolio.weights[idx] || 0) * 100;
    return `- **${a.symbol} (${a.name}):** Current ${pct.toFixed(1)}% ($${a.balance.toLocaleString()}) vs. Recommended Target ${optPct.toFixed(1)}%`;
  }).join('\n');

  // Format forecast summary
  const lastForecast = forecast[forecast.length - 1];
  const lowCashMonths = forecast.filter(f => f.expense > f.income).map(f => f.monthName).join(', ');

  // Construct context-rich system prompt
  const prompt = `You are Aura, an elite AI Financial Strategist and quantitative wealth strategist.
The user is viewing their AuraFinance wealth dashboard and is asking you a question. You have real-time access to their computed financial state, mathematical cash projections, and portfolio optimization models.

Here is the user's current financial profile:
- **Net Worth:** $${data.netWorth.toLocaleString()}
- **Liquid Cash Balance:** $${data.cashBalance.toLocaleString()}
- **Risk Tolerance Profile:** ${data.profile.riskTolerance.toUpperCase()}
- **Monthly Fixed Salary:** $${data.profile.monthlySalary.toLocaleString()}
- **Fixed Monthly Expenses:** Rent: $${data.profile.housingCost.toLocaleString()}, Utilities: $${data.profile.utilityCost.toLocaleString()}, Subscriptions: $${data.profile.subscriptionCost.toLocaleString()}, Other Fixed: $${data.profile.otherFixedCosts.toLocaleString()}

Asset Holdings & Modern Portfolio Theory Allocations:
${assetSummaries}
- **Optimal Expected Portfolio Annual Return:** ${(optimalPortfolio.expectedReturn * 100).toFixed(2)}%
- **Optimal Expected Volatility (Risk):** ${(optimalPortfolio.volatility * 100).toFixed(2)}%
- **Optimal Maximum Portfolio Sharpe Ratio:** ${optimalPortfolio.sharpeRatio.toFixed(2)}

Cash Flow Forecast (Next 12 Months):
- **Current Cash:** $${data.cashBalance.toLocaleString()}
- **Projected Cash in 12 Months:** $${lastForecast ? lastForecast.balance.toLocaleString() : 'N/A'}
${lowCashMonths ? `- **Shortfall/Overspend Warning Months:** ${lowCashMonths} (months where monthly outflows exceed salary inflows)` : '- **Monthly Flow:** Stable positive cash accumulation across all 12 months.'}

User's Query: "${userQuery}"

Your Task:
1. Provide a expert-grade, professional, and direct response. Do not use generic filler text or standard disclaimers unless strictly necessary (keep disclaimers extremely brief and at the very bottom).
2. Ground all numbers and math in the user's profile. Perform calculations when recommending changes.
3. Use Markdown features to make your reply beautiful:
   - Use headings for structure.
   - Use bold text for key metrics.
   - Present options, action lists, or tables when explaining saving challenges or asset allocations.
4. Keep the tone sophisticated, motivating, and mathematically sound (mention concepts like diversification, covariance, seasonal cash flows, and compound interest).
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
