import React, { useState } from 'react';

export default function SymbolSearch({ onSymbolSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');

  const commonSymbols = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
  ];

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customSymbol) {
      onSymbolSelect(customSymbol.toUpperCase());
      setCustomSymbol('');
    }
  };

  const filteredSymbols = commonSymbols.filter(
    item => item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="symbol-search">
      <div className="search-section">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search symbols..."
          className="search-input"
        />
        <div className="symbol-list">
          {filteredSymbols.map(({ symbol, name }) => (
            <div
              key={symbol}
              className="symbol-item"
              onClick={() => onSymbolSelect(symbol)}
            >
              <span className="symbol">{symbol}</span>
              <span className="name">{name}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleCustomSubmit} className="custom-symbol-form">
        <input
          type="text"
          value={customSymbol}
          onChange={(e) => setCustomSymbol(e.target.value)}
          placeholder="Enter custom symbol..."
          className="custom-symbol-input"
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
