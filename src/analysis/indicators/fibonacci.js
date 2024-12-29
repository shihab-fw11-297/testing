const calculateFibonacciLevels = (data, trend = 'UPTREND') => {
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const prices = data.map(candle => ({ high: candle.h, low: candle.l }));
    
    const swing = {
      high: Math.max(...prices.map(p => p.high)),
      low: Math.min(...prices.map(p => p.low))
    };
    
    const range = swing.high - swing.low;
    
    const fibLevels = levels.map(level => {
      return trend === 'UPTREND'
        ? { level, price: swing.high - (range * level) }
        : { level, price: swing.low + (range * level) };
    });
    
    return {
      levels: fibLevels,
      swing,
      retracements: analyzeFibonacciRetracements(data, fibLevels)
    };
  };
  
  const analyzeFibonacciRetracements = (data, fibLevels) => {
    const retracements = [];
    
    for (let i = 1; i < data.length; i++) {
      const currentPrice = data[i].c;
      const prevPrice = data[i-1].c;
      
      fibLevels.forEach(level => {
        if ((prevPrice < level.price && currentPrice >= level.price) ||
            (prevPrice > level.price && currentPrice <= level.price)) {
          retracements.push({
            type: 'RETRACEMENT',
            level: level.level,
            price: level.price,
            position: i,
            direction: currentPrice > prevPrice ? 'BULLISH' : 'BEARISH'
          });
        }
      });
    }
    
    return retracements;
  };

  
  module.exports = { calculateFibonacciLevels };
