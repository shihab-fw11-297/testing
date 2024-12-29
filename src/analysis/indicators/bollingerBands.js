// Add to src/analysis/indicators/bollingerBands.js
const calculateBollingerBands = (data, period = 20, multiplier = 2) => {
    const closes = data.map(candle => candle.c);
    const sma = [];
    const upper = [];
    const lower = [];
    
    for (let i = 0; i < closes.length; i++) {
      if (i < period - 1) {
        sma.push(null);
        upper.push(null);
        lower.push(null);
        continue;
      }
      
      const slice = closes.slice(i - period + 1, i + 1);
      const average = slice.reduce((a, b) => a + b, 0) / period;
      const standardDeviation = Math.sqrt(
        slice.reduce((a, b) => a + Math.pow(b - average, 2), 0) / period
      );
      
      sma.push(average);
      upper.push(average + (multiplier * standardDeviation));
      lower.push(average - (multiplier * standardDeviation));
    }
    
    return {
      middle: sma,
      upper,
      lower,
      bandwidth: upper.map((u, i) => 
        u && lower[i] ? ((u - lower[i]) / sma[i]) * 100 : null
      )
    };
  };

  const analyzeBollingerBands = (data) => {
    const bb = calculateBollingerBands(data);
    const signals = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!bb.upper[i] || !bb.lower[i]) continue;
      
      // Squeeze detection (bandwidth narrowing)
      const bandwidthChange = bb.bandwidth[i] - bb.bandwidth[i-1];
      if (Math.abs(bandwidthChange) < 0.1) {
        signals.push({
          type: 'SQUEEZE',
          position: i,
          strength: Math.abs(bb.bandwidth[i])
        });
      }
      
      // Breakout detection
      if (data[i].c > bb.upper[i] && data[i-1].c <= bb.upper[i-1]) {
        signals.push({
          type: 'BREAKOUT_UP',
          position: i,
          strength: (data[i].c - bb.upper[i]) / data[i].c * 100
        });
      } else if (data[i].c < bb.lower[i] && data[i-1].c >= bb.lower[i-1]) {
        signals.push({
          type: 'BREAKOUT_DOWN',
          position: i,
          strength: (bb.lower[i] - data[i].c) / data[i].c * 100
        });
      }
    }
    
    return { bands: bb, signals };
  };
  
  module.exports = { calculateBollingerBands, analyzeBollingerBands };