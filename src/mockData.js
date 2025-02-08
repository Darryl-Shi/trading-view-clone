export function generateMockData() {
  const data = [];
  const basePrice = 100;
  const numberOfPoints = 100;
  let lastClose = basePrice;

  for (let i = 0; i < numberOfPoints; i++) {
    const time = new Date(Date.now() - (numberOfPoints - i) * 24 * 60 * 60 * 1000);
    const volatility = 0.1;
    
    const change = lastClose * volatility * (Math.random() - 0.5);
    const open = lastClose;
    const close = open + change;
    const high = Math.max(open, close) + Math.abs(change) * Math.random();
    const low = Math.min(open, close) - Math.abs(change) * Math.random();
    
    data.push({
      time: time.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
    });
    
    lastClose = close;
  }
  
  return data;
}
