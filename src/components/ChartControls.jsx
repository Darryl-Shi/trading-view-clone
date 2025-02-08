import React from 'react';

export default function ChartControls({ 
  onChartTypeChange, 
  onScaleTypeChange,
  chartType,
  scaleType
}) {
  return (
    <div className="chart-controls">
      <div className="control-group">
        <label>Chart Type</label>
        <select 
          value={chartType} 
          onChange={(e) => onChartTypeChange(e.target.value)}
          className="chart-control-select"
        >
          <option value="candlestick">Candlestick</option>
          <option value="line">Line</option>
          <option value="area">Area</option>
          <option value="bars">Bars</option>
        </select>
      </div>

      <div className="control-group">
        <label>Scale</label>
        <select
          value={scaleType}
          onChange={(e) => onScaleTypeChange(e.target.value)}
          className="chart-control-select"
        >
          <option value="normal">Linear</option>
          <option value="logarithmic">Logarithmic</option>
        </select>
      </div>
    </div>
  );
}
