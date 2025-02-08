import { create } from 'zustand';

const useChartStore = create((set) => ({
  symbol: 'AAPL',
  interval: '1D',
  indicators: [],
  setSymbol: (symbol) => set({ symbol }),
  setInterval: (interval) => set({ interval }),
  addIndicator: (indicator) => 
    set((state) => ({ 
      indicators: [...state.indicators, indicator] 
    })),
  removeIndicator: (indicatorId) =>
    set((state) => ({
      indicators: state.indicators.filter(ind => ind.id !== indicatorId)
    })),
}));

export default useChartStore;
