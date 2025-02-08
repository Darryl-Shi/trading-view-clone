import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { fetchMarketData } from './services/api';

function App() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [selectedInterval, setSelectedInterval] = useState('1d');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [inputSymbol, setInputSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('candlestick');
  // Add just these two new states
  const [showIndicators, setShowIndicators] = useState(false);
  const [indicatorCode, setIndicatorCode] = useState('');

  const intervals = [
    { value: '1m', label: '1M' },
    { value: '5m', label: '5M' },
    { value: '15m', label: '15M' },
    { value: '30m', label: '30M' },
    { value: '60m', label: '1H' },
    { value: '1d', label: '1D' },
    { value: '1wk', label: '1W' },
    { value: '1mo', label: '1M' },
  ];

  const handleSymbolSubmit = (e) => {
    e.preventDefault();
    if (inputSymbol) {
      setSelectedSymbol(inputSymbol.toUpperCase());
      setInputSymbol('');
    }
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 600,
      layout: {
        background: { color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSymbol) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchMarketData(selectedSymbol, selectedInterval);
        if (data && data.length > 0) {
          if (seriesRef.current) {
            chartRef.current.removeSeries(seriesRef.current);
          }

          let series;
          if (chartType === 'line') {
            series = chartRef.current.addLineSeries({
              color: '#2962FF',
              lineWidth: 2,
            });
            const lineData = data.map(item => ({
              time: item.time,
              value: item.close
            }));
            series.setData(lineData);
          } else if (chartType === 'area') {
            series = chartRef.current.addAreaSeries({
              lineColor: '#2962FF',
              topColor: '#2962FF50',
              bottomColor: '#2962FF10',
            });
            const areaData = data.map(item => ({
              time: item.time,
              value: item.close
            }));
            series.setData(areaData);
          } else {
            series = chartRef.current.addCandlestickSeries({
              upColor: '#26a69a',
              downColor: '#ef5350',
              borderVisible: false,
              wickUpColor: '#26a69a',
              wickDownColor: '#ef5350',
            });
            series.setData(data);
          }
          seriesRef.current = series;
        } else {
          setError('No data available for this symbol/interval');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch market data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedSymbol, selectedInterval, chartType]);

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1>TradingView Clone</h1>
          {selectedSymbol && (
            <div className="active-symbol">
              <span className="label">Active Symbol:</span>
              <span className="symbol">{selectedSymbol}</span>
            </div>
          )}
        </div>
      </header>

      <div className="toolbar">
        <form onSubmit={handleSymbolSubmit} className="symbol-form">
          <input
            type="text"
            value={inputSymbol}
            onChange={(e) => setInputSymbol(e.target.value)}
            placeholder="Enter ticker symbol (e.g., AAPL)"
            className="symbol-input"
          />
          <button type="submit" className="symbol-button">Load Chart</button>
        </form>

        <div className="chart-controls">
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="chart-type-select"
          >
            <option value="candlestick">Candlestick</option>
            <option value="line">Line</option>
            <option value="area">Area</option>
          </select>

          {/* Add indicator button */}
          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className="chart-control-btn"
          >
            Indicators
          </button>
        </div>

        <div className="interval-buttons">
          {intervals.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSelectedInterval(value)}
              className={`interval-btn ${selectedInterval === value ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Add indicator panel */}
      {showIndicators && (
        <div className="indicator-panel">
          <textarea
            value={indicatorCode}
            onChange={(e) => setIndicatorCode(e.target.value)}
            className="indicator-input"
            placeholder={`# Example Python indicator code:
def calculate(df):
    """
    df: DataFrame with columns ['Open', 'High', 'Low', 'Close', 'Volume']
    Return a pandas Series or DataFrame
    """
    # Example: 20-day moving average
    return df['Close'].rolling(window=20).mean()`}
          />
          <button className="indicator-add-btn">Add Indicator</button>
        </div>
      )}
      
      {!selectedSymbol && !isLoading && !error && (
        <div className="welcome-message">
          Enter a ticker symbol above to begin
        </div>
      )}
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div ref={chartContainerRef} className="chart-container" />
    </div>
  );
}

export default App;
