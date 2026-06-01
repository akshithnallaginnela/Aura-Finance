import type { Asset } from './mockData';


// Asset correlation matrix (index mapping aligns with assets in mockData)
// 0: SPY (Stock), 1: QQQ (Stock), 2: BND (Bond), 3: ETH (Crypto), 4: GLD (Commodity), 5: CASH (Cash)
const correlationMatrix: number[][] = [
  [ 1.00,  0.85, -0.15,  0.42,  0.08,  0.00], // SPY
  [ 0.85,  1.00, -0.18,  0.48,  0.05,  0.00], // QQQ
  [-0.15, -0.18,  1.00, -0.05,  0.12,  0.00], // BND
  [ 0.42,  0.48, -0.05,  1.00,  0.15,  0.00], // ETH
  [ 0.08,  0.05,  0.12,  0.15,  1.00,  0.00], // GLD
  [ 0.00,  0.00,  0.00,  0.00,  0.00,  1.00]  // CASH
];

export interface PortfolioMetrics {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  weights: number[];
}

export interface FrontierPoint {
  returnVal: number;
  volatility: number;
  sharpeRatio: number;
}

// Helper to calculate covariance matrix
export function getCovarianceMatrix(assets: Asset[]): number[][] {
  const n = assets.length;
  const cov: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const volI = assets[i].volatility;
      const volJ = assets[j].volatility;
      // Map asset category to correlation matrix index
      const corr = correlationMatrix[i][j] || 0;
      cov[i][j] = volI * volJ * corr;
    }
  }
  return cov;
}

// Calculate return, volatility and Sharpe ratio for specific weights
export function getPortfolioMetrics(
  weights: number[],
  assets: Asset[],
  riskFreeRate: number = 0.04
): PortfolioMetrics {
  const n = assets.length;
  let expectedReturn = 0;
  
  // 1. Calculate Expected Return
  for (let i = 0; i < n; i++) {
    expectedReturn += weights[i] * assets[i].expectedReturn;
  }

  // 2. Calculate Volatility (Variance = W^T * Cov * W)
  const cov = getCovarianceMatrix(assets);
  let variance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      variance += weights[i] * weights[j] * cov[i][j];
    }
  }
  const volatility = Math.sqrt(variance);

  // 3. Sharpe Ratio
  const sharpeRatio = volatility > 0 ? (expectedReturn - riskFreeRate) / volatility : 0;

  return {
    expectedReturn,
    volatility,
    sharpeRatio,
    weights
  };
}

// Run Monte Carlo simulation of portfolios to generate the Efficient Frontier points
export function generateEfficientFrontier(
  assets: Asset[],
  numPortfolios: number = 600,
  riskFreeRate: number = 0.04
): FrontierPoint[] {
  const n = assets.length;
  const points: FrontierPoint[] = [];

  // Always seed standard asset-only portfolios
  for (let i = 0; i < n; i++) {
    const singleAssetWeights = Array(n).fill(0);
    singleAssetWeights[i] = 1.0;
    const metrics = getPortfolioMetrics(singleAssetWeights, assets, riskFreeRate);
    points.push({
      returnVal: metrics.expectedReturn,
      volatility: metrics.volatility,
      sharpeRatio: metrics.sharpeRatio
    });
  }

  // Monte Carlo random generation
  for (let p = 0; p < numPortfolios; p++) {
    // Generate random weights
    let rawWeights = Array(n).fill(0).map(() => Math.random());
    
    // CASH weight is sometimes forced lower to show more interesting portfolios
    rawWeights = rawWeights.map((w, index) => {
      if (assets[index].symbol === 'CASH') return w * 0.15; // penalize high cash in optimization visualizer
      return w;
    });

    const sum = rawWeights.reduce((a, b) => a + b, 0);
    const weights = rawWeights.map(w => w / sum);

    const metrics = getPortfolioMetrics(weights, assets, riskFreeRate);
    points.push({
      returnVal: metrics.expectedReturn,
      volatility: metrics.volatility,
      sharpeRatio: metrics.sharpeRatio
    });
  }

  // Sort by volatility ascending for chart rendering
  return points.sort((a, b) => a.volatility - b.volatility);
}

// Find optimal portfolio depending on user risk profile
export function optimizePortfolio(
  assets: Asset[],
  riskTolerance: 'conservative' | 'moderate' | 'aggressive',
  riskFreeRate: number = 0.04
): PortfolioMetrics {
  const n = assets.length;

  // Volatility boundaries for risk profiles
  const limits = {
    conservative: { maxVol: 0.06, minReturn: 0.04 },
    moderate: { maxVol: 0.12, minReturn: 0.07 },
    aggressive: { maxVol: 0.25, minReturn: 0.12 }
  };

  const limit = limits[riskTolerance];
  
  // Grid search + random local search to find optimal portfolio weights
  let bestWeights = Array(n).fill(0);
  let bestSharpe = -999;
  let bestMetrics: PortfolioMetrics = { expectedReturn: 0, volatility: 0, sharpeRatio: 0, weights: [] };

  // Helper to test a weights vector
  const evaluate = (w: number[]) => {
    const sum = w.reduce((a, b) => a + b, 0);
    const normalized = w.map(val => val / sum);
    const metrics = getPortfolioMetrics(normalized, assets, riskFreeRate);
    
    // Check if portfolio fits the risk boundary
    // For conservative: keep volatility low. For aggressive: push return higher.
    if (metrics.volatility <= limit.maxVol) {
      // We want to maximize Sharpe Ratio
      if (metrics.sharpeRatio > bestSharpe) {
        bestSharpe = metrics.sharpeRatio;
        bestWeights = [...normalized];
        bestMetrics = metrics;
      }
    }
  };

  // 1. Core portfolio profiles
  // Equal weighted
  evaluate(Array(n).fill(1 / n));

  // Risk profile benchmarks
  if (riskTolerance === 'conservative') {
    // 60% Cash, 30% Bonds, 10% SPY
    evaluate(assets.map(a => a.symbol === 'CASH' ? 0.6 : a.symbol === 'BND' ? 0.3 : a.symbol === 'SPY' ? 0.1 : 0.0));
  } else if (riskTolerance === 'moderate') {
    // 10% Cash, 30% Bonds, 40% SPY, 10% QQQ, 10% GLD
    evaluate(assets.map(a => a.symbol === 'CASH' ? 0.1 : a.symbol === 'BND' ? 0.3 : a.symbol === 'SPY' ? 0.4 : a.symbol === 'QQQ' ? 0.1 : a.symbol === 'GLD' ? 0.1 : 0.0));
  } else {
    // 5% Cash, 5% Bonds, 40% SPY, 30% QQQ, 20% ETH
    evaluate(assets.map(a => a.symbol === 'CASH' ? 0.05 : a.symbol === 'BND' ? 0.05 : a.symbol === 'SPY' ? 0.4 : a.symbol === 'QQQ' ? 0.3 : a.symbol === 'ETH' ? 0.2 : 0.0));
  }

  // 2. Large scale random search
  for (let k = 0; k < 10000; k++) {
    const w = Array(n).fill(0).map(() => Math.random());
    
    // Adjust weights biases depending on risk profile
    const skewedW = w.map((val, idx) => {
      const category = assets[idx].category;
      if (riskTolerance === 'conservative') {
        if (category === 'Cash') return val * 3.0;
        if (category === 'Bond') return val * 2.0;
        if (category === 'Crypto') return 0; // No crypto for conservative
        return val * 0.2;
      }
      if (riskTolerance === 'moderate') {
        if (category === 'Cash') return val * 0.5;
        if (category === 'Bond') return val * 1.0;
        if (category === 'Crypto') return val * 0.15; // Light crypto
        return val * 1.5;
      }
      // Aggressive
      if (category === 'Cash') return val * 0.05; // minimize cash
      if (category === 'Bond') return val * 0.05; // minimize bonds
      if (category === 'Crypto') return val * 1.0; // high crypto allowance
      return val * 2.0;
    });

    evaluate(skewedW);
  }

  // If no portfolio was found within the maxVol limits (rare fallback), get the minimum volatility portfolio
  if (bestWeights.reduce((a, b) => a + b, 0) === 0) {
    let minVol = 999;
    for (let k = 0; k < 2000; k++) {
      const w = Array(n).fill(0).map(() => Math.random());
      const sum = w.reduce((a, b) => a + b, 0);
      const normalized = w.map(val => val / sum);
      const metrics = getPortfolioMetrics(normalized, assets, riskFreeRate);
      if (metrics.volatility < minVol) {
        minVol = metrics.volatility;
        bestMetrics = metrics;
      }
    }
  }

  return bestMetrics;
}
