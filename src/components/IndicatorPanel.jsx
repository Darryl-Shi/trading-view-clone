import React, { useState } from 'react';

export default function IndicatorPanel({ onAddIndicator, onRemoveIndicator, activeIndicators }) {
  const [customCode, setCustomCode] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [indicatorParams, setIndicatorParams] = useState({});

  const indicators = [
    {
      name: 'SMA',
      params: { period: 20 },
      color: '#2962FF',
      description: 'Simple Moving Average',
      paramDescriptions: {
        period: 'Number of periods'
      }
    },
    {
      name: 'EMA',
      params: { period: 9 },
      color: '#FF9800',
      description: 'Exponential Moving Average',
      paramDescriptions: {
        period: 'Number of periods'
      }
    },
    {
      name: 'RSI',
      params: { period: 14 },
      color: '#E91E63',
      description: 'Relative Strength Index',
      paramDescriptions: {
        period: 'Number of periods'
      }
    },
    {
      name: 'MACD',
      params: { 
        fastPeriod: 12, 
        slowPeriod: 26, 
        signalPeriod: 9 
      },
      color: '#00BCD4',
      description: 'Moving Average Convergence Divergence',
      paramDescriptions: {
        fastPeriod: 'Fast EMA period',
        slowPeriod: 'Slow EMA period',
        signalPeriod: 'Signal line period'
      }
    },
    {
      name: 'BB',
      params: { 
        period: 20, 
        stdDev: 2 
      },
      color: '#4CAF50',
      description: 'Bollinger Bands',
      paramDescriptions: {
        period: 'Number of periods',
        stdDev: 'Standard deviation multiplier'
      }
    }
  ];

  const handleIndicatorSelect = (indicator) => {
    setSelectedIndicator(indicator);
    setIndicatorParams(indicator.params);
  };

  const handleParamChange = (param, value) => {
    setIndicatorParams(prev => ({
      ...prev,
      [param]: Number(value)
    }));
  };

  const handleAddIndicator = () => {
    if (selectedIndicator) {
      onAddIndicator(selectedIndicator.name, indicatorParams, selectedIndicator.color);
      setSelectedIndicator(null);
      setIndicatorParams({});
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customCode.trim() && customName.trim()) {
      onAddIndicator('CUSTOM', {
        name: customName,
        code: customCode
      }, '#FF5722');
      setCustomCode('');
      setCustomName('');
      setShowCustomForm(false);
    }
  };

  return (
    <div className="indicator-panel">
      <div className="indicator-section">
        <h3>Technical Indicators</h3>
        <div className="indicator-list">
          {indicators.map(ind => (
            <div 
              key={ind.name} 
              className={`indicator-item ${selectedIndicator?.name === ind.name ? 'selected' : ''}`}
              onClick={() => handleIndicatorSelect(ind)}
            >
              <div className="indicator-info">
                <span className="indicator-name">{ind.name}</span>
                <span className="indicator-description">{ind.description}</span>
              </div>
            </div>
          ))}
        </div>

        {selectedIndicator && (
          <div className="indicator-params">
            <h4>Parameters</h4>
            {Object.entries(selectedIndicator.paramDescriptions).map(([param, description]) => (
              <div key={param} className="param-input">
                <label title={description}>{param}</label>
                <input
                  type="number"
                  value={indicatorParams[param]}
                  onChange={(e) => handleParamChange(param, e.target.value)}
                  min="1"
                />
              </div>
            ))}
            <button onClick={handleAddIndicator}>Add Indicator</button>
          </div>
        )}
      </div>

      <div className="indicator-section">
        <h3>Custom Indicator</h3>
        <button 
          className="custom-indicator-btn"
          onClick={() => setShowCustomForm(!showCustomForm)}
        >
          {showCustomForm ? 'Cancel' : 'Create Custom Indicator'}
        </button>

        {showCustomForm && (
          <form onSubmit={handleCustomSubmit} className="custom-indicator-form">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Indicator Name"
              className="custom-name-input"
            />
            <textarea
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder={`# Example Python indicator code:
def calculate(df):
    """
    df: DataFrame with columns ['Open', 'High', 'Low', 'Close', 'Volume']
    Return a pandas Series or DataFrame
    """
    # Example: 20-day moving average
    return df['Close'].rolling(window=20).mean()`}
              className="custom-code-input"
            />
            <button type="submit">Add Custom Indicator</button>
          </form>
        )}
      </div>

      {activeIndicators.length > 0 && (
        <div className="indicator-section">
          <h3>Active Indicators</h3>
          <div className="active-indicators">
            {activeIndicators.map(ind => (
              <div key={ind.id} className="active-indicator">
                <span style={{ color: ind.color }}>{ind.name}</span>
                <button
                  onClick={() => onRemoveIndicator(ind.id)}
                  className="remove-indicator-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
