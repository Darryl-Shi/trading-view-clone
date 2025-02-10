import React, { useState, useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import axios from 'axios';

const DEFAULT_INDICATORS = [
  { name: 'SMA', enabled: false, params: { period: 20 }, plotSeparately: false },
  { name: 'EMA', enabled: false, params: { period: 50 }, plotSeparately: false },
  { name: 'RSI', enabled: false, params: { period: 14 }, plotSeparately: false },
  { name: 'BB', enabled: false, params: { period: 20, stdDev: 2 }, plotSeparately: false },
];

const TIME_INTERVALS = ['1m', '5m', '15m', '30m', '1h', '1d', '1wk', '1mo'];

function App() {
  const [ticker, setTicker] = useState('SPX');
  const [data, setData] = useState([]);
  const [indicators, setIndicators] = useState(() => {
    const savedIndicators = localStorage.getItem('indicators');
    return savedIndicators ? JSON.parse(savedIndicators) : DEFAULT_INDICATORS;
  });
  const [customIndicator, setCustomIndicator] = useState('');
  const [customIndicatorName, setCustomIndicatorName] = useState('');
  const [timeInterval, setTimeInterval] = useState('1d');
  const [error, setError] = useState('');
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);
  const chartContainerRef = useRef();
  const chartRef = useRef();

  useEffect(() => {
    fetchData();
  }, [ticker, timeInterval]);

  useEffect(() => {
    if (data.length > 0) {
      createOrUpdateChart();
    }
  }, [data, indicators]);

  useEffect(() => {
    localStorage.setItem('indicators', JSON.stringify(indicators));
  }, [indicators]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/data/${ticker}?interval=${timeInterval}`);
      setData(response.data.data);
      updateIndicators(response.data.indicators);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again.');
    }
  };

  const updateIndicators = (newIndicatorData) => {
    setIndicators(indicators.map(indicator => {
      const newData = newIndicatorData.find(i => i.name === indicator.name);
      return { ...indicator, data: newData ? newData.data : [] };
    }));
  };

  const createOrUpdateChart = () => {
    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { type: 'solid', color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2a2e39' },
        horzLines: { color: '#2a2e39' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candlestickSeries.setData(data);

    indicators.forEach(indicator => {
      if (indicator.enabled && indicator.data) {
        addIndicatorToChart(chart, indicator);
      }
    });

    chartRef.current = chart;
  };

  const addIndicatorToChart = (chart, indicator) => {
    if (typeof indicator.data === 'object' && !Array.isArray(indicator.data)) {
      Object.entries(indicator.data).forEach(([key, values]) => {
        const indicatorSeries = chart.addLineSeries({ color: getRandomColor() });
        indicatorSeries.setData(values);
      });
    } else if (Array.isArray(indicator.data)) {
      const indicatorSeries = chart.addLineSeries({ color: indicator.color || getRandomColor() });
      indicatorSeries.setData(indicator.data);
    }
  };

  const handleTickerChange = (e) => {
    setTicker(e.target.value.toUpperCase());
  };

  const handleCustomIndicatorSubmit = async () => {
    try {
      setError('');
      const response = await axios.post('http://localhost:5000/custom_indicator', {
        ticker,
        code: customIndicator,
        interval: timeInterval,
        name: customIndicatorName,
      });
      setIndicators([...indicators, { ...response.data, enabled: true, plotSeparately: false }]);
      setCustomIndicator('');
      setCustomIndicatorName('');
    } catch (error) {
      console.error('Error submitting custom indicator:', error);
      setError(error.response?.data?.error || 'An error occurred while submitting the custom indicator');
    }
  };

  const toggleIndicator = (index) => {
    const newIndicators = [...indicators];
    newIndicators[index].enabled = !newIndicators[index].enabled;
    setIndicators(newIndicators);
  };

  const updateIndicatorParams = async (index, paramName, value) => {
    const newIndicators = [...indicators];
    newIndicators[index].params[paramName] = value;
    setIndicators(newIndicators);
    
    try {
      const response = await axios.get(`http://localhost:5000/indicator/${ticker}`, {
        params: {
          name: newIndicators[index].name,
          ...newIndicators[index].params,
          interval: timeInterval,
        },
      });
      updateIndicators([response.data]);
    } catch (error) {
      console.error('Error updating indicator:', error);
      setError('Failed to update indicator. Please try again.');
    }
  };

  const getRandomColor = () => {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
  };

  return (
    <div className="container">
      <header className="header">
        <div className="logo">TradingView Clone</div>
        <div className="search-bar">
          <input
            type="text"
            value={ticker}
            onChange={handleTickerChange}
            placeholder="Enter symbol..."
          />
        </div>
        <div className="header-buttons">
          <button className="header-button" onClick={() => setShowIndicatorMenu(!showIndicatorMenu)}>Indicators</button>
          <select value={timeInterval} onChange={(e) => setTimeInterval(e.target.value)} className="header-button">
            {TIME_INTERVALS.map((interval) => (
              <option key={interval} value={interval}>{interval}</option>
            ))}
          </select>
        </div>
      </header>
      <div className="main-content">
        <div className="chart-container" ref={chartContainerRef}></div>
        <div className="sidebar">
          <div className="watchlist">
            <div className="watchlist-header">
              <h3>Watchlist</h3>
              <button>+</button>
            </div>
            <div className="watchlist-item">
              <span className="symbol">SPX</span>
              <span className="price">6,025.98</span>
              <span className="change negative">-0.95%</span>
            </div>
            <div className="watchlist-item">
              <span className="symbol">NDQ</span>
              <span className="price">21,491.37</span>
              <span className="change negative">-1.30%</span>
            </div>
            <div className="watchlist-item">
              <span className="symbol">DJI</span>
              <span className="price">44,303.40</span>
              <span className="change negative">-0.99%</span>
            </div>
          </div>
        </div>
        {showIndicatorMenu && (
          <div className="indicator-menu">
            <h2>Indicators</h2>
            <div className="indicator-list">
              {indicators.map((indicator, index) => (
                <div key={index} className="indicator-item">
                  <input
                    type="checkbox"
                    checked={indicator.enabled}
                    onChange={() => toggleIndicator(index)}
                  />
                  <label>{indicator.name}</label>
                  {indicator.params && Object.entries(indicator.params).map(([paramName, paramValue]) => (
                    <input
                      key={paramName}
                      type="number"
                      value={paramValue}
                      onChange={(e) => updateIndicatorParams(index, paramName, parseInt(e.target.value))}
                      style={{ width: '50px', marginLeft: '5px' }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="custom-indicator">
              <h3>Custom Indicator</h3>
              <input
                type="text"
                value={customIndicatorName}
                onChange={(e) => setCustomIndicatorName(e.target.value)}
                placeholder="Indicator Name"
              />
              <textarea
                value={customIndicator}
                onChange={(e) => setCustomIndicator(e.target.value)}
                placeholder="Enter custom indicator code"
              />
              <button onClick={handleCustomIndicatorSubmit}>Add Custom Indicator</button>
            </div>
          </div>
        )}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default App;
