import React from 'react';
import useChartStore from '../store/chartStore';

const Toolbar = () => {
  const { interval, setInterval, symbol, setSymbol } = useChartStore();

  const intervals = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
  const commonSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];

  return (
    <div className="toolbar">
      <div className="symbol-selector">
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
          {commonSymbols.map((sym) => (
            <option key={sym} value={sym}>{sym}</option>
          ))}
        </select>
      </div>
      
      <div className="interval-buttons">
        {intervals.map((int) => (
          <button
            key={int}
            className={interval === int ? 'active' : ''}
            onClick={() => setInterval(int)}
          >
            {int}
          </button>
        ))}
      </div>

      <div className="indicator-buttons">
        <button onClick={() => useChartStore.getState().addIndicator({
          id: Date.now(),
          type: 'SMA',
          parameters: { period: 20 },
          color: '#2962FF'
        })}>
          SMA
        </button>
        <button onClick={() => useChartStore.getState().addIndicator({
          id: Date.now(),
          type: 'RSI',
          parameters: { period: 14 },
          color: '#FF9800'
        })}>
          RSI
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
