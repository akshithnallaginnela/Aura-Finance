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
  AlertCircle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    activeTicker, 
    stockData, 
    stockForecast, 
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-card)',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{data.Date}</p>
          {data.Close && (
            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Actual: ${data.Close.toFixed(2)}
            </p>
          )}
          {data.PredictedClose && (
            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
              Forecast: ${data.PredictedClose.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Ticker Search Bar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="glass-input" 
              placeholder="Search Ticker (e.g. AAPL, TSLA, MSFT)..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              style={{ paddingLeft: '48px', width: '100%', maxWidth: '400px' }}
            />
          </div>
          <button type="submit" className="glass-btn" disabled={isLoadingData}>
            {isLoadingData ? 'Loading...' : 'Analyze Asset'}
          </button>
        </form>
      </div>

      {errorData && (
        <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle color="var(--accent-danger)" />
          <span style={{ color: 'var(--accent-danger)' }}>{errorData}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <section className="kpi-grid">
        <div className="glass-panel kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.1)' }}>
            <Activity size={24} color="var(--accent-primary)" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Active Ticker</span>
            <span className="kpi-value">{activeTicker}</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.1)' }}>
            <TrendingUp size={24} color="var(--accent-secondary)" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Current Price</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <span className="kpi-value">${currentPrice.toFixed(2)}</span>
              <span style={{ 
                fontSize: '0.85rem', 
                fontWeight: '600', 
                color: isPositive ? 'var(--accent-success)' : 'var(--accent-danger)',
                display: 'flex',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(priceChangePct).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
            <Activity size={24} color="var(--accent-primary)" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">30-Day ML Forecast</span>
            <span className="kpi-value">
              {stockForecast && stockForecast.length > 0 
                ? `$${stockForecast[stockForecast.length - 1].PredictedClose.toFixed(2)}` 
                : 'N/A'}
            </span>
          </div>
        </div>
      </section>

      {/* Chart Section */}
      <section className="glass-panel" style={{ padding: '24px', flex: 1, minHeight: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Price History & Random Forest Prediction</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Last 1 Year + 30 Days</span>
        </div>
        
        {isLoadingData ? (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Fetching market data & training model...
          </div>
        ) : (
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" vertical={false} />
                <XAxis 
                  dataKey="Date" 
                  stroke="var(--text-dim)" 
                  fontSize={12} 
                  tickMargin={10}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="var(--text-dim)" 
                  fontSize={12} 
                  tickFormatter={fmt => `$${fmt}`}
                  domain={['auto', 'auto']}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="Close" 
                  stroke="var(--accent-secondary)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorClose)" 
                  connectNulls
                />
                <Area 
                  type="monotone" 
                  dataKey="PredictedClose" 
                  stroke="var(--accent-primary)" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
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
