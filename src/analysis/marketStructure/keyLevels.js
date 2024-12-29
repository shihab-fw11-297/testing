const { findSwingPoints } = require("../patterns/findSwingPoints");

const findKeyLevels = (data, period = 20) => {
    const levels = {
      support: [],
      resistance: [],
      dynamic: [] // For trendlines
    };
  
    // Find potential support and resistance levels
    for (let i = period; i < data.length - period; i++) {
      const currentLow = data[i].l;
      const currentHigh = data[i].h;
      
      let isSupport = true;
      let isResistance = true;
  
      // Check surrounding candles
      for (let j = i - period; j <= i + period; j++) {
        if (j === i) continue;
        
        if (data[j].l <= currentLow) isSupport = false;
        if (data[j].h >= currentHigh) isResistance = false;
      }
  
      if (isSupport) levels.support.push({ price: currentLow, index: i });
      if (isResistance) levels.resistance.push({ price: currentHigh, index: i });
    }
  
    // Calculate dynamic trendlines
    levels.dynamic = calculateTrendlines(data);
  
    return levels;
  };
  
  const calculateTrendlines = (data) => {
    const trendlines = [];
    const swings = findSwingPoints(data);
  
    // Connect swing highs and lows to form trendlines
    for (let i = 0; i < swings.highs.length - 1; i++) {
      const start = swings.highs[i];
      const end = swings.highs[i + 1];
      
      trendlines.push({
        type: 'resistance',
        start,
        end,
        slope: (end.price - start.price) / (end.index - start.index)
      });
    }
  
    for (let i = 0; i < swings.lows.length - 1; i++) {
      const start = swings.lows[i];
      const end = swings.lows[i + 1];
      
      trendlines.push({
        type: 'support',
        start,
        end,
        slope: (end.price - start.price) / (end.index - start.index)
      });
    }
  
    return trendlines;
  };
  
  module.exports = { findKeyLevels };