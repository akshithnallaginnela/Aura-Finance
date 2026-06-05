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
import { 
  TrendingUp,
  TrendingDown,
  Search,
  Activity,
  AlertCircle,
  Newspaper,
  Clock,
  Brain,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
} from 'lucide-react';

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'Max';

export const Dashboard: React.FC = () => {
  const { 
    activeTicker, 
    stockData, 
    stockForecast, 
    sentimentScore,
    fundamentalSummary,
    disasterRiskScore,
    lastUpdated,
    fetchStockData, 
    isLoadingData, 
    errorData,
    watchlist,
    marketIndex,
    portfolioValue,
  } = useFinance();

  const [searchInput, setSearchInput] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('Max');
  const tickerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchStockData(searchInput.trim());
      setSearchInput('');
    }
  };

  const handleTickerClick = (ticker: string) => {
    fetchStockData(`${ticker}.NS`);
  };

  // ─── Flash animation reset ──────────────────────────────────────────
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    watchlist.forEach(item => {
      const el = tickerRefs.current.get(item.ticker);
      if (el && item.flashClass) {
        // Remove class first to restart animation
        el.classList.remove('price-up', 'price-down');
        // Force reflow
        void el.offsetWidth;
        el.classList.add(item.flashClass);
        const timer = setTimeout(() => {
          el.classList.remove('price-up', 'price-down');
        }, 800);
        timers.push(timer);
      }
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, [watchlist]);

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

  // Combine historical and forecast for the chart
  const allHistorical = [...(stockData || [])].map(d => ({
    ...d,
    Date: new Date(d.Date).toLocaleDateString(),
    type: 'historical'
  }));

  const filteredHistorical = filterByTimeRange(stockData || []).map(d => ({
    ...d,
    Date: new Date(d.Date).toLocaleDateString(),
    type: 'historical'
  }));

  const combinedData = [...filteredHistorical];

  // Only show forecast on longer time ranges
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
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>{data.Date}</p>
          {data.Close && (
            <p style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Actual: {formatPrice(data.Close)}
            </p>
          )}
          {data.PredictedClose && (
            <p style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
              Forecast (Median): {formatPrice(data.PredictedClose)}
            </p>
          )}
          {data.UpperBand && data.LowerBand && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Band: {formatPrice(data.LowerBand)} — {formatPrice(data.UpperBand)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const MarketTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>{data.date}</p>
          <p style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
            ₹{data.value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  // Sentiment helpers
  const getSentimentLabel = (score: number | null) => {
    if (score === null || score === undefined) return 'Neutral';
    if (score >= 0.5) return 'Very Bullish';
    if (score >= 0.2) return 'Bullish';
    if (score > -0.2) return 'Neutral';
    if (score > -0.5) return 'Bearish';
    return 'Very Bearish';
  };

  const getSentimentColor = (score: number | null) => {
    if (score === null || score === undefined) return 'var(--text-muted)';
    if (score > 0) return 'var(--accent-success)';
    if (score < 0) return 'var(--accent-danger)';
    return 'var(--text-muted)';
  };

  const getSentimentBg = (score: number | null) => {
    if (score === null || score === undefined) return 'var(--bg-panel)';
    if (score > 0) return 'var(--accent-success-light)';
    if (score < 0) return 'var(--accent-danger-light)';
    return 'var(--bg-panel)';
  };

  const timeRanges: TimeRange[] = ['1W', '1M', '3M', '6M', '1Y', 'Max'];

  const marketLatest = marketIndex.length > 0 ? marketIndex[marketIndex.length - 1].value : 0;
  const marketPrev = marketIndex.length > 1 ? marketIndex[marketIndex.length - 2].value : 0;
  const marketChange = marketLatest - marketPrev;
  const marketChangePct = marketPrev > 0 ? (marketChange / marketPrev) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '460px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="text" 
              className="glass-input" 
              placeholder="Search ticker (e.g. RELIANCE.NS, TCS.NS, AAPL)..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              style={{ paddingLeft: '42px' }}
            />
          </div>
          <button type="submit" className="glass-btn" disabled={isLoadingData}>
            {isLoadingData ? 'Analyzing...' : 'Analyze Asset'}
          </button>
        </form>
      </div>

      {/* Error Banner */}
      {errorData && (
        <div className="glass-panel" style={{ 
          padding: '14px 20px', 
          borderLeft: '4px solid var(--accent-danger)', 
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'var(--accent-danger-light)'
        }}>
          <AlertCircle size={18} color="var(--accent-danger)" />
          <span style={{ color: 'var(--accent-danger)', fontSize: '0.9rem', fontWeight: 500 }}>{errorData}</span>
        </div>
      )}

      {/* KPI Cards */}
      <section className="kpi-grid">
        <div className="glass-panel kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'var(--accent-primary-light)' }}>
            <Wallet size={22} color="var(--accent-primary)" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Portfolio Value</span>
            <span className="kpi-value">₹{portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: isPositive ? 'var(--accent-success-light)' : 'var(--accent-danger-light)' }}>
            {isPositive ? <TrendingUp size={22} color="var(--accent-success)" /> : <TrendingDown size={22} color="var(--accent-danger)" />}
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Current Price ({activeTicker})</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span className="kpi-value">{formatPrice(currentPrice)}</span>
              <span style={{ 
                fontSize: '0.82rem', fontWeight: 600,
                color: isPositive ? 'var(--accent-success)' : 'var(--accent-danger)',
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                padding: '3px 8px', borderRadius: 'var(--radius-full)',
                background: isPositive ? 'var(--accent-success-light)' : 'var(--accent-danger-light)'
              }}>
                {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {Math.abs(priceChangePct).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'var(--accent-primary-light)' }}>
            <BarChart3 size={22} color="var(--accent-primary)" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">6-Month Ensemble Forecast</span>
            <span className="kpi-value">
              {stockForecast && stockForecast.length > 0 
                ? formatPrice(stockForecast[stockForecast.length - 1].PredictedClose)
                : 'N/A'}
            </span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon-wrapper" style={{ 
            background: disasterRiskScore > 0.3 ? 'var(--accent-danger-light)' : 'var(--accent-success-light)' 
          }}>
            <AlertCircle size={22} color={disasterRiskScore > 0.3 ? 'var(--accent-danger)' : 'var(--accent-success)'} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Disaster Risk</span>
            <span className="kpi-value" style={{ 
              color: disasterRiskScore > 0.3 ? 'var(--accent-danger)' : 'var(--accent-success)' 
            }}>
              {disasterRiskScore > 0.5 ? 'HIGH' : disasterRiskScore > 0.15 ? 'MODERATE' : 'LOW'}
              <span style={{ fontSize: '0.75rem', marginLeft: '6px', opacity: 0.7 }}>
                ({(disasterRiskScore * 100).toFixed(0)}%)
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════ TICKER STRIP ═══════════ */}
      <section className="ticker-strip">
        {watchlist.map((item) => (
          <div
            key={item.ticker}
            ref={el => { if (el) tickerRefs.current.set(item.ticker, el); }}
            className={`glass-panel ticker-card ${activeTicker.replace('.NS', '') === item.ticker ? 'active-ticker' : ''}`}
            onClick={() => handleTickerClick(item.ticker)}
          >
            <div className="ticker-avatar" style={{ background: item.color }}>
              {item.ticker[0]}
            </div>
            <div className="ticker-info">
              <span className="ticker-name">{item.ticker}</span>
              <span className="ticker-exchange">{item.exchange}</span>
              <div className="ticker-price-row">
                <span className="ticker-price">
                  ₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
                <span 
                  className="ticker-change-badge"
                  style={{ 
                    color: item.changePct >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
                    background: item.changePct >= 0 ? 'var(--accent-success-light)' : 'var(--accent-danger-light)'
                  }}
                >
                  {item.changePct >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {Math.abs(item.changePct).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ═══════════ DUAL CHART GRID ═══════════ */}
      <section className="dashboard-grid">
        
        {/* LEFT — Portfolio Holdings & Forecast */}
        <div className="glass-panel chart-panel">
          <div className="chart-panel-header">
            <div>
              <h3 className="chart-panel-title">Portfolio Holdings & Forecast</h3>
              <p className="chart-panel-subtitle">
                {activeTicker} — Ensemble AI prediction with 90% confidence band
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="chart-legend">
                <div className="chart-legend-item">
                  <div className="chart-legend-line" style={{ background: '#0d9488' }} />
                  <span>Historical</span>
                </div>
                <div className="chart-legend-item">
                  <div className="chart-legend-line" style={{ background: '#6366f1' }} />
                  <span>Forecast</span>
                </div>
                <div className="chart-legend-item">
                  <div className="chart-legend-band" style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)' }} />
                  <span>Confidence</span>
                </div>
              </div>
            </div>
          </div>

          <div className="time-range-tabs">
            {timeRanges.map(range => (
              <button 
                key={range}
                className={`time-range-tab ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
          
          {isLoadingData ? (
            <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: 'var(--radius-full)',
                  border: '3px solid var(--border-card)', borderTopColor: 'var(--accent-primary)',
                  animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
                }} />
                <p>Fetching market data & training model...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            </div>
          ) : (
            <div style={{ height: '340px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="Date" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickMargin={10}
                    minTickGap={50}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickFormatter={fmt => currentPrice > 500 ? `₹${fmt}` : `$${fmt}`}
                    domain={['auto', 'auto']}
                    width={65}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="Close" 
                    stroke="#0d9488" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorClose)" 
                    connectNulls
                    isAnimationActive
                    animationDuration={800}
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
                    fillOpacity={0.12} 
                    fill="#6366f1" 
                    connectNulls
                  />
                  <Area 
                    type="monotone" 
                    dataKey="PredictedClose" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    fillOpacity={1} 
                    fill="url(#colorPred)" 
                    connectNulls
                    isAnimationActive
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* RIGHT — Market Overview */}
        <div className="glass-panel chart-panel">
          <div className="chart-panel-header">
            <div>
              <h3 className="chart-panel-title">Market Overview</h3>
              <p className="chart-panel-subtitle">Nifty 50 Index — 90 Day View</p>
            </div>
            <div className="live-indicator">
              <span className="live-dot" />
              Live
            </div>
          </div>

          {/* Market summary */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              ₹{marketLatest.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <span style={{ 
              fontSize: '0.82rem', fontWeight: 600,
              color: marketChange >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: '3px 8px', borderRadius: 'var(--radius-full)',
              background: marketChange >= 0 ? 'var(--accent-success-light)' : 'var(--accent-danger-light)'
            }}>
              {marketChange >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Math.abs(marketChangePct).toFixed(2)}%
            </span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={marketIndex} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMarket" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickMargin={8}
                  minTickGap={40}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10}
                  tickFormatter={v => `${(v/1000).toFixed(1)}k`}
                  domain={['dataMin - 200', 'dataMax + 200']}
                  width={50}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<MarketTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0d9488" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorMarket)"
                  isAnimationActive
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Fundamental Analysis */}
      {!isLoadingData && fundamentalSummary && (
        <section className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                background: 'var(--accent-primary-light)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                <Brain size={18} color="var(--accent-primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>Fundamental Analysis</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>FinBERT + News Intelligence Engine</span>
              </div>
            </div>
            {lastUpdated && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', 
                fontSize: '0.78rem', color: 'var(--text-dim)',
                padding: '6px 12px', borderRadius: 'var(--radius-full)',
                background: 'var(--bg-panel)'
              }}>
                <Clock size={12} />
                <span>Updated {new Date(lastUpdated + 'Z').toLocaleString()}</span>
              </div>
            )}
          </div>
          
          {/* Sentiment + Summary Row */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* Sentiment Score Card */}
            <div style={{ 
              minWidth: '180px', padding: '24px', borderRadius: 'var(--radius-md)',
              background: getSentimentBg(sentimentScore),
              border: '1px solid var(--border-subtle)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Sentiment
              </span>
              <span style={{ 
                fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em',
                color: getSentimentColor(sentimentScore)
              }}>
                {sentimentScore?.toFixed(2) ?? '0.00'}
              </span>
              <span style={{ 
                fontSize: '0.78rem', fontWeight: 600,
                color: getSentimentColor(sentimentScore),
                padding: '3px 10px', borderRadius: 'var(--radius-full)',
                background: 'rgba(255,255,255,0.6)'
              }}>
                {getSentimentLabel(sentimentScore)}
              </span>
            </div>

            {/* Summary */}
            <div style={{ 
              flex: 1, minWidth: '300px', padding: '20px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Newspaper size={16} color="var(--text-dim)" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    News Intelligence Summary
                  </span>
                </div>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  {fundamentalSummary}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
