const analyzeSwings = (data, threshold = 0.001) => {
    const swings = {
      highs: [],
      lows: [],
      patterns: []
    };
    
    for (let i = 2; i < data.length - 2; i++) {
      if (data[i].h > data[i-1].h && data[i].h > data[i-2].h &&
          data[i].h > data[i+1].h && data[i].h > data[i+2].h) {
        swings.highs.push({
          type: 'HIGH',
          price: data[i].h,
          position: i,
          strength: calculateSwingStrength(data, i, 'HIGH')
        });
      }
      
      if (data[i].l < data[i-1].l && data[i].l < data[i-2].l &&
          data[i].l < data[i+1].l && data[i].l < data[i+2].l) {
        swings.lows.push({
          type: 'LOW',
          price: data[i].l,
          position: i,
          strength: calculateSwingStrength(data, i, 'LOW')
        });
      }
    }
    
    swings.patterns = analyzeSwingPatterns(swings.highs, swings.lows);
    
    return swings;
  };
  
  const calculateSwingStrength = (data, position, type) => {
    const lookback = 5;
    let strength = 0;
    
    if (type === 'HIGH') {
      for (let i = position - lookback; i <= position + lookback; i++) {
        if (i < 0 || i >= data.length) continue;
        strength += (data[position].h - data[i].h) / data[position].h;
      }
    } else {
      for (let i = position - lookback; i <= position + lookback; i++) {
        if (i < 0 || i >= data.length) continue;
        strength += (data[i].l - data[position].l) / data[position].l;
      }
    }
    
    return strength;
  };
  
  const analyzeSwingPatterns = (highs, lows) => {
    const patterns = [];
    
    // Find higher highs and higher lows (Uptrend)
    for (let i = 1; i < highs.length; i++) {
      if (highs[i].price > highs[i-1].price) {
        patterns.push({
          type: 'HIGHER_HIGH',
          position: highs[i].position,
          price: highs[i].price
        });
      }
    }
    
    for (let i = 1; i < lows.length; i++) {
      if (lows[i].price > lows[i-1].price) {
        patterns.push({
          type: 'HIGHER_LOW',
          position: lows[i].position,
          price: lows[i].price
        });
      }
    }
    
    return patterns;
  };

  module.exports = { analyzeSwings };
