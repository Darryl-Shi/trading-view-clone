import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { generateMockData } from './mockData';

function App() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartContainerRef.current) {
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
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      const data = generateMockData();
      candlestickSeries.setData(data);

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
    }
  }, []);

  return (
    <div className="container">
      <div className="toolbar">
        <button>1H</button>
        <button>4H</button>
        <button>1D</button>
        <button>1W</button>
      </div>
      <div ref={chartContainerRef} className="chart-container" />
    </div>
  );
}

export default App;
