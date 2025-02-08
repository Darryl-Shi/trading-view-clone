import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchMarketData = async (symbol, interval = '1d') => {
  try {
    const response = await api.get(`/market-data/${symbol}`, {
      params: { interval }
    });
    
    return response.data.map(candle => ({
      time: interval.includes('m') || interval.includes('h') 
        ? candle.time // Keep full timestamp for intraday
        : candle.time.split(' ')[0], // Take only the date part for daily and above
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close)
    }));
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
};
