const analyzeMomentum = (data) => {
    const momentum = {
      impulses: [],
      exhaustion: [],
      consolidation: []
    };
    
    for (let i = 1; i < data.length; i++) {
      const candleSize = Math.abs(data[i].c - data[i].o);
      const prevCandleSize = Math.abs(data[i-1].c - data[i-1].o);
      const bodyRange = data[i].c > data[i].o ? 
        (data[i].c - data[i].o) : (data[i].o - data[i].c);
      
      if (candleSize > prevCandleSize * 1.5 && bodyRange > candleSize * 0.7) {
        momentum.impulses.push({
          type: 'IMPULSE',
          position: i,
          direction: data[i].c > data[i].o ? 'BULLISH' : 'BEARISH',
          strength: candleSize / prevCandleSize
        });
      }
      
      if (i > 5) {
        const prevMove = data[i-1].c - data[i-5].c;
        const currentMove = data[i].c - data[i-1].c;
        
        if (Math.abs(currentMove) < Math.abs(prevMove) * 0.2) {
          momentum.exhaustion.push({
            type: 'EXHAUSTION',
            position: i,
            prevMove,
            currentMove
          });
        }
        
        const rangeSizes = [];
        for (let j = i-5; j <= i; j++) {
          rangeSizes.push(data[j].h - data[j].l);
        }
        
        const avgRange = rangeSizes.reduce((a, b) => a + b) / rangeSizes.length;
        const currentRange = data[i].h - data[i].l;
        
        if (currentRange < avgRange * 0.5) {
          momentum.consolidation.push({
            type: 'CONSOLIDATION',
            position: i,
            rangeSize: currentRange,
            averageRange: avgRange
          });
        }
      }
    }
    
    return momentum;
  };

  module.exports = { analyzeMomentum };
