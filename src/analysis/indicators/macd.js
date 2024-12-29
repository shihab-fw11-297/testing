const { calculateEMA } = require("../../../utils/calculations");

// Add to src/analysis/indicators/macd.js
const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    const closes = data.map(candle => candle.c);
    
    // Calculate EMAs
    const fastEMA = calculateEMA(closes, fastPeriod);
    const slowEMA = calculateEMA(closes, slowPeriod);
    
    // Calculate MACD line
    const macdLine = fastEMA.map((fast, i) => 
      fast && slowEMA[i] ? fast - slowEMA[i] : null
    );
    
    // Calculate Signal line (EMA of MACD line)
    const signalLine = calculateEMA(
      macdLine.filter(v => v !== null),
      signalPeriod
    );
    
    // Calculate Histogram
    const histogram = macdLine.map((macd, i) =>
      macd && signalLine[i] ? macd - signalLine[i] : null
    );
    
    return {
      macdLine,
      signalLine,
      histogram
    };
  };
  
  const analyzeMACD = (data) => {
    const macd = calculateMACD(data);
    const signals = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!macd.histogram[i] || !macd.histogram[i-1]) continue;
      
      // Crossover detection
      if (macd.histogram[i] > 0 && macd.histogram[i-1] <= 0) {
        signals.push({
          type: 'BULLISH_CROSSOVER',
          position: i,
          strength: Math.abs(macd.histogram[i])
        });
      } else if (macd.histogram[i] < 0 && macd.histogram[i-1] >= 0) {
        signals.push({
          type: 'BEARISH_CROSSOVER',
          position: i,
          strength: Math.abs(macd.histogram[i])
        });
      }
      
      // Divergence detection
      if (i > 20) {
        const priceChange = data[i].c - data[i-20].c;
        const macdChange = macd.macdLine[i] - macd.macdLine[i-20];
        
        if (priceChange > 0 && macdChange < 0) {
          signals.push({
            type: 'BEARISH_DIVERGENCE',
            position: i,
            strength: Math.abs(macdChange)
          });
        } else if (priceChange < 0 && macdChange > 0) {
          signals.push({
            type: 'BULLISH_DIVERGENCE',
            position: i,
            strength: Math.abs(macdChange)
          });
        }
      }
    }
    
    return { macd, signals };
  };
  
  module.exports = { analyzeMACD };