import React, { useState, useEffect, useRef } from 'react';
import { createChart, AreaSeries } from '@pipsend/charts';
import { useTheme } from '../context/ThemeContext';
import { Globe, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  const { theme } = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Fetch macro items list
  useEffect(() => {
    const fetchMacro = async () => {
      try {
        setError(null);
        const res = await fetch(`${BACKEND_URL}/api/macro`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (json.length > 0) {
            setSelectedTicker(json[0].ticker);
          }
        } else {
          throw new Error('Failed to fetch macro items');
        }
      } catch (err: any) {
        let friendlyMessage = err.message || 'Macro fetch error';
        if (friendlyMessage.toLowerCase().includes('failed to fetch') || friendlyMessage.toLowerCase().includes('networkerror') || friendlyMessage.toLowerCase().includes('load failed')) {
          friendlyMessage = 'Sorry, I am having trouble connecting to the backend. Please check if the backend service is running and accessible.';
        }
        setError(friendlyMessage);
        console.error('Macro fetch error', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMacro();
  }, [BACKEND_URL]);

  // Fetch chart data when selectedTicker changes
  useEffect(() => {
    if (!selectedTicker) return;

    const fetchChart = async () => {
      setIsLoadingChart(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/macro/chart/${encodeURIComponent(selectedTicker)}`);
        if (res.ok) {
          const json = await res.json();
          setChartData(json);
        }
      } catch (err) {
        console.error('Error fetching macro chart data:', err);
      } finally {
        setIsLoadingChart(false);
      }
    };
    fetchChart();
  }, [selectedTicker, BACKEND_URL]);

  // Render chart
  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

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

    chartInstanceRef.current = chart;

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#2563eb', // Blue series for macro
      topColor: 'rgba(37, 99, 235, 0.2)',
      bottomColor: 'rgba(0, 0, 0, 0)',
      lineWidth: 2,
      priceLineVisible: false,
    });

    const formattedData = chartData
      .map((d: any) => {
        try {
          const dt = new Date(d.date);
          if (isNaN(dt.getTime())) return null;
          const yyyy = dt.getFullYear();
          const mm = String(dt.getMonth() + 1).padStart(2, '0');
          const dd = String(dt.getDate()).padStart(2, '0');
          return {
            time: `${yyyy}-${mm}-${dd}`,
            value: Number(d.value || 0),
          };
        } catch {
          return null;
        }
      })
      .filter((item: any) => item !== null && item.time !== '');

    if (formattedData.length > 0) {
      areaSeries.setData(formattedData as any[]);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.resize(chartContainerRef.current.clientWidth, chartContainerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, [chartData, theme]);

  const selectedItem = data.find(item => item.ticker === selectedTicker);

  const getSymbolPrefix = (ticker: string) => {
    if (ticker.includes('INR')) return '₹';
    if (ticker === 'BTC-USD') return '₿';
    return '$';
  };

  const getMacroDescription = (ticker: string) => {
    switch (ticker) {
      case '^GSPC':
        return 'The S&P 500 Index tracks the performance of 500 leading companies listed on US stock exchanges, serving as a primary indicator of global equity market health.';
      case '^IXIC':
        return 'The Nasdaq Composite Index is heavily weighted toward high-growth technology, hardware, and biotechnology firms. It acts as a benchmark for the global tech sector.';
      case '^FTSE':
        return 'The FTSE 100 Index represents the 100 largest companies listed on the London Stock Exchange, representing the health of the UK and European blue-chip markets.';
      case '^N225':
        return 'The Nikkei 225 is a price-weighted index representing Japan\'s top 225 blue-chip companies, serving as the primary gauge of the Asian financial market.';
      case 'USDINR=X':
        return 'The USD/INR currency exchange pair tracks the exchange rate of United States Dollars against Indian Rupees. Crucial for understanding foreign institutional flows (FII).';
      case 'BTC-USD':
        return 'Bitcoin to USD exchange rate represents the flagship digital asset, reflecting risk-on/risk-off sentiment across secondary capital markets and speculative assets.';
      default:
        return 'Global economic indicator representing macroeconomic asset trends and institutional capital distributions.';
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', margin: '20px', width: 'calc(100% - 40px)', alignItems: 'stretch', height: 'calc(100vh - 130px)' }}>
      {/* LEFT COLUMN: Macro Grid */}
      <div className="panel" style={{ flex: '1.2 1 50%', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Globe size={20} color="var(--amber)" />
          <h2 style={{ margin: 0, color: 'var(--tx)', fontSize: '1.4rem', fontWeight: 800 }}>Global Macro View</h2>
        </div>

        {error && (
          <div style={{ padding: '12px 18px', background: 'var(--red-bg)', color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: '11px', border: '1px solid var(--red)', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--tx3)', fontFamily: 'var(--mono)', fontSize: '11px' }}>LOADING MACRO ASSETS...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--tx3)' }}>
            Unable to load macro assets. Connection to backend failed.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {data.map(item => {
              const isSelected = selectedTicker === item.ticker;
              const isUp = item.change >= 0;
              return (
                <div 
                  key={item.ticker} 
                  onClick={() => setSelectedTicker(item.ticker)}
                  style={{ 
                    padding: '16px', 
                    borderRadius: '8px', 
                    border: isSelected ? '1px solid var(--amber)' : '1px solid var(--br)', 
                    background: isSelected ? 'var(--bg3)' : 'var(--bg2)', 
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isSelected ? '0 4px 12px rgba(232,168,0,0.1)' : 'none'
                  }}
                  className="wl-item"
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--tx3)', fontSize: '0.75rem', fontFamily: 'var(--mono)' }}>{item.ticker}</span>
                      {isUp ? (
                        <ArrowUpRight size={14} color="var(--emerald)" />
                      ) : (
                        <ArrowDownRight size={14} color="var(--rose)" />
                      )}
                    </div>
                    <div style={{ color: 'var(--tx)', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                      {getSymbolPrefix(item.ticker)}
                      {item.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ color: isUp ? 'var(--emerald)' : 'var(--rose)', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '2px', display: 'flex', gap: '4px' }}>
                      <span>{isUp ? '+' : ''}{item.change.toFixed(2)}</span>
                      <span>({isUp ? '+' : ''}{item.changePct.toFixed(2)}%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Interactive Chart details */}
      <div className="panel" style={{ flex: '1 1 50%', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        {selectedItem ? (
          <>
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--tx)' }}>{selectedItem.name}</h3>
                  <div style={{ color: 'var(--tx3)', fontSize: '0.8rem', fontFamily: 'var(--mono)', marginTop: '2px' }}>GLOBAL INDEX TICKER: {selectedItem.ticker}</div>
                </div>
                <div style={{ padding: '4px 8px', background: 'var(--blue-bg)', color: 'var(--blue)', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Macro
                </div>
              </div>
            </div>

            {/* CHART */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontFamily: 'var(--mono)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Historical Chart (3 Months)</span>
                {selectedItem.change >= 0 ? (
                  <span style={{ color: 'var(--emerald)' }}>▲ Market Positive</span>
                ) : (
                  <span style={{ color: 'var(--rose)' }}>▼ Market Negative</span>
                )}
              </div>
              
              <div className="chart-area" style={{ height: '240px', padding: 0, position: 'relative', background: 'transparent' }}>
                {isLoadingChart ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', fontFamily: 'var(--mono)', fontSize: '10px' }}>
                    LOADING MACRO HISTORICALS...
                  </div>
                ) : (
                  <div ref={chartContainerRef} style={{ width: '100%', height: '240px' }} />
                )}
              </div>
            </div>

            {/* STATS & SUMMARY */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div style={{ border: '1px solid var(--line)', padding: '10px', borderRadius: '6px', background: 'var(--bg2)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--tx3)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>LAST CLOSE</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--tx)', marginTop: '4px' }}>
                    {getSymbolPrefix(selectedItem.ticker)}
                    {selectedItem.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ border: '1px solid var(--line)', padding: '10px', borderRadius: '6px', background: 'var(--bg2)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--tx3)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>NET CHANGE</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: selectedItem.change >= 0 ? 'var(--emerald)' : 'var(--rose)', marginTop: '4px' }}>
                    {selectedItem.change >= 0 ? '+' : ''}
                    {selectedItem.change.toFixed(2)}
                  </div>
                </div>
                <div style={{ border: '1px solid var(--line)', padding: '10px', borderRadius: '6px', background: 'var(--bg2)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--tx3)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>PCT CHANGE</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: selectedItem.change >= 0 ? 'var(--emerald)' : 'var(--rose)', marginTop: '4px' }}>
                    {selectedItem.change >= 0 ? '+' : ''}
                    {selectedItem.changePct.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg1)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)', lineHeight: 1.6, fontSize: '0.85rem', color: 'var(--tx2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: 600, color: 'var(--tx)' }}>
                  <Activity size={14} color="var(--blue)" />
                  Significance Overview
                </div>
                {getMacroDescription(selectedItem.ticker)}
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--tx3)', textAlign: 'center' }}>
            <Globe size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <h3>No Macro Asset Selected</h3>
            <p style={{ maxWidth: '250px', fontSize: '0.9rem' }}>Select a global asset from the grid to load historical charts and economic significance reports.</p>
          </div>
        )}
      </div>
    </div>
  );
};
