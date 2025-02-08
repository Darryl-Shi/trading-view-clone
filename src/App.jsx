import React, { useState, useEffect, useRef } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import axios from 'axios';

const DEFAULT_INDICATORS = [
  { name: 'SMA', enabled: false, params: { period: 20 }, plotSeparately: false },
  { name: 'EMA', enabled: false, params: { period: 50 }, plotSeparately: false },
  { name: 'RSI', enabled: false, params: { period: 14 }, plotSeparately: false },
  { name: 'BB', enabled: false, params: { period: 20, stdDev: 2 }, plotSeparately: false },
];

const TIME_INTERVALS = ['1m', '5m', '15m', '30m', '1h', '1d', '1wk', '1mo'];

function App() {
  const [ticker, setTicker] = useState('AAPL');
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
  const chartsContainerRef = useRef();
  const chartsRef = useRef([]);

  useEffect(() => {
    fetchData();
  }, [ticker, timeInterval]);

  useEffect(() => {
    if (data.length > 0) {
      createCharts();
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

  const createCharts = () => {
    while (chartsContainerRef.current.firstChild) {
      chartsContainerRef.current.firstChild.remove();
    }
    chartsRef.current = [];

    const mainChartContainer = document.createElement('div');
    mainChartContainer.style.width = '100%';
    mainChartContainer.style.height = '400px';
    chartsContainerRef.current.appendChild(mainChartContainer);

    const mainChart = createChart(mainChartContainer, getChartOptions());

    const candlestickSeries = mainChart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candlestickSeries.setData(data);

    chartsRef.current.push(mainChart);

    indicators.forEach((indicator, index) => {
      if (indicator.enabled && indicator.data) {
        if (!indicator.plotSeparately) {
          addIndicatorToChart(mainChart, indicator);
        } else {
          createSeparateChart(indicator, index);
        }
      }
    });

    synchronizeCharts();
  };

  const getChartOptions = () => ({
    width: chartsContainerRef.current.clientWidth,
    height: 400,
    layout: {
      background: { type: 'solid', color: '#1e222d' },
      textColor: '#d1d4dc',
    },
    grid: {
      vertLines: { color: '#2b2b43' },
      horzLines: { color: '#2b2b43' },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
    },
    timeScale: {
      borderColor: '#485c7b',
      timeVisible: isTimeVisible(),
      secondsVisible: isSecondsVisible(),
      rightOffset: 12,
      barSpacing: 3,
      fixLeftEdge: true,
      lockVisibleTimeRangeOnResize: true,
      rightBarStaysOnScroll: true,
      borderVisible: false,
      visible: true,
      tickMarkFormatter: (time, tickMarkType, locale) => {
        const date = new Date(time * 1000);
        const formatOptions = isSecondsVisible()
          ? { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
          : isTimeVisible()
          ? { hour: '2-digit', minute: '2-digit', hour12: false }
          : { month: 'short', day: 'numeric' };
        return date.toLocaleString(locale, formatOptions);
      },
    },
  });

  const isTimeVisible = () => {
    return ['1m', '5m', '15m', '30m', '1h'].includes(timeInterval);
  };

  const isSecondsVisible = () => {
    return ['1m', '5m'].includes(timeInterval);
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

  const createSeparateChart = (indicator, index) => {
    const containerDiv = document.createElement('div');
    containerDiv.style.width = '100%';
    containerDiv.style.height = '200px';
    containerDiv.style.marginTop = '20px';
    chartsContainerRef.current.appendChild(containerDiv);

    const chart = createChart(containerDiv, {
      ...getChartOptions(),
      height: 200,
    });

    addIndicatorToChart(chart, indicator);
    chartsRef.current.push(chart);
  };

  const synchronizeCharts = () => {
    chartsRef.current.forEach((chart, index) => {
      chart.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
        chartsRef.current.forEach((otherChart, otherIndex) => {
          if (index !== otherIndex) {
            otherChart.timeScale().setVisibleRange(timeRange);
          }
        });
      });

      chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
        chartsRef.current.forEach((otherChart, otherIndex) => {
          if (index !== otherIndex) {
            otherChart.timeScale().setVisibleLogicalRange(logicalRange);
          }
        });
      });

      chart.subscribeCrosshairMove((param) => {
        chartsRef.current.forEach((otherChart, otherIndex) => {
          if (index !== otherIndex) {
            otherChart.setCrosshairPosition(param.point.x, param.point.y, param.seriesPrices);
          }
        });
      });
    });
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

  const togglePlotSeparately = (index) => {
    const newIndicators = [...indicators];
    newIndicators[index].plotSeparately = !newIndicators[index].plotSeparately;
    setIndicators(newIndicators);
  };

  const deleteIndicator = (index) => {
    const newIndicators = indicators.filter((_, i) => i !== index);
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
        <h1>TradingView Clone</h1>
        <div className="input-group">
          <input
            type="text"
            value={ticker}
            onChange={handleTickerChange}
            placeholder="Enter ticker symbol"
          />
          <select value={timeInterval} onChange={(e) => setTimeInterval(e.target.value)}>
            {TIME_INTERVALS.map((interval) => (
              <option key={interval} value={interval}>{interval}</option>
            ))}
          </select>
          <button onClick={fetchData}>Fetch Data</button>
          <button onClick={() => setShowIndicatorMenu(!showIndicatorMenu)}>Indicators</button>
        </div>
      </header>
      <div className="main-content">
        <div className="charts-container" ref={chartsContainerRef}></div>
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
                  <button onClick={() => togglePlotSeparately(index)}>
                    {indicator.plotSeparately ? 'Plot with Main' : 'Plot Separately'}
                  </button>
                  <button onClick={() => deleteIndicator(index)}>Delete</button>
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
