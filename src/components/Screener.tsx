import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { createChart, AreaSeries } from '@pipsend/charts';
import { useTheme } from '../context/ThemeContext';
import { TrendingUp, AlertTriangle, ShieldCheck, Plus, Trash2 } from 'lucide-react';

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
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedStockDetails, setSelectedStockDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const { fetchStockData, setActiveView, watchlist, setWatchlist } = useFinance();
  const { theme } = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Fetch initial screener data
  useEffect(() => {
    const fetchScreener = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/screener`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (json.length > 0) {
            setSelectedTicker(json[0].ticker);
          }
        }
      } catch (err) {
        console.error('Screener fetch error', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScreener();
  }, [BACKEND_URL]);

  // Fetch details when selectedTicker changes
  useEffect(() => {
    if (!selectedTicker) return;

    const fetchDetails = async () => {
      setIsLoadingDetails(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/stock/${selectedTicker}`);
        if (res.ok) {
          const json = await res.json();
          setSelectedStockDetails(json);
        }
      } catch (err) {
        console.error('Error fetching selected stock details:', err);
      } finally {
        setIsLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [selectedTicker, BACKEND_URL]);

  // Render chart for selected stock
  useEffect(() => {
    if (!chartContainerRef.current || !selectedStockDetails?.historical || selectedStockDetails.historical.length === 0) return;

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
      lineColor: isDark ? '#e8a800' : '#d97706',
      topColor: isDark ? 'rgba(232, 168, 0, 0.2)' : 'rgba(217, 119, 6, 0.2)',
      bottomColor: 'rgba(0, 0, 0, 0)',
      lineWidth: 2,
      priceLineVisible: false,
    });

    const chartData = selectedStockDetails.historical
      .map((d: any) => {
        let dateVal = d.Date || d.date;
        try {
          const dt = new Date(dateVal);
          if (isNaN(dt.getTime())) return null;
          const yyyy = dt.getFullYear();
          const mm = String(dt.getMonth() + 1).padStart(2, '0');
          const dd = String(dt.getDate()).padStart(2, '0');
          return {
            time: `${yyyy}-${mm}-${dd}`,
            value: Number(d.Close || d.close || 0),
          };
        } catch {
          return null;
        }
      })
      .filter((item: any) => item !== null && item.time !== '');

    if (chartData.length > 0) {
      areaSeries.setData(chartData);
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
  }, [selectedStockDetails, theme]);

  const handleTickerClick = (ticker: string) => {
    setSelectedTicker(ticker);
  };

  const handleViewInDashboard = () => {
    if (selectedTicker) {
      fetchStockData(selectedTicker);
      setActiveView('dashboard');
    }
  };

  const toggleWatchlist = () => {
    if (!selectedTicker) return;
    const cleanSym = selectedTicker.replace('.NS', '');
    const inWatchlist = watchlist.some(item => item.ticker === cleanSym);

    if (inWatchlist) {
      // Remove
      setWatchlist(prev => prev.filter(item => item.ticker !== cleanSym));
    } else {
      // Add
      const currentPrice = selectedStockDetails?.historical?.length > 0 
        ? selectedStockDetails.historical[selectedStockDetails.historical.length - 1].Close 
        : 100.0;
      setWatchlist(prev => [
        ...prev,
        {
          ticker: cleanSym,
          name: selectedStockDetails?.fundamentals?.name || cleanSym + ' Ind.',
          exchange: 'NSE',
          price: currentPrice,
          prevPrice: currentPrice,
          change: 0.0,
          changePct: 0.0,
          color: '#3b82f6',
          flashClass: '',
          domain: cleanSym.toLowerCase() + '.com',
          shares: 0,
          avgBuyPrice: 0
        }
      ]);
    }
  };

  const cleanSelectedSym = selectedTicker ? selectedTicker.replace('.NS', '') : '';
  const isSelectedInWatchlist = watchlist.some(item => item.ticker === cleanSelectedSym);

  const filteredData = data.filter(d => 
    d.ticker.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', gap: '20px', margin: '10px 0', width: '100%', alignItems: 'stretch' }}>
      {/* LEFT COLUMN: Table List */}
      <div className="panel" style={{ flex: '3 1 60%', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--tx)', fontSize: '1.4rem', fontWeight: 800 }}>Market Screener</h2>
            <p style={{ color: 'var(--tx3)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Multi-factor filtering across Nifty 50 stocks with model metrics</p>
          </div>
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
              width: '180px',
              outline: 'none',
              fontFamily: 'var(--mono)',
              fontSize: '11px'
            }}
          />
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--tx3)', fontFamily: 'var(--mono)', fontSize: '11px' }}>LOADING SCREENER DATA...</div>
        ) : (
          <div style={{ flex: 1, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--tx)', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--br)', color: 'var(--tx3)' }}>
                  <th style={{ padding: '10px', fontFamily: 'var(--mono)', fontWeight: 600 }}>TICKER</th>
                  <th style={{ padding: '10px', fontFamily: 'var(--mono)', fontWeight: 600 }}>SENTIMENT</th>
                  <th style={{ padding: '10px', fontFamily: 'var(--mono)', fontWeight: 600 }}>DISASTER RISK</th>
                  <th style={{ padding: '10px', fontFamily: 'var(--mono)', fontWeight: 600 }}>ACCURACY</th>
                  <th style={{ padding: '10px', fontFamily: 'var(--mono)', fontWeight: 600, textAlign: 'right' }}>P/E RATIO</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(d => (
                  <tr 
                    key={d.ticker} 
                    onClick={() => handleTickerClick(d.ticker)}
                    style={{ 
                      borderBottom: '1px solid var(--br2)', 
                      cursor: 'pointer',
                      background: selectedTicker === d.ticker ? 'var(--bg2)' : 'transparent',
                      transition: 'background 0.15s'
                    }}
                    className="wl-item"
                  >
                    <td style={{ padding: '12px 10px', color: 'var(--amber)', fontWeight: 'bold' }}>
                      {d.ticker.replace('.NS', '')}
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: 600, color: d.sentiment > 0 ? 'var(--emerald)' : d.sentiment < 0 ? 'var(--rose)' : 'var(--tx2)' }}>
                      {d.sentiment > 0 ? '+' : ''}{d.sentiment.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 10px', color: d.risk > 0.35 ? 'var(--rose)' : d.risk > 0.15 ? 'var(--amber)' : 'var(--emerald)' }}>
                      {(d.risk * 100).toFixed(0)}%
                    </td>
                    <td style={{ padding: '12px 10px' }}>{d.accuracy.toFixed(1)}%</td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{d.pe || 'N/A'}</td>
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

      {/* RIGHT COLUMN: Detail panel with Chart and Metrics */}
      <div className="panel" style={{ flex: '2 1 40%', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        {selectedTicker ? (
          <>
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--tx)' }}>{cleanSelectedSym}</h3>
                  <div style={{ color: 'var(--tx3)', fontSize: '0.85rem', marginTop: '2px' }}>NSE · National Stock Exchange of India</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--tx)' }}>
                    {selectedStockDetails?.historical?.length > 0 
                      ? `₹${selectedStockDetails.historical[selectedStockDetails.historical.length - 1].Close.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                      : '--'}
                  </div>
                  <div style={{ color: 'var(--tx3)', fontSize: '0.75rem', marginTop: '2px', fontFamily: 'var(--mono)' }}>LAST CLOSE PRICE</div>
                </div>
              </div>
            </div>

            {/* CHART */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontFamily: 'var(--mono)' }}>
                3-Month Price Trend
              </div>
              <div className="chart-area" style={{ height: '180px', padding: 0, position: 'relative' }}>
                {isLoadingDetails ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', fontFamily: 'var(--mono)', fontSize: '10px' }}>
                    LOADING CHART DATA...
                  </div>
                ) : (
                  <div ref={chartContainerRef} style={{ width: '100%', height: '180px' }} />
                )}
              </div>
            </div>

            {/* AI METRICS & GAUGES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {/* Sentiment Score Gauge */}
              <div style={{ background: 'var(--bg2)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--tx3)', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>AI SENTIMENT RATING</span>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: selectedStockDetails?.sentiment_score > 0.15 ? 'var(--emerald)' : selectedStockDetails?.sentiment_score < -0.15 ? 'var(--rose)' : 'var(--amber)' 
                  }}>
                    {selectedStockDetails?.sentiment_score > 0.15 ? 'BULLISH' : selectedStockDetails?.sentiment_score < -0.15 ? 'BEARISH' : 'NEUTRAL'} ({selectedStockDetails?.sentiment_score ? (selectedStockDetails.sentiment_score > 0 ? '+' : '') + selectedStockDetails.sentiment_score.toFixed(2) : '0.00'})
                  </span>
                </div>
                {/* Horizontal slider bar */}
                <div style={{ height: '6px', width: '100%', background: 'linear-gradient(to right, var(--rose) 0%, var(--bg3) 50%, var(--emerald) 100%)', borderRadius: '3px', position: 'relative', marginTop: '10px' }}>
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: '-4px', 
                      left: `${((selectedStockDetails?.sentiment_score || 0) + 1) * 50}%`, 
                      width: '14px', 
                      height: '14px', 
                      background: 'var(--tx)', 
                      border: '2px solid var(--bg-elevated)', 
                      borderRadius: '50%', 
                      transform: 'translateX(-50%)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
                    }} 
                  />
                </div>
              </div>

              {/* Disaster Risk rating */}
              <div style={{ background: 'var(--bg2)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--tx3)', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>DISASTER RISK LEVEL</span>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: selectedStockDetails?.disaster_risk_score > 0.35 ? 'var(--rose)' : selectedStockDetails?.disaster_risk_score > 0.15 ? 'var(--amber)' : 'var(--emerald)' 
                  }}>
                    {selectedStockDetails?.disaster_risk_score > 0.35 ? 'CRITICAL' : selectedStockDetails?.disaster_risk_score > 0.15 ? 'WARNING' : 'LOW RISK'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  {selectedStockDetails?.disaster_risk_score > 0.15 ? (
                    <AlertTriangle size={16} color="var(--amber)" style={{ flexShrink: 0 }} />
                  ) : (
                    <ShieldCheck size={16} color="var(--emerald)" style={{ flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: '0.85rem', color: 'var(--tx2)' }}>
                    Risk probability evaluated at {(selectedStockDetails?.disaster_risk_score * 100 || 0).toFixed(0)}%. News scan returned no major disruption red flags.
                  </span>
                </div>
              </div>

              {/* Detailed metrics grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ border: '1px solid var(--line)', padding: '10px', borderRadius: '6px', background: 'var(--bg1)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--tx3)', fontFamily: 'var(--mono)' }}>MODEL ACCURACY</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--tx)', marginTop: '4px' }}>
                    {selectedStockDetails?.backtest_accuracy ? `${selectedStockDetails.backtest_accuracy.toFixed(1)}%` : '--'}
                  </div>
                </div>
                <div style={{ border: '1px solid var(--line)', padding: '10px', borderRadius: '6px', background: 'var(--bg1)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--tx3)', fontFamily: 'var(--mono)' }}>P/E RATIO</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--tx)', marginTop: '4px' }}>
                    {selectedStockDetails?.fundamentals?.pe_ratio || 'N/A'}
                  </div>
                </div>
                <div style={{ border: '1px solid var(--line)', padding: '10px', borderRadius: '6px', background: 'var(--bg1)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--tx3)', fontFamily: 'var(--mono)' }}>EPS (TTM)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--tx)', marginTop: '4px' }}>
                    {selectedStockDetails?.fundamentals?.eps ? `₹${selectedStockDetails.fundamentals.eps}` : 'N/A'}
                  </div>
                </div>
                <div style={{ border: '1px solid var(--line)', padding: '10px', borderRadius: '6px', background: 'var(--bg1)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--tx3)', fontFamily: 'var(--mono)' }}>MARKET CAP</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--tx)', marginTop: '4px' }}>
                    {selectedStockDetails?.fundamentals?.market_cap && typeof selectedStockDetails.fundamentals.market_cap === 'number'
                      ? `₹${(selectedStockDetails.fundamentals.market_cap / 1e10).toFixed(2)}B`
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <button 
                onClick={handleViewInDashboard}
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px',
                  padding: '10px',
                  background: 'var(--amber)',
                  color: 'black',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                className="seg-btn"
              >
                <TrendingUp size={16} />
                Analyze Model
              </button>
              
              <button 
                onClick={toggleWatchlist}
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px',
                  padding: '10px',
                  background: 'var(--bg2)',
                  color: 'var(--tx)',
                  fontWeight: 600,
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                className="seg-btn"
              >
                {isSelectedInWatchlist ? (
                  <>
                    <Trash2 size={16} color="var(--red)" />
                    Drop Watchlist
                  </>
                ) : (
                  <>
                    <Plus size={16} color="var(--green)" />
                    Watch Stock
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--tx3)', textAlign: 'center' }}>
            <TrendingUp size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <h3>No Stock Selected</h3>
            <p style={{ maxWidth: '250px', fontSize: '0.9rem' }}>Select a ticker from the screener table to view detailed performance charts and AI valuations.</p>
          </div>
        )}
      </div>
    </div>
  );
};
