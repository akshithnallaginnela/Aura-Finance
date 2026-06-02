import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FinancialData, SimulatorMode, MacroIndicators, StressScenario } from '../utils/mockData';
import type { ForecastPoint } from '../utils/forecasting';
import type { PortfolioMetrics } from '../utils/portfolio';

export interface AimlContextData {
  activeModel: 'holt-winters' | 'neural' | 'arima';
  aimlAccuracy: number;
  aimlAnomalies: string[];
  aimlClusters: Record<string, string>;
  aimlFeatureImportance: { name: string; importance: number }[];
  disasterRisks: Record<string, number>;
  investRecommendations: string[];
  isBackendConnected: boolean;
}

export async function getGeminiFinancialAdvice(
  userQuery: string,
  data: FinancialData,
  forecast: ForecastPoint[],
  optimalPortfolio: PortfolioMetrics,
  apiKey: string,
  mode: SimulatorMode = 'retail',
  macro?: MacroIndicators,
  stress?: StressScenario,
  stressIntensity?: number,
  stabilityIndex?: number,
  aimlContext?: AimlContextData
): Promise<string> {
  // Initialize SDK
  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const modeLabel = mode === 'corporate' ? 'Corporate Treasury' : 'Personal Wealth';

  // Format asset details
  const assetSummaries = data.assets.map((a, idx) => {
    const pct = (a.balance / data.netWorth) * 100;
    const optPct = (optimalPortfolio.weights[idx] || 0) * 100;
    return `- **${a.symbol} (${a.name}):** Current ${pct.toFixed(1)}% ($${a.balance.toLocaleString()}) vs. Recommended Target ${optPct.toFixed(1)}%`;
  }).join('\n');

  // Format forecast summary
  const lastForecast = forecast[forecast.length - 1];
  const lowCashMonths = forecast.filter(f => f.expense > f.income).map(f => f.monthName).join(', ');

  // Build macro context
  const macroContext = macro ? `
Macroeconomic Environment:
- **GDP Growth Rate:** ${(macro.gdpGrowth * 100).toFixed(1)}%
- **CPI Inflation Rate:** ${(macro.inflationRate * 100).toFixed(1)}%
- **Federal Funds Interest Rate:** ${(macro.interestRate * 100).toFixed(1)}%
- **Macro Stability Index:** ${stabilityIndex ?? 'N/A'}/100
${stress && stress !== 'none' ? `- **Active Stress Scenario:** ${stress.replace(/_/g, ' ').toUpperCase()} at ${((stressIntensity || 0) * 100).toFixed(0)}% intensity` : '- **Stress Scenario:** None active (baseline conditions)'}
` : '';

  // Build mode-specific profile
  const profileContext = mode === 'corporate' ? `
Corporate Treasury Profile:
- **Monthly Revenue:** $${data.corporateProfile.monthlyRevenue.toLocaleString()}
- **COGS (Cost of Goods Sold):** $${data.corporateProfile.cogsCost.toLocaleString()}
- **Operating Expenses (OpEx):** $${data.corporateProfile.opExCost.toLocaleString()}
- **Capital Expenditures (CapEx):** $${data.corporateProfile.capExCost.toLocaleString()}
- **Debt Service (Monthly):** $${data.corporateProfile.debtServiceCost.toLocaleString()}
- **Risk Tolerance Profile:** ${data.corporateProfile.riskTolerance.toUpperCase()}
` : `
Personal Financial Profile:
- **Monthly Fixed Salary:** $${data.profile.monthlySalary.toLocaleString()}
- **Fixed Monthly Expenses:** Rent: $${data.profile.housingCost.toLocaleString()}, Utilities: $${data.profile.utilityCost.toLocaleString()}, Subscriptions: $${data.profile.subscriptionCost.toLocaleString()}, Other Fixed: $${data.profile.otherFixedCosts.toLocaleString()}
- **Risk Tolerance Profile:** ${data.profile.riskTolerance.toUpperCase()}
`;

  // Build AIML Context
  const aimlContextText = aimlContext ? `
AIML Machine Learning Predictions & Statistics:
- **Active Forecasting Model:** ${aimlContext.activeModel.toUpperCase()} (${aimlContext.isBackendConnected ? 'Python MLP/ARIMA Server' : 'Client Offline Fallback'})
- **Backtesting Prediction Accuracy:** ${aimlContext.aimlAccuracy}%
- **Flagged Transaction Outliers (Z-Score > 2.2):** ${aimlContext.aimlAnomalies.length} flagged transaction IDs
- **K-Means Asset Risk Clusters:**
${Object.entries(aimlContext.aimlClusters).map(([sym, cluster]) => `  - ${sym}: ${cluster}`).join('\n')}
- **Volatility Risk Drivers (Random Forest Importance):**
${aimlContext.aimlFeatureImportance.map(f => `  - ${f.name}: ${f.importance}%`).join('\n')}
- **Calculated Natural Disaster Risks:**
  - Earthquake Risk Index: ${aimlContext.disasterRisks.earthquake}%
  - Flood Risk Index: ${aimlContext.disasterRisks.flood}%
  - Pandemic Risk Index: ${aimlContext.disasterRisks.pandemic}%
  - Supply Chain Shock Risk Index: ${aimlContext.disasterRisks.supplyChain}%
- **Quantitative Investment Suggestions (from Public Datasets simulation):**
${aimlContext.investRecommendations.map(r => `  - ${r}`).join('\n')}
` : '';

  // Construct context-rich system prompt
  const prompt = `You are Aura, an elite AI Financial Strategist and quantitative wealth strategist acting as a **Chief Economic Advisor & Quantitative Research Analyst** for ${modeLabel} management.
The user is viewing their AuraFinance wealth dashboard in **${modeLabel} Mode** and is asking you a question. You have real-time access to their computed financial state, macro-economic indicators, stress scenario impacts, mathematical cash projections, and portfolio optimization models.

**Simulator Mode:** ${modeLabel}

Here is the user's current state:
- **Net Worth:** $${data.netWorth.toLocaleString()}
- **Liquid Cash Balance:** $${data.cashBalance.toLocaleString()}

${profileContext}

${macroContext}

${aimlContextText}

Asset Holdings & Modern Portfolio Theory Allocations:
${assetSummaries}
- **Optimal Expected Portfolio Annual Return:** ${(optimalPortfolio.expectedReturn * 100).toFixed(2)}%
- **Optimal Expected Volatility (Risk):** ${(optimalPortfolio.volatility * 100).toFixed(2)}%
- **Optimal Maximum Portfolio Sharpe Ratio:** ${optimalPortfolio.sharpeRatio.toFixed(2)}

Cash Flow Forecast (Next 12 Months):
- **Current Cash:** $${data.cashBalance.toLocaleString()}
- **Projected Cash in 12 Months:** $${lastForecast ? lastForecast.balance.toLocaleString() : 'N/A'}
${lowCashMonths ? `- **Shortfall/Overspend Warning Months:** ${lowCashMonths}` : '- **Monthly Flow:** Stable positive cash accumulation across all 12 months.'}

User's Query: "${userQuery}"

Your Task:
1. Provide expert-grade, professional, and direct response tailored to the **${modeLabel}** context. Speak in the language of a Quantitative Analyst, referring to K-Means clusters, Z-score outliers, Random Forest importances, and backtesting accuracy metrics where relevant.
2. Ground all numbers and math in the user's profile. Perform calculations when recommending changes.
3. If macroeconomic data is available, incorporate GDP, inflation, and interest rate analysis into your recommendations.
4. If a stress scenario or disaster risks are elevated, explicitly address their impact and provide hedging/mitigation strategies.
5. ${mode === 'corporate' ? 'For corporate mode: Focus on treasury management, working capital optimization, capital structure decisions, and corporate hedging strategies.' : 'For retail mode: Focus on personal savings, investment strategy, emergency fund adequacy, and compound interest optimization.'}
6. Use Markdown features to make your reply beautiful:
   - Use headings for structure.
   - Use bold text for key metrics.
   - Present options, action lists, or tables when explaining strategies.
7. Keep the tone sophisticated, motivating, and mathematically sound.
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

