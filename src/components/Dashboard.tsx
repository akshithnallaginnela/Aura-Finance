import React, { useState } from 'react';
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
  ArrowDownRight
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    activeTicker, 
    stockData, 
    stockForecast, 
    sentimentScore,
    fundamentalSummary,
    lastUpdated,
    fetchStockData, 
    isLoadingData, 
    errorData 
  } = useFinance();

  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchStockData(searchInput.trim());
      setSearchInput('');
    }
  };

  // Combine historical and forecast for the chart
  const combinedData = [...(stockData || [])].map(d => ({
    ...d,
    Date: new Date(d.Date).toLocaleDateString(),
    type: 'historical'
  }));

  if (stockForecast && stockForecast.length > 0) {
    const lastHist = combinedData[combinedData.length - 1];
    if (lastHist) {
      combinedData.push({
        Date: lastHist.Date,
        Close: lastHist.Close,
        PredictedClose: lastHist.Close,
        type: 'bridge'
      });
    }
    stockForecast.forEach(f => {
      combinedData.push({
        Date: new Date(f.Date).toLocaleDateString(),
        PredictedClose: f.PredictedClose,
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
              Forecast: {formatPrice(data.PredictedClose)}
            </p>
          )}
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
            <Activity size={22} color="var(--accent-primary)" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Active Ticker</span>
            <span className="kpi-value">{activeTicker}</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: isPositive ? 'var(--accent-success-light)' : 'var(--accent-danger-light)' }}>
            {isPositive ? <TrendingUp size={22} color="var(--accent-success)" /> : <TrendingDown size={22} color="var(--accent-danger)" />}
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Current Price</span>
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
            <span className="kpi-label">30-Day ML Forecast</span>
            <span className="kpi-value">
              {stockForecast && stockForecast.length > 0 
                ? formatPrice(stockForecast[stockForecast.length - 1].PredictedClose)
                : 'N/A'}
            </span>
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
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Powered by Gemini AI</span>
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

      {/* Chart Section */}
      <section className="glass-panel" style={{ padding: '28px', flex: 1, minHeight: '420px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Price History & ML Prediction</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Last 1 year + 30-day Random Forest forecast</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 12, height: 3, borderRadius: 2, background: 'var(--accent-secondary)' }} />
              <span style={{ color: 'var(--text-dim)' }}>Historical</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 12, height: 3, borderRadius: 2, background: 'var(--accent-primary)', opacity: 0.7 }} />
              <span style={{ color: 'var(--text-dim)' }}>Forecast</span>
            </div>
          </div>
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
          <div style={{ height: '320px', width: '100%' }}>
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
                  fontSize={12} 
                  tickMargin={10}
                  minTickGap={40}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickFormatter={fmt => currentPrice > 500 ? `₹${fmt}` : `$${fmt}`}
                  domain={['auto', 'auto']}
                  width={70}
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
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
};
