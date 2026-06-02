import type { Transaction, Asset, MacroIndicators, StressScenario } from '../utils/mockData';
import type { ForecastPoint } from '../utils/forecasting';

const BACKEND_BASE_URL = 'http://localhost:5000';

export interface ForecastRequest {
  transactions: Transaction[];
  cashBalance: number;
  profile: any; // FinancialProfile or CorporateProfile
  activeModel: 'holt-winters' | 'neural' | 'arima';
  macro: MacroIndicators;
  stressScenario: StressScenario;
  stressIntensity: number;
}

export interface ForecastResponse {
  forecast: ForecastPoint[];
  accuracy: number;
  anomalies: string[];
  activeModel: 'holt-winters' | 'neural' | 'arima';
}

export interface PortfolioRequest {
  assets: Asset[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  macro: MacroIndicators;
  stressScenario: StressScenario;
  stressIntensity: number;
}

export interface FeatureImportanceItem {
  name: string;
  importance: number;
}

export interface PortfolioResponse {
  clusters: Record<string, string>; // e.g. {"SPY": "Growth", "CASH": "Safe Haven"}
  featureImportance: FeatureImportanceItem[];
}

export interface DisasterRiskResponse {
  risks: {
    earthquake: number;
    flood: number;
    pandemic: number;
    supplyChain: number;
  };
}

export interface InvestRecommendationsResponse {
  recommendations: string[];
}

// Check if Python backend is online
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: (AbortController as any).timeout ? (AbortController as any).timeout(1000) : undefined // Timeout fast
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'healthy';
  } catch (err) {
    return false;
  }
}

// Call Python API to predict cash flow forecast and detect anomalies
export async function getForecastFromBackend(reqData: ForecastRequest): Promise<ForecastResponse> {
  const res = await fetch(`${BACKEND_BASE_URL}/api/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqData)
  });
  if (!res.ok) {
    throw new Error(`Forecast API failed: ${res.statusText}`);
  }
  return await res.json() as ForecastResponse;
}

// Call Python API to get asset risk clustering (K-Means) and feature importance (Random Forest)
export async function getPortfolioFromBackend(reqData: PortfolioRequest): Promise<PortfolioResponse> {
  const res = await fetch(`${BACKEND_BASE_URL}/api/portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqData)
  });
  if (!res.ok) {
    throw new Error(`Portfolio API failed: ${res.statusText}`);
  }
  return await res.json() as PortfolioResponse;
}

// Call Python API to get natural disaster risks
export async function getDisasterRisksFromBackend(
  macro: MacroIndicators,
  stressScenario: StressScenario,
  stressIntensity: number
): Promise<DisasterRiskResponse> {
  const res = await fetch(`${BACKEND_BASE_URL}/api/disaster-risk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ macro, stressScenario, stressIntensity })
  });
  if (!res.ok) {
    throw new Error(`Disaster Risk API failed: ${res.statusText}`);
  }
  return await res.json() as DisasterRiskResponse;
}

// Call Python API to get investment advice
export async function getInvestRecommendationsFromBackend(
  macro: MacroIndicators,
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
): Promise<InvestRecommendationsResponse> {
  const res = await fetch(`${BACKEND_BASE_URL}/api/invest-recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ macro, riskTolerance })
  });
  if (!res.ok) {
    throw new Error(`Invest Recommendations API failed: ${res.statusText}`);
  }
  return await res.json() as InvestRecommendationsResponse;
}
