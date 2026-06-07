import React, { useState, useEffect } from 'react';

interface MacroItem {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

export const MacroView: React.FC = () => {
  const [data, setData] = useState<MacroItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchMacro = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/macro`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Macro fetch error', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMacro();
  }, [BACKEND_URL]);

  return (
    <div className="panel" style={{ margin: '20px', padding: '24px' }}>
      <h2 style={{ marginBottom: '20px', color: 'var(--tx)' }}>Global Macro Overview</h2>
      
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--tx3)' }}>Loading macro data...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {data.map(item => (
            <div key={item.ticker} className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--br)', background: 'var(--bg2)' }}>
              <div style={{ color: 'var(--tx3)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>{item.ticker}</div>
              <div style={{ color: 'var(--tx)', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '4px' }}>{item.name}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>
                {item.ticker.includes('INR') ? '₹' : item.ticker === 'BTC-USD' ? '₿' : '$'}
                {item.price.toLocaleString()}
              </div>
              <div style={{ color: item.change >= 0 ? 'var(--emerald)' : 'var(--rose)', fontWeight: 'bold' }}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePct.toFixed(2)}%)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
