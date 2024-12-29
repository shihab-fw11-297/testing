const calculateEMA = (data, period) => {
    const multiplier = 2 / (period + 1);
    let ema = data[0];
    
    return data.map((price, index) => {
      if (index === 0) return ema;
      ema = (price - ema) * multiplier + ema;
      return ema;
    });
  };
  
  
  module.exports = { calculateEMA };