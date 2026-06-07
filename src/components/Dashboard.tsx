import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { createChart, AreaSeries, LineSeries } from '@pipsend/charts';
import { useTheme } from '../context/ThemeContext';
import { getIndianMarketStatus } from '../utils/marketStatus';

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'Max';

export const Dashboard: React.FC = () => {
  const { 
    activeTicker, 
    stockData, 
    stockForecast, 
    fundamentalSummary,
    disasterRiskScore,
    fundamentals,
    backtestAccuracy,
    fetchStockData, 
    isLoadingData, 
    errorData,
    watchlist,
    portfolioValue,
    chatHistory,
    isChatLoading,
    sendAdvisorMessage,
    marketIndex,
  } = useFinance();

  const [timeRange, setTimeRange] = useState<TimeRange>('Max');
  const [copilotInput, setCopilotInput] = useState('');
  const copilotEndRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const marketChartContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const formatDateForChart = (dateVal: any) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    copilotEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

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
      crosshair: {
        mode: 1,
      },
      timeScale: {
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      },
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      },
    });

    const historicalSeries = chart.addSeries(AreaSeries, {
      lineColor: isDark ? '#00c076' : '#059669',
      topColor: isDark ? 'rgba(0, 192, 118, 0.2)' : 'rgba(5, 150, 105, 0.2)',
      bottomColor: 'rgba(0, 0, 0, 0)',
      lineWidth: 2,
      priceLineVisible: false,
    });

    const histData = filterByTimeRange(stockData || [])
      .map(d => ({
        time: formatDateForChart(d.Date || d.date),
        value: Number(d.Close || d.close || 0),
      }))
      .filter(item => item.time !== '');

    if (histData.length > 0) {
      historicalSeries.setData(histData);
    }

    if (stockForecast && stockForecast.length > 0 && (timeRange === '6M' || timeRange === '1Y' || timeRange === 'Max')) {
      const forecastSeries = chart.addSeries(LineSeries, {
        color: '#e8a800',
        lineWidth: 2,
        lineStyle: 1, // LineStyle.Dashed
        priceLineVisible: false,
      });

      const foreData = [];
      const lastHist = histData[histData.length - 1];
      if (lastHist) {
        foreData.push({
          time: lastHist.time,
          value: lastHist.value,
        });
      }

      stockForecast.forEach(f => {
        const timeStr = formatDateForChart(f.Date);
        if (timeStr) {
          foreData.push({
            time: timeStr,
            value: Number(f.PredictedClose || 0),
          });
        }
      });

      if (foreData.length > 0) {
        forecastSeries.setData(foreData);
      }

      const upperSeries = chart.addSeries(LineSeries, {
        color: 'rgba(232, 168, 0, 0.35)',
        lineWidth: 1,
        lineStyle: 2, // LineStyle.Dotted
        priceLineVisible: false,
      });
      const lowerSeries = chart.addSeries(LineSeries, {
        color: 'rgba(232, 168, 0, 0.35)',
        lineWidth: 1,
        lineStyle: 2, // LineStyle.Dotted
        priceLineVisible: false,
      });

      const upperData = [];
      const lowerData = [];
      if (lastHist) {
        upperData.push({ time: lastHist.time, value: lastHist.value });
        lowerData.push({ time: lastHist.time, value: lastHist.value });
      }

      stockForecast.forEach(f => {
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
  }, [stockData, stockForecast, timeRange, theme]);

  useEffect(() => {
    if (!marketChartContainerRef.current) return;
    
    marketChartContainerRef.current.innerHTML = '';
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    const chart = createChart(marketChartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: isDark ? '#7a8fa6' : '#64748b',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
        horzLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
      },
      crosshair: {
        mode: 1,
      },
      timeScale: {
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      },
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      },
    });

    const indexSeries = chart.addSeries(AreaSeries, {
      lineColor: '#3b82f6',
      topColor: 'rgba(59, 130, 246, 0.2)',
      bottomColor: 'rgba(0, 0, 0, 0)',
      lineWidth: 2,
      priceLineVisible: false,
    });

    const indexData = filterByTimeRange(marketIndex || [])
      .map(d => ({
        time: formatDateForChart(d.date),
        value: Number(d.value || 0),
      }))
      .filter(item => item.time !== '');

    if (indexData.length > 0) {
      indexSeries.setData(indexData);
    }

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

  // ─── Filter historical data by time range ───────────────────────────
  const filterByTimeRange = (data: any[]) => {
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
      const date = new Date(d.Date || d.date);
      return date >= cutoff;
    });
  };

  const filteredHistorical = filterByTimeRange(stockData || []).map(d => ({
    ...d,
    Date: new Date(d.Date).toLocaleDateString(),
    type: 'historical'
  }));

  const combinedData = [...filteredHistorical];

  if (stockForecast && stockForecast.length > 0 && (timeRange === '6M' || timeRange === '1Y' || timeRange === 'Max')) {
    const lastHist = combinedData[combinedData.length - 1];
    if (lastHist) {
      combinedData.push({
        Date: lastHist.Date,
        Close: lastHist.Close,
        PredictedClose: lastHist.Close,
        UpperBand: lastHist.Close,
        LowerBand: lastHist.Close,
        type: 'bridge'
      });
    }
    stockForecast.forEach(f => {
      combinedData.push({
        Date: new Date(f.Date).toLocaleDateString(),
        PredictedClose: f.PredictedClose,
        UpperBand: f.UpperBand,
        LowerBand: f.LowerBand,
        type: 'forecast'
      });
    });
  }

  const currentPrice = stockData?.length > 0 ? stockData[stockData.length - 1].Close : 0;
  const previousPrice = stockData?.length > 1 ? stockData[stockData.length - 2].Close : 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePct = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  const formatPrice = (val: number) => {
    if (val > 500) return `₹${val.toLocaleString('en-IN', {maximumFractionDigits: 2})}`;
    return `$${val.toFixed(2)}`;
  };



  return (
    <>
      {/* ERROR BANNER */}
      {errorData && (
        <div style={{ padding: '12px 18px', background: 'var(--red-bg)', color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: '11px', border: '1px solid var(--red)', marginBottom: '12px' }}>
          {errorData}
        </div>
      )}

      {/* STAT STRIP */}
      <div className="stat-strip">
        <div className="stat-cell">
          <div className="stat-cell-label">Portfolio Value</div>
          <div className="stat-cell-val">₹{portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="stat-cell-chg up"><span>▲</span> 0.00%</div>
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
            {stockForecast && stockForecast.length > 0 
              ? formatPrice(stockForecast[stockForecast.length - 1].PredictedClose)
              : 'N/A'}
          </div>
          <div className="stat-cell-chg amber"><span>AI Target</span></div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">Model Accuracy</div>
          <div className="stat-cell-val">{backtestAccuracy ? `${backtestAccuracy.toFixed(1)}%` : 'N/A'}</div>
          <div className="stat-cell-chg up"><span>Trained on Historicals</span></div>
        </div>
        <div className="stat-cell highlight">
          <div className="stat-cell-label">Disaster Risk</div>
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
              <div className="panel-title"><span className="panel-title-dot"></span>{activeTicker} PRICE & FORECAST</div>
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
                <div className="cs-label">24H CHANGE</div>
                <div className={`cs-val ${isPositive ? 'up' : 'dn'}`}>{isPositive ? '+' : ''}{priceChange.toFixed(2)}</div>
              </div>
              {fundamentals && fundamentals.fifty_two_week_high !== 'N/A' && (
                <div className="cs-item" style={{ marginTop: '10px' }}>
                  <div className="cs-label">52W HIGH</div>
                  <div className="cs-val">₹{fundamentals.fifty_two_week_high}</div>
                </div>
              )}
            </div>

            <div className="chart-area" style={{ height: '350px' }}>
              {isLoadingData ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', fontFamily: 'var(--mono)', fontSize: '11px' }}>
                  FETCHING DATA & TRAINING MODEL...
                </div>
              ) : (
                <div 
                  ref={chartContainerRef} 
                  style={{ width: '100%', height: '320px' }} 
                />
              )}
            </div>
            <div className="chart-legend">
              <div className="leg"><div className="leg-sq" style={{ background: 'var(--green)' }}></div> HISTORICAL</div>
              <div className="leg"><div className="leg-sq" style={{ background: 'var(--amber)' }}></div> FORECAST MEDIAN</div>
              <div className="leg"><div className="leg-sq" style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber)' }}></div> CONFIDENCE BAND</div>
            </div>
          </div>

          {/* Market Index (Nifty 50) Chart */}
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
              <div 
                ref={marketChartContainerRef} 
                style={{ width: '100%', height: '290px' }} 
              />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="panel-title"><span className="panel-title-dot"></span>WATCHLIST</div>
            <div className="panel-badge badge-blue">EDIT</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {watchlist.map(item => (
              <div className="wl-item" key={item.ticker} onClick={() => handleTickerClick(item.ticker)}>
                <div className="wl-sym">{item.ticker.replace('.NS','')}</div>
                <div className="wl-name">{item.exchange || 'NSE'}</div>
                <div className="wl-price">₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                <div className={`wl-chg ${item.changePct >= 0 ? 'up' : 'dn'}`}>
                  {item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GRID ROW 2: Fundamentals & Copilot */}
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
          </div>
          <div style={{ padding: '16px', fontFamily: 'var(--sans)', fontSize: '13.5px', color: 'var(--tx2)', lineHeight: 1.6 }}>
            {fundamentalSummary || 'Select a ticker and run analysis to view the fundamental summary.'}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="panel-title"><span className="panel-title-dot"></span>AURA COPILOT</div>
            <div className="panel-badge badge-amber">AI</div>
          </div>
          <div className="copilot-msgs">
            <div className="msg">
              <div className="msg-tag ai">SYS</div>
              <div className="msg-body">Hello. I am Aura. How can I assist you with your portfolio today?</div>
            </div>
            {chatHistory.map((msg) => (
              <div className="msg" key={msg.id}>
                <div className={`msg-tag ${msg.sender === 'user' ? 'usr' : 'ai'}`}>
                  {msg.sender === 'user' ? 'YOU' : 'AI'}
                </div>
                <div className="msg-body">{msg.content}</div>
              </div>
            ))}
            {isChatLoading && (
              <div className="msg">
                <div className="msg-tag ai">AI</div>
                <div className="msg-body" style={{ opacity: 0.5 }}>Thinking...</div>
              </div>
            )}
            <div ref={copilotEndRef} />
          </div>
          <div className="copilot-chips">
            <div className="chip" onClick={() => sendAdvisorMessage(`Explain ${activeTicker} forecast`)}>Explain {activeTicker} forecast</div>
            <div className="chip" onClick={() => sendAdvisorMessage('Show me market trends')}>Show me market trends</div>
          </div>
          <div className="copilot-input-row">
            <input
              type="text"
              placeholder="Type a message..."
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && copilotInput.trim() && !isChatLoading) {
                  sendAdvisorMessage(copilotInput.trim());
                  setCopilotInput('');
                }
              }}
              disabled={isChatLoading}
            />
            <button
              className="copilot-send"
              disabled={isChatLoading || !copilotInput.trim()}
              onClick={() => {
                if (copilotInput.trim() && !isChatLoading) {
                  sendAdvisorMessage(copilotInput.trim());
                  setCopilotInput('');
                }
              }}
            >
              SEND
            </button>
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
