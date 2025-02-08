import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { format } from 'date-fns';
import useChartStore from '../store/chartStore';
import { WebSocketClient } from '../services/api';

const Chart = ({ data, indicators }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({});
  const wsRef = useRef(null);
  const symbol = useChartStore((state) => state.symbol);

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
        crosshair: {
          mode: 'normal',
        },
        rightPriceScale: {
          borderColor: '#2a2e39',
        },
        timeScale: {
          borderColor: '#2a2e39',
          timeVisible: true,
        },
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      seriesRef.current.main = candleSeries;
      candleSeries.setData(data);

      // Connect to WebSocket for real-time updates
      wsRef.current = new WebSocketClient(symbol, (newData) => {
        candleSeries.update(newData);
      });
      wsRef.current.connect();

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
        wsRef.current?.disconnect();
      };
    }
  }, [data, symbol]);

  // Handle indicators
  useEffect(() => {
    if (!chartRef.current) return;

    // Clear old indicators
    Object.entries(seriesRef.current)
      .forEach(([key, series]) => {
        if (key !== 'main') {
          chartRef.current.removeSeries(series);
          delete seriesRef.current[key];
        }
      });

    // Add new indicators
    indicators.forEach((indicator) => {
      const series = chartRef.current.addLineSeries({
        color: indicator.color,
        lineWidth: 2,
      });
      series.setData(indicator.data);
      seriesRef.current[indicator.id] = series;
    });
  }, [indicators]);

  return <div ref={chartContainerRef} className="chart-container" />;
};

export default Chart;
