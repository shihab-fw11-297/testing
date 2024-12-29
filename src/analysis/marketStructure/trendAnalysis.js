const analyzeTrend = (data) => {
    const highs = data.map(candle => candle.h);
    const lows = data.map(candle => candle.l);
    
    // Calculate Higher Highs (HH) and Higher Lows (HL)
    let higherHighs = 0;
    let higherLows = 0;
    let lowerHighs = 0;
    let lowerLows = 0;
  
    for (let i = 2; i < data.length; i++) {
      // Check for Higher Highs and Higher Lows
      if (highs[i] > highs[i-1] && highs[i-1] > highs[i-2]) higherHighs++;
      if (lows[i] > lows[i-1] && lows[i-1] > lows[i-2]) higherLows++;
      
      // Check for Lower Highs and Lower Lows
      if (highs[i] < highs[i-1] && highs[i-1] < highs[i-2]) lowerHighs++;
      if (lows[i] < lows[i-1] && lows[i-1] < lows[i-2]) lowerLows++;
    }
  
    // Determine market structure
    let trend = 'RANGING';
    if (higherHighs > lowerHighs && higherLows > lowerLows) {
      trend = 'UPTREND';
    } else if (lowerHighs > higherHighs && lowerLows > higherLows) {
      trend = 'DOWNTREND';
    }
  
    return {
      trend,
      strength: Math.max(higherHighs + higherLows, lowerHighs + lowerLows) / data.length,
      details: {
        higherHighs,
        higherLows,
        lowerHighs,
        lowerLows
      }
    };
  };
  
  module.exports = { analyzeTrend };