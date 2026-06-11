import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFinance, type EnsembleWeights } from '../context/FinanceContext';
import { createChart, AreaSeries, LineSeries } from '@pipsend/charts';
import { useTheme } from '../context/ThemeContext';
import { getIndianMarketStatus } from '../utils/marketStatus';
import { SlidersHorizontal } from 'lucide-react';

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'Max';

// ─── Filter historical data by time range (defined at module scope to avoid hoisting issues) ───
function filterByTimeRange(data: any[], timeRange: TimeRange): any[] {
  if (timeRange === 'Max' || !data.length) return data;
  const now = new Date();
  const cutoffs: Record<TimeRange, number> = {
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 365,
    'Max': 99999,
  };
  const days = cutoffs[timeRange];
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return data.filter(d => {
    // Parse YYYY-MM-DD without timezone shift
    const raw = d.Date || d.date || '';
    const parts = raw.split('-');
    if (parts.length === 3) {
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return date >= cutoff;
    }
    return new Date(raw) >= cutoff;
  });
}

// ─── Safe date formatter — avoids timezone off-by-one ───
function formatDateForChart(dateVal: any): string {
  if (!dateVal) return '';
  try {
    const s = String(dateVal);
    const parts = s.split('T')[0].split('-');
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      if (yyyy && mm && dd) return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
    }
    const d = new Date(s);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd2 = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd2}`;
  } catch {
    return '';
  }
}

// ─── Dynamic accuracy label — varies by stock volatility and sentiment ───
function computeDisplayAccuracy(
  backtestAccuracy: number,
  stockData: any[],
  disasterRiskScore: number
): { value: string; label: string; colorClass: string } {
  if (!backtestAccuracy || stockData.length < 10) {
    return { value: 'N/A', label: 'Insufficient data', colorClass: '' };
  }
  // Compute 30-day volatility to scale displayed accuracy
  const recent = stockData.slice(-30).map((d: any) => Number(d.Close || d.close || 0));
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const variance = recent.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / recent.length;
  const volatilityPct = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;

  // High volatility and high disaster risk reduce displayed confidence
  const volPenalty = Math.min(volatilityPct * 0.6, 8);
  const riskPenalty = disasterRiskScore * 12;
  const adjusted = Math.max(62, Math.min(97, backtestAccuracy - volPenalty - riskPenalty));

  let label = 'High Confidence';
  let colorClass = 'up';
  if (adjusted < 72) { label = 'Low Confidence'; colorClass = 'dn'; }
  else if (adjusted < 82) { label = 'Moderate'; colorClass = 'amber'; }

  return { value: `${adjusted.toFixed(1)}%`, label, colorClass };
}

export const Dashboard: React.FC = () => {
  const {
    activeTicker,
    stockData,
    fundamentalSummary,
    disasterRiskScore,
    fundamentals,
    backtestAccuracy,
    fetchStockData,
    isLoadingData,
    errorData,
    watchlist,
    portfolioValue,
    marketIndex,
    ensembleWeights,
    setEnsembleWeights,
    tunedForecast
  } = useFinance();

  const [timeRange, setTimeRange] = useState<TimeRange>('Max');
  const [news, setNews] = useState<any[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [isWeightsExpanded, setIsWeightsExpanded] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const marketChartContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const fetchNews = useCallback(async (ticker: string) => {
    setIsNewsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/news/${ticker}`);
      if (response.ok) {
        const data = await response.json();
        setNews(data);
      } else {
        setNews([]);
      }
    } catch (err) {
      console.error('Failed to fetch news', err);
      setNews([]);
    } finally {
      setIsNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeTicker) return;
    fetchNews(activeTicker);
  }, [activeTicker, fetchNews]);

  // ─── Main price chart ───
  useEffect(() => {
    if (!chartContainerRef.current) return;
    chartContainerRef.current.innerHTML = '';
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: isDark ? '#7a8fa6' : '#64748b',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
        horzLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
      },
      crosshair: { mode: 1 },
      timeScale: { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
      rightPriceScale: { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
    });

    const historicalSeries = chart.addSeries(AreaSeries, {
      lineColor: isDark ? '#00c076' : '#059669',
      topColor: isDark ? 'rgba(0, 192, 118, 0.2)' : 'rgba(5, 150, 105, 0.2)',
      bottomColor: 'rgba(0, 0, 0, 0)',
      lineWidth: 2,
      priceLineVisible: false,
    });

    const histData = filterByTimeRange(stockData || [], timeRange)
      .map(d => ({
        time: formatDateForChart(d.Date || d.date),
        value: Number(d.Close || d.close || 0),
      }))
      .filter(item => item.time !== '');

    if (histData.length > 0) historicalSeries.setData(histData);

    if (tunedForecast && tunedForecast.length > 0 && (timeRange === '6M' || timeRange === '1Y' || timeRange === 'Max')) {
      const forecastSeries = chart.addSeries(LineSeries, {
        color: '#e8a800',
        lineWidth: 2,
        lineStyle: 1,
        priceLineVisible: false,
      });

      const foreData: { time: string; value: number }[] = [];
      const lastHist = histData[histData.length - 1];
      if (lastHist) foreData.push({ time: lastHist.time, value: lastHist.value });

      tunedForecast.forEach(f => {
        const timeStr = formatDateForChart(f.Date);
        if (timeStr) foreData.push({ time: timeStr, value: Number(f.PredictedClose || 0) });
      });

      if (foreData.length > 0) forecastSeries.setData(foreData);

      const upperSeries = chart.addSeries(LineSeries, { color: 'rgba(232, 168, 0, 0.35)', lineWidth: 1, lineStyle: 2, priceLineVisible: false });
      const lowerSeries = chart.addSeries(LineSeries, { color: 'rgba(232, 168, 0, 0.35)', lineWidth: 1, lineStyle: 2, priceLineVisible: false });

      const upperData: { time: string; value: number }[] = [];
      const lowerData: { time: string; value: number }[] = [];
      if (lastHist) {
        upperData.push({ time: lastHist.time, value: lastHist.value });
        lowerData.push({ time: lastHist.time, value: lastHist.value });
      }
      tunedForecast.forEach(f => {
        const timeStr = formatDateForChart(f.Date);
        if (timeStr) {
          upperData.push({ time: timeStr, value: Number(f.UpperBand || 0) });
          lowerData.push({ time: timeStr, value: Number(f.LowerBand || 0) });
        }
      });
      if (upperData.length > 0) upperSeries.setData(upperData);
      if (lowerData.length > 0) lowerSeries.setData(lowerData);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.resize(chartContainerRef.current.clientWidth, chartContainerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [stockData, tunedForecast, timeRange, theme]);

  // ─── Market index chart ───
  useEffect(() => {
    if (!marketChartContainerRef.current) return;
    marketChartContainerRef.current.innerHTML = '';
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const chart = createChart(marketChartContainerRef.current, {
      layout: { background: { color: 'transparent' }, textColor: isDark ? '#7a8fa6' : '#64748b' },
      grid: {
        vertLines: { color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
        horzLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
      },
      crosshair: { mode: 1 },
      timeScale: { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
      rightPriceScale: { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
    });

    const indexSeries = chart.addSeries(AreaSeries, {
      lineColor: '#3b82f6',
      topColor: 'rgba(59, 130, 246, 0.2)',
      bottomColor: 'rgba(0, 0, 0, 0)',
      lineWidth: 2,
      priceLineVisible: false,
    });

    const indexData = filterByTimeRange(marketIndex || [], timeRange)
      .map(d => ({ time: formatDateForChart(d.date), value: Number(d.value || 0) }))
      .filter(item => item.time !== '');

    if (indexData.length > 0) indexSeries.setData(indexData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (marketChartContainerRef.current) {
        chart.resize(marketChartContainerRef.current.clientWidth, marketChartContainerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [marketIndex, theme, timeRange]);

  const handleTickerClick = (ticker: string) => {
    fetchStockData(`${ticker}.NS`);
  };

  // ─── Derived values ───
  const currentPrice = stockData?.length > 0 ? stockData[stockData.length - 1].Close : 0;
  const previousPrice = stockData?.length > 1 ? stockData[stockData.length - 2].Close : 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePct = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  // Portfolio daily change — computed from watchlist actual change values
  const portfolioDailyChange = watchlist.reduce((sum, item) => {
    const shares = item.shares || 0;
    return sum + (item.change || 0) * shares;
  }, 0);
  const portfolioDailyChangePct = portfolioValue > 0 ? (portfolioDailyChange / portfolioValue) * 100 : 0;

  const accuracyDisplay = computeDisplayAccuracy(backtestAccuracy, stockData || [], disasterRiskScore);

  const formatPrice = (val: number) => {
    if (!val || isNaN(val)) return '—';
    if (val > 200) return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    return `$${val.toFixed(2)}`;
  };

  const forecastTarget = tunedForecast && tunedForecast.length > 0
    ? tunedForecast[tunedForecast.length - 1].PredictedClose
    : null;
  const forecastChangePct = forecastTarget && currentPrice > 0
    ? ((forecastTarget - currentPrice) / currentPrice) * 100
    : null;

  return (
    <>
      {/* ERROR BANNER */}
      {errorData && (
        <div style={{ padding: '12px 18px', background: 'var(--red-bg)', color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: '11px', border: '1px solid var(--red)', marginBottom: '12px', borderRadius: '4px' }}>
          {errorData}
        </div>
      )}

      {/* STAT STRIP */}
      <div className="stat-strip">
        <div className="stat-cell">
          <div className="stat-cell-label">Portfolio Value</div>
          <div className="stat-cell-val">₹{portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className={`stat-cell-chg ${portfolioDailyChangePct >= 0 ? 'up' : 'dn'}`}>
            <span>{portfolioDailyChangePct >= 0 ? '▲' : '▼'}</span> {Math.abs(portfolioDailyChangePct).toFixed(2)}%
          </div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">{activeTicker} Price</div>
          <div className="stat-cell-val">{formatPrice(currentPrice)}</div>
          <div className={`stat-cell-chg ${isPositive ? 'up' : 'dn'}`}>
            <span>{isPositive ? '▲' : '▼'}</span> {Math.abs(priceChangePct).toFixed(2)}%
          </div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">6M Forecast</div>
          <div className="stat-cell-val">
            {forecastTarget ? formatPrice(forecastTarget) : 'N/A'}
          </div>
          <div className={`stat-cell-chg ${forecastChangePct !== null ? (forecastChangePct >= 0 ? 'up' : 'dn') : 'amber'}`}>
            {forecastChangePct !== null
              ? <><span>{forecastChangePct >= 0 ? '▲' : '▼'}</span> {Math.abs(forecastChangePct).toFixed(2)}% projected</>
              : <span>Projected Target</span>
            }
          </div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">Signal Confidence</div>
          <div className={`stat-cell-val ${accuracyDisplay.colorClass}`}>{accuracyDisplay.value}</div>
          <div className={`stat-cell-chg ${accuracyDisplay.colorClass}`}><span>{accuracyDisplay.label}</span></div>
        </div>
        <div className="stat-cell highlight">
          <div className="stat-cell-label">Market Risk</div>
          <div className={`stat-cell-val ${disasterRiskScore > 0.3 ? 'dn' : 'up'}`}>
            {disasterRiskScore > 0.5 ? 'HIGH' : disasterRiskScore > 0.15 ? 'MODERATE' : 'LOW'}
          </div>
          <div className={`stat-cell-chg ${disasterRiskScore > 0.3 ? 'dn' : 'up'}`}>
            <span>Risk Score:</span> {(disasterRiskScore * 100).toFixed(0)}%
          </div>
        </div>
        <MarketStatusCell />
      </div>

      {/* GRID ROW 1: Charts & Watchlist */}
      <div className="row row-3-1">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Main Ticker Chart */}
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title"><span className="panel-title-dot"></span>{activeTicker} PRICE & PROJECTION</div>
              <div className="panel-controls">
                <button className={`seg-btn ${timeRange === '1M' ? 'active' : ''}`} onClick={() => setTimeRange('1M')}>1M</button>
                <button className={`seg-btn ${timeRange === '6M' ? 'active' : ''}`} onClick={() => setTimeRange('6M')}>6M</button>
                <button className={`seg-btn ${timeRange === '1Y' ? 'active' : ''}`} onClick={() => setTimeRange('1Y')}>1Y</button>
                <button className={`seg-btn ${timeRange === 'Max' ? 'active' : ''}`} onClick={() => setTimeRange('Max')}>MAX</button>
              </div>
            </div>

            <div className="chart-stats">
              <div className="cs-item" style={{ marginTop: '10px' }}>
                <div className="cs-label">LAST CLOSE</div>
                <div className="cs-val">{formatPrice(currentPrice)}</div>
              </div>
              <div className="cs-item" style={{ marginTop: '10px' }}>
                <div className="cs-label">DAY CHANGE</div>
                <div className={`cs-val ${isPositive ? 'up' : 'dn'}`}>{isPositive ? '+' : ''}{priceChange.toFixed(2)}</div>
              </div>
              {fundamentals && fundamentals.fifty_two_week_high !== 'N/A' && (
                <div className="cs-item" style={{ marginTop: '10px' }}>
                  <div className="cs-label">52W HIGH</div>
                  <div className="cs-val">₹{fundamentals.fifty_two_week_high}</div>
                </div>
              )}
              {fundamentals && fundamentals.fifty_two_week_low !== 'N/A' && (
                <div className="cs-item" style={{ marginTop: '10px' }}>
                  <div className="cs-label">52W LOW</div>
                  <div className="cs-val">₹{fundamentals.fifty_two_week_low}</div>
                </div>
              )}
            </div>

            <div className="chart-area" style={{ height: '350px' }}>
              {isLoadingData ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', fontFamily: 'var(--mono)', fontSize: '11px' }}>
                  PROCESSING MARKET DATA...
                </div>
              ) : (
                <div ref={chartContainerRef} style={{ width: '100%', height: '320px' }} />
              )}
            </div>
            <div className="chart-legend">
              <div className="leg"><div className="leg-sq" style={{ background: 'var(--green)' }}></div> HISTORICAL</div>
              <div className="leg"><div className="leg-sq" style={{ background: 'var(--amber)' }}></div> PROJECTED MEDIAN</div>
              <div className="leg"><div className="leg-sq" style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber)' }}></div> CONFIDENCE BAND</div>
            </div>

            {/* Ensemble Weights Tuner — generic labels only */}
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
                onClick={() => setIsWeightsExpanded(!isWeightsExpanded)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx)' }}>
                  <SlidersHorizontal size={15} style={{ color: 'var(--amber)' }} />
                  Ensemble Signal Weights
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--tx3)' }}>{isWeightsExpanded ? 'Hide ▲' : 'Tune ▼'}</span>
              </div>

              {isWeightsExpanded && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--tx3)', lineHeight: 1.4 }}>
                    Adjust the relative weighting of each signal component. Projections update interactively.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    {([
                      { name: 'Signal A', key: 'chronos', desc: 'Foundation Signal', color: '#6366f1' },
                      { name: 'Signal B', key: 'transformer', desc: 'Pattern Signal', color: '#14b8a6' },
                      { name: 'Signal C', key: 'xgboost', desc: 'Technical Signal', color: '#f59e0b' },
                      { name: 'Signal D', key: 'lightgbm', desc: 'Momentum Signal', color: '#ec4899' },
                      { name: 'Signal E', key: 'lstm', desc: 'Sequence Signal', color: '#8b5cf6' },
                    ] as { name: string; key: keyof EnsembleWeights; desc: string; color: string }[]).map(model => {
                      const val = ensembleWeights[model.key] * 100;
                      return (
                        <div key={model.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg2)', border: '1px solid var(--line)', padding: '10px', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tx)' }}>{model.name}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: model.color }}>{Math.round(val)}%</span>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--tx3)' }}>{model.desc}</span>
                          <input
                            type="range" min="0" max="100" value={val}
                            onChange={e => {
                              const newVal = Number(e.target.value) / 100;
                              setEnsembleWeights(prev => ({ ...prev, [model.key]: newVal }));
                            }}
                            style={{ width: '100%', accentColor: model.color, cursor: 'pointer', height: '3px', marginTop: '4px' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="seg-btn"
                      onClick={() => setEnsembleWeights({ chronos: 0.35, transformer: 0.20, xgboost: 0.20, lightgbm: 0.15, lstm: 0.10 })}
                      style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Market Index Chart */}
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title"><span className="panel-title-dot" style={{ background: 'var(--blue)' }}></span>TOTAL MARKET INDEX (NIFTY 50)</div>
              <div className="panel-badge badge-blue">INDEX</div>
            </div>
            <div className="chart-stats">
              <div className="cs-item" style={{ marginTop: '10px' }}>
                <div className="cs-label">INDEX SYMBOL</div>
                <div className="cs-val">^NSEI</div>
              </div>
              <div className="cs-item" style={{ marginTop: '10px' }}>
                <div className="cs-label">LATEST VALUE</div>
                <div className="cs-val">
                  {marketIndex && marketIndex.length > 0
                    ? `₹${marketIndex[marketIndex.length - 1].value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                    : 'Loading...'}
                </div>
              </div>
            </div>
            <div className="chart-area" style={{ height: '320px' }}>
              <div ref={marketChartContainerRef} style={{ width: '100%', height: '290px' }} />
            </div>
          </div>
        </div>

        {/* Watchlist */}
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title"><span className="panel-title-dot"></span>WATCHLIST</div>
            <div className="panel-badge badge-blue">LIVE</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {watchlist.map(item => (
              <div className="wl-item" key={item.ticker} onClick={() => handleTickerClick(item.ticker)}>
                <div className="wl-sym">{item.ticker.replace('.NS', '')}</div>
                <div className="wl-name">{item.exchange || 'NSE'}</div>
                <div className="wl-price">{(item.price || 0) > 0 ? `₹${item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : 'Loading...'}</div>
                <div className={`wl-chg ${(item.changePct || 0) >= 0 ? 'up' : 'dn'}`}>
                  {(item.price || 0) > 0 ? `${(item.changePct || 0) >= 0 ? '+' : ''}${(item.changePct || 0).toFixed(2)}%` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GRID ROW 2: Fundamentals & News */}
      <div className="row row-2">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title"><span className="panel-title-dot"></span>FUNDAMENTALS & SENTIMENT</div>
            <div className="panel-badge badge-green">LIVE</div>
          </div>
          <div className="forecast-meta">
            <div className="fm-cell">
              <div className="fm-label">P/E Ratio</div>
              <div className="fm-val">{fundamentals?.pe_ratio || '-'}</div>
            </div>
            <div className="fm-cell">
              <div className="fm-label">EPS</div>
              <div className="fm-val">{fundamentals?.eps ? `₹${fundamentals.eps}` : '-'}</div>
            </div>
            <div className="fm-cell">
              <div className="fm-label">Market Cap</div>
              <div className="fm-val">{fundamentals?.market_cap ? `₹${(fundamentals.market_cap / 10000000000).toFixed(2)}T` : '-'}</div>
            </div>
            <div className="fm-cell">
              <div className="fm-label">Div. Yield</div>
              <div className="fm-val">{fundamentals?.dividend_yield ? `${(fundamentals.dividend_yield * 100).toFixed(2)}%` : '-'}</div>
            </div>
          </div>
          <div style={{ padding: '16px', fontFamily: 'var(--sans)', fontSize: '13.5px', color: 'var(--tx2)', lineHeight: 1.6 }}>
            {fundamentalSummary || 'Select a ticker to view the fundamental analysis summary.'}
          </div>
        </div>

        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="panel-head">
            <div className="panel-title"><span className="panel-title-dot" style={{ background: 'var(--amber)' }}></span>LIVE NEWS SENTINEL</div>
            <div className="panel-badge badge-amber">SENTINEL</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '320px' }}>
            {isNewsLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--tx3)', fontFamily: 'var(--mono)', fontSize: '11px' }}>
                SCANNING RECENT HEADLINES...
              </div>
            ) : news.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--tx3)', fontFamily: 'var(--mono)', fontSize: '11px' }}>
                NO HEADLINES IN SENTINEL FOR {activeTicker}
              </div>
            ) : (
              news.map((item, idx) => {
                const score = item.sentiment_score || 0.0;
                const isBullish = score > 0.15;
                const isBearish = score < -0.15;
                const badgeClass = isBullish ? 'badge-green' : isBearish ? 'badge-red' : 'badge-blue';
                const label = isBullish ? 'BULLISH' : isBearish ? 'BEARISH' : 'NEUTRAL';
                return (
                  <div key={idx} style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--tx)', lineHeight: 1.4 }}>{item.headline}</span>
                      <span className={`panel-badge ${badgeClass}`} style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '2px', flexShrink: 0 }}>{label}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--tx3)' }}>
                      <span>SIGNAL: {score.toFixed(2)}</span>
                      <span>{item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'JUST NOW'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

/* ─── Market Status Sub-component ─── */
const MarketStatusCell: React.FC = () => {
  const [status, setStatus] = useState(getIndianMarketStatus());

  useEffect(() => {
    const interval = setInterval(() => setStatus(getIndianMarketStatus()), 30000);
    return () => clearInterval(interval);
  }, []);

  const colorClass = status.state === 'OPEN' ? 'up' : status.state === 'CLOSED' ? 'dn' : 'amber';

  return (
    <div className="stat-cell">
      <div className="stat-cell-label">Market Status</div>
      <div className={`stat-cell-val ${colorClass}`}>{status.state}</div>
      <div className={`stat-cell-chg ${colorClass}`}><span>{status.subLabel}</span></div>
    </div>
  );
};
