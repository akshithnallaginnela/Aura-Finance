import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'Max';

export const Dashboard: React.FC = () => {
  const { 
    activeTicker, 
    stockData, 
    stockForecast, 
    fundamentalSummary,
    disasterRiskScore,
    lastUpdated,
    fundamentals,
    backtestAccuracy,
    fetchStockData, 
    isLoadingData, 
    errorData,
    watchlist,
    marketIndex,
    portfolioValue,
  } = useFinance();

  const [timeRange, setTimeRange] = useState<TimeRange>('Max');

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'var(--bg1)',
          border: '1px solid var(--line)',
          padding: '8px 12px',
          color: 'var(--tx)',
          fontFamily: 'var(--mono)',
          fontSize: '11px'
        }}>
          <p style={{ color: 'var(--tx3)', marginBottom: '4px' }}>{data.Date}</p>
          {data.Close && (
            <p style={{ color: 'var(--green)', fontWeight: 600 }}>
              Actual: {formatPrice(data.Close)}
            </p>
          )}
          {data.PredictedClose && (
            <p style={{ color: 'var(--amber)', fontWeight: 600 }}>
              Forecast: {formatPrice(data.PredictedClose)}
            </p>
          )}
        </div>
      );
    }
    return null;
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
        <div className="stat-cell">
          <div className="stat-cell-label">Market Status</div>
          <div className="stat-cell-val up">OPEN</div>
          <div className="stat-cell-chg up"><span>Live updating</span></div>
        </div>
      </div>

      {/* GRID ROW 1: Chart & Watchlist */}
      <div className="row row-3-1">
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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--green)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--green)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--amber)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--amber)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis 
                    dataKey="Date" 
                    stroke="var(--tx3)" 
                    fontSize={9} 
                    fontFamily="var(--mono)"
                    tickMargin={10}
                    minTickGap={50}
                    axisLine={{ stroke: 'var(--line)' }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="var(--tx3)" 
                    fontSize={9} 
                    fontFamily="var(--mono)"
                    tickFormatter={fmt => currentPrice > 500 ? `₹${fmt}` : `$${fmt}`}
                    domain={['auto', 'auto']}
                    width={50}
                    axisLine={false}
                    tickLine={false}
                    orientation="right"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="Close" 
                    stroke="var(--green)" 
                    strokeWidth={1.5}
                    fillOpacity={1} 
                    fill="url(#colorClose)" 
                    connectNulls
                  />
                  <Area 
                    type="monotone" 
                    dataKey="UpperBand" 
                    stroke="none"
                    fillOpacity={0} 
                    fill="transparent" 
                    connectNulls
                  />
                  <Area 
                    type="monotone" 
                    dataKey="LowerBand" 
                    stroke="none"
                    fillOpacity={0.1} 
                    fill="var(--amber)" 
                    connectNulls
                  />
                  <Area 
                    type="monotone" 
                    dataKey="PredictedClose" 
                    stroke="var(--amber)" 
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#colorPred)" 
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="chart-legend">
            <div className="leg"><div className="leg-sq" style={{ background: 'var(--green)' }}></div> HISTORICAL</div>
            <div className="leg"><div className="leg-sq" style={{ background: 'var(--amber)' }}></div> FORECAST MEDIAN</div>
            <div className="leg"><div className="leg-sq" style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber)' }}></div> CONFIDENCE BAND</div>
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
          <div style={{ padding: '14px', fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--tx2)', lineHeight: 1.6 }}>
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
          </div>
          <div className="copilot-chips">
            <div className="chip">Explain {activeTicker} forecast</div>
            <div className="chip">Show me market trends</div>
          </div>
          <div className="copilot-input-row">
            <input type="text" placeholder="Type a message..." />
            <button className="copilot-send">SEND</button>
          </div>
        </div>
      </div>
    </>
  );
};
