import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';

interface ScreenerData {
  ticker: string;
  sentiment: number;
  risk: number;
  accuracy: number;
  pe: number | string;
  market_cap: number | string;
  last_updated: string;
}

export const Screener: React.FC = () => {
  const [data, setData] = useState<ScreenerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const { fetchStockData, setActiveView } = useFinance();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchScreener = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/screener`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Screener fetch error', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScreener();
  }, [BACKEND_URL]);

  const handleTickerClick = (ticker: string) => {
    fetchStockData(ticker);
    setActiveView('dashboard');
  };

  const filteredData = data.filter(d => 
    d.ticker.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="panel" style={{ margin: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: 'var(--tx)' }}>Market Screener</h2>
        <input 
          type="text" 
          placeholder="Filter by ticker..." 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--br)',
            background: 'var(--bg2)',
            color: 'var(--tx)',
            width: '200px'
          }}
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--tx3)' }}>Loading screener data...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--tx)' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--br)' }}>
                <th style={{ padding: '12px' }}>Ticker</th>
                <th style={{ padding: '12px' }}>AI Sentiment</th>
                <th style={{ padding: '12px' }}>Disaster Risk</th>
                <th style={{ padding: '12px' }}>Accuracy</th>
                <th style={{ padding: '12px' }}>P/E Ratio</th>
                <th style={{ padding: '12px' }}>Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(d => (
                <tr key={d.ticker} style={{ borderBottom: '1px solid var(--br2)' }}>
                  <td 
                    style={{ padding: '12px', color: 'var(--amber)', cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => handleTickerClick(d.ticker)}
                  >
                    {d.ticker.replace('.NS', '')}
                  </td>
                  <td style={{ padding: '12px', color: d.sentiment > 0 ? 'var(--emerald)' : d.sentiment < 0 ? 'var(--rose)' : 'var(--tx2)' }}>
                    {d.sentiment.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', color: d.risk > 0.5 ? 'var(--rose)' : 'var(--emerald)' }}>
                    {(d.risk * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '12px' }}>{d.accuracy.toFixed(1)}%</td>
                  <td style={{ padding: '12px' }}>{d.pe}</td>
                  <td style={{ padding: '12px' }}>
                    {typeof d.market_cap === 'number' ? (d.market_cap / 1e12).toFixed(2) + 'T' : d.market_cap}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--tx3)' }}>No stocks match your filter.</div>
          )}
        </div>
      )}
    </div>
  );
};
