import React, { useState, useEffect, useRef } from 'react';
import { useFinance, type WatchlistItem } from '../context/FinanceContext';
import { createChart, AreaSeries } from '@pipsend/charts';
import { useTheme } from '../context/ThemeContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Briefcase, Edit3, Trash2, ArrowUpRight, Check, X, ShieldAlert } from 'lucide-react';

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const Watchlist: React.FC = () => {
  const { watchlist, setWatchlist, portfolioValue, fetchStockData, setActiveView } = useFinance();
  const { theme } = useTheme();
  
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedStockDetails, setSelectedStockDetails] = useState<any>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  
  // Editing state for holding units
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [sharesInput, setSharesInput] = useState<number>(0);
  const [avgPriceInput, setAvgPriceInput] = useState<number>(0);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Set default selection to first item
  useEffect(() => {
    if (watchlist.length > 0 && !selectedTicker) {
      setSelectedTicker(watchlist[0].ticker);
    }
  }, [watchlist, selectedTicker]);

  // Fetch chart details for selected ticker
  useEffect(() => {
    if (!selectedTicker) return;

    const fetchDetails = async () => {
      setIsLoadingChart(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/stock/${selectedTicker}.NS`);
        if (res.ok) {
          const json = await res.json();
          setSelectedStockDetails(json);
        }
      } catch (err) {
        console.error('Error fetching watchlist stock details:', err);
      } finally {
        setIsLoadingChart(false);
      }
    };
    fetchDetails();
  }, [selectedTicker, BACKEND_URL]);

  // Render chart
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
      lineColor: '#00c076',
      topColor: 'rgba(0, 192, 118, 0.2)',
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

  const handleEditHoldingsClick = (item: WatchlistItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item.ticker);
    setSharesInput(item.shares || 0);
    setAvgPriceInput(item.avgBuyPrice || 0);
  };

  const handleSaveHoldings = (ticker: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlist(prev => prev.map(item => {
      if (item.ticker === ticker) {
        return {
          ...item,
          shares: sharesInput,
          avgBuyPrice: avgPriceInput
        };
      }
      return item;
    }));
    setEditingItem(null);
  };

  const handleCancelHoldings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(null);
  };

  const handleDropFromWatchlist = (ticker: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlist(prev => prev.filter(item => item.ticker !== ticker));
    if (selectedTicker === ticker) {
      setSelectedTicker(watchlist.find(item => item.ticker !== ticker)?.ticker || null);
    }
  };

  const handleTickerClick = (ticker: string) => {
    setSelectedTicker(ticker);
  };

  const handleAnalyzeInDashboard = () => {
    if (selectedTicker) {
      fetchStockData(`${selectedTicker}.NS`);
      setActiveView('dashboard');
    }
  };

  // Prepare allocation data for Pie Chart
  const holdingsWithShares = watchlist.filter(item => (item.shares || 0) > 0);
  const pieData = holdingsWithShares.map(item => ({
    name: item.ticker,
    value: Math.round((item.shares || 0) * item.price)
  }));

  const selectedItem = watchlist.find(item => item.ticker === selectedTicker);
  const totalCost = watchlist.reduce((sum, item) => sum + (item.shares || 0) * (item.avgBuyPrice || 0), 0);
  const totalPnl = portfolioValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0.0;

  return (
    <div style={{ display: 'flex', gap: '20px', margin: '10px 0', width: '100%', alignItems: 'stretch' }}>
      {/* LEFT COLUMN: Holdings & Watchlist Grid */}
      <div className="panel" style={{ flex: '3 1 60%', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--tx)', fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="var(--amber)" />
              My Holdings & Watchlist
            </h2>
            <p style={{ color: 'var(--tx3)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Track live stock assets, purchase history, and real-time portfolio returns</p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tx)' }}>
              ₹{portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: totalPnl >= 0 ? 'var(--emerald)' : 'var(--rose)', fontWeight: 'bold', display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
              <span>Total P&L:</span>
              <span>{totalPnl >= 0 ? '+' : ''}{totalPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              <span>({totalPnl >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        {watchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--tx3)' }}>
            <ShieldAlert size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--tx)' }}>Your Watchlist is Empty</h3>
            <p style={{ fontSize: '0.9rem', maxWidth: '300px', margin: '8px auto' }}>Search stocks in the sidebar top bar or use the screener to select stocks and add them here.</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--tx)', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--br)', color: 'var(--tx3)' }}>
                  <th style={{ padding: '10px', fontFamily: 'var(--mono)', fontWeight: 600 }}>TICKER</th>
                  <th style={{ padding: '10px', fontFamily: 'var(--mono)', fontWeight: 600, textAlign: 'right' }}>LIVE PRICE</th>
                  <th style={{ padding: '10px', fontFamily: 'var(--mono)', fontWeight: 600, textAlign: 'right' }}>HOLDINGS</th>
                  <th style={{ padding: '10px', fontFamily: 'var(--mono)', fontWeight: 600, textAlign: 'right' }}>TOTAL VALUE</th>
                  <th style={{ padding: '10px', fontFamily: 'var(--mono)', fontWeight: 600, textAlign: 'right' }}>NET P&L</th>
                  <th style={{ padding: '10px', fontFamily: 'var(--mono)', fontWeight: 600, textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map(item => {
                  const isSelected = selectedTicker === item.ticker;
                  const isEditing = editingItem === item.ticker;
                  const itemValue = (item.shares || 0) * item.price;
                  const itemCost = (item.shares || 0) * (item.avgBuyPrice || 0);
                  const itemPnl = itemValue - itemCost;
                  const itemPnlPct = itemCost > 0 ? (itemPnl / itemCost) * 100 : 0.0;
                  const isPnlUp = itemPnl >= 0;

                  return (
                    <tr 
                      key={item.ticker}
                      onClick={() => handleTickerClick(item.ticker)}
                      style={{ 
                        borderBottom: '1px solid var(--br2)', 
                        cursor: 'pointer',
                        background: isSelected ? 'var(--bg2)' : 'transparent',
                        transition: 'background 0.15s'
                      }}
                      className={`wl-item ${item.flashClass}`}
                    >
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--tx)' }}>{item.ticker}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--tx3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{item.name}</div>
                      </td>
                      
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                        <div style={{ fontSize: '0.75rem', color: item.changePct >= 0 ? 'var(--emerald)' : 'var(--rose)', fontWeight: 'bold' }}>
                          {item.changePct >= 0 ? '▲ +' : '▼ '}{item.changePct.toFixed(2)}%
                        </div>
                      </td>

                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '80px', marginLeft: 'auto' }} onClick={e => e.stopPropagation()}>
                            <input 
                              type="number"
                              placeholder="Qty"
                              value={sharesInput}
                              onChange={e => setSharesInput(Number(e.target.value))}
                              style={{ padding: '4px', background: 'var(--bg1)', color: 'var(--tx)', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '11px', width: '100%' }}
                            />
                            <input 
                              type="number"
                              placeholder="Cost"
                              value={avgPriceInput}
                              onChange={e => setAvgPriceInput(Number(e.target.value))}
                              style={{ padding: '4px', background: 'var(--bg1)', color: 'var(--tx)', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '11px', width: '100%' }}
                            />
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 600 }}>{item.shares || 0} units</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--tx3)' }}>Avg: ₹{item.avgBuyPrice?.toFixed(2) || '0.00'}</div>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 600 }}>
                        ₹{itemValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>

                      <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 600, color: (item.shares || 0) > 0 ? (isPnlUp ? 'var(--emerald)' : 'var(--rose)') : 'var(--tx3)' }}>
                        {(item.shares || 0) > 0 ? (
                          <>
                            <div>{isPnlUp ? '+' : ''}₹{itemPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                            <div style={{ fontSize: '0.75rem' }}>{isPnlUp ? '+' : ''}{itemPnlPct.toFixed(2)}%</div>
                          </>
                        ) : (
                          '--'
                        )}
                      </td>

                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {isEditing ? (
                            <>
                              <button 
                                onClick={e => handleSaveHoldings(item.ticker, e)} 
                                style={{ border: 'none', background: 'var(--green-bg)', color: 'var(--green)', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={handleCancelHoldings} 
                                style={{ border: 'none', background: 'var(--red-bg)', color: 'var(--red)', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={e => handleEditHoldingsClick(item, e)} 
                                title="Edit holdings" 
                                style={{ border: '1px solid var(--line)', background: 'var(--bg2)', color: 'var(--tx2)', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                                className="seg-btn"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                onClick={e => handleDropFromWatchlist(item.ticker, e)} 
                                title="Drop stock" 
                                style={{ border: '1px solid var(--line)', background: 'var(--bg2)', color: 'var(--red)', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                                className="seg-btn"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Interactive Chart & Allocation Pie Chart */}
      <div className="panel" style={{ flex: '2 1 40%', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        {selectedItem ? (
          <>
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--tx)' }}>{selectedItem.ticker} Details</h3>
                  <div style={{ color: 'var(--tx3)', fontSize: '0.85rem', marginTop: '2px' }}>{selectedItem.name}</div>
                </div>
                <button 
                  onClick={handleAnalyzeInDashboard}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    padding: '4px 8px', 
                    background: 'var(--amber-bg)', 
                    color: 'var(--amber)', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  className="seg-btn"
                >
                  Predict
                  <ArrowUpRight size={12} />
                </button>
              </div>
            </div>

            {/* CHART */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontFamily: 'var(--mono)' }}>
                Price Performance (3 Months)
              </div>
              <div className="chart-area" style={{ height: '180px', padding: 0, position: 'relative' }}>
                {isLoadingChart ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', fontFamily: 'var(--mono)', fontSize: '10px' }}>
                    LOADING CHART DATA...
                  </div>
                ) : (
                  <div ref={chartContainerRef} style={{ width: '100%', height: '180px' }} />
                )}
              </div>
            </div>

            {/* PORTFOLIO WEIGHT DISTRIBUTION */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontFamily: 'var(--mono)' }}>
                Holding Asset Distribution
              </div>
              
              {pieData.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', height: '140px', marginTop: '10px' }}>
                  <div style={{ width: '140px', height: '140px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                        >
                          {pieData.map((entry, index) => {
                            const isCurrent = entry.name === selectedTicker;
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={isCurrent ? 'var(--amber)' : COLORS[index % COLORS.length]} 
                                opacity={isCurrent ? 1 : 0.45}
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth={1}
                              />
                            );
                          })}
                        </Pie>
                        <RechartsTooltip formatter={(val: any) => `₹${Number(val || 0).toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '140px' }}>
                    {watchlist.map((item, idx) => {
                      const shares = item.shares || 0;
                      if (shares === 0) return null;
                      const val = shares * item.price;
                      const weightPct = portfolioValue > 0 ? (val / portfolioValue) * 100 : 0;
                      const isCurrent = item.ticker === selectedTicker;
                      return (
                        <div key={item.ticker} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', background: isCurrent ? 'var(--bg2)' : 'transparent', padding: '3px 6px', borderRadius: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isCurrent ? 'var(--amber)' : COLORS[idx % COLORS.length] }} />
                            <span style={{ fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--amber)' : 'var(--tx)' }}>{item.ticker}</span>
                          </div>
                          <span style={{ color: 'var(--tx3)', fontFamily: 'var(--mono)' }}>{weightPct.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                  No active holding shares. Edit a watchlist asset's holdings Qty to display portfolio allocation weights.
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--tx3)', textAlign: 'center' }}>
            <Briefcase size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <h3>No Watchlist Item Selected</h3>
            <p style={{ maxWidth: '250px', fontSize: '0.9rem' }}>Add stock items to your watchlist to display transaction metrics and portfolio return analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
};
