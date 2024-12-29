const { calculateEMA } = require("../../../utils/calculations");

const calculateMovingAverages = (data) => {
    const closes = data.map(candle => candle.c);
    
    return {
      sma20: calculateSMA(closes, 20),
      sma50: calculateSMA(closes, 50),
      sma200: calculateSMA(closes, 200),
      ema9: calculateEMA(closes, 9),
      ema21: calculateEMA(closes, 21)
    };
  };
  
  const calculateSMA = (data, period) => {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(null);
        continue;
      }
      
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  };
  
  module.exports = { calculateMovingAverages };