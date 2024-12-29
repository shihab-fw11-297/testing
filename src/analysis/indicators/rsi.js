const calculateRSI = (data, period = 14) => {
    const changes = [];
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i].c - data[i-1].c);
    }
    
    changes.forEach(change => {
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    });
    
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
    
    const rsiValues = [];
    
    let rs = avgGain / avgLoss;
    rsiValues.push(100 - (100 / (1 + rs)));
    
    for (let i = period; i < changes.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
      
      rs = avgGain / avgLoss;
      rsiValues.push(100 - (100 / (1 + rs)));
    }
    
    return {
      values: rsiValues,
      signals: analyzeRSI(rsiValues, data)
    };
  };
  
  const analyzeRSI = (rsiValues, data) => {
    const signals = [];
    const overboughtLevel = 70;
    const oversoldLevel = 30;
    
    for (let i = 1; i < rsiValues.length; i++) {
      if (rsiValues[i] > overboughtLevel && rsiValues[i-1] <= overboughtLevel) {
        signals.push({
          type: 'OVERBOUGHT',
          position: i,
          value: rsiValues[i]
        });
      } else if (rsiValues[i] < oversoldLevel && rsiValues[i-1] >= oversoldLevel) {
        signals.push({
          type: 'OVERSOLD',
          position: i,
          value: rsiValues[i]
        });
      }
      
      if (i > 20) {
        const priceChange = data[i].c - data[i-20].c;
        const rsiChange = rsiValues[i] - rsiValues[i-20];
        
        if (priceChange > 0 && rsiChange < 0) {
          signals.push({
            type: 'BEARISH_DIVERGENCE',
            position: i,
            strength: Math.abs(rsiChange)
          });
        } else if (priceChange < 0 && rsiChange > 0) {
          signals.push({
            type: 'BULLISH_DIVERGENCE',
            position: i,
            strength: Math.abs(rsiChange)
          });
        }
      }
    }
    
    return signals;
  };

  module.exports = { calculateRSI };
