const analyzeScalpingOpportunities = (data, indicators) => {
    const opportunities = [];
    const rsi = indicators.rsi;
    const momentum = indicators.momentum;
    
    for (let i = 1; i < data.length; i++) {
      // Quick reversal opportunities based on wicks
      const wickSize = Math.abs(
        Math.max(data[i].h - Math.max(data[i].o, data[i].c),
        Math.min(data[i].o, data[i].c) - data[i].l)
      );
      const bodySize = Math.abs(data[i].c - data[i].o);
      
      if (wickSize > bodySize * 2) {
        opportunities.push({
          type: 'QUICK_REVERSAL',
          position: i,
          direction: data[i].c > data[i].o ? 'BULLISH' : 'BEARISH',
          ratio: wickSize / bodySize,
          candle: {
            open: data[i].o,
            high: data[i].h,
            low: data[i].l,
            close: data[i].c
          }
        });
      }
      
      // Momentum-based scalping opportunities
      if (i > 1 && momentum) {
        const prevMove = data[i-1].c - data[i-1].o;
        const currentMove = data[i].c - data[i].o;
        const volumeIncrease = data[i].v > data[i-1].v;
        
        if (Math.abs(currentMove) > Math.abs(prevMove) * 1.5 && volumeIncrease) {
          const rsiValue = rsi?.values[i];
          let probability = 'MEDIUM';
          
          // Assess probability based on RSI
          if (rsiValue) {
            if ((currentMove > 0 && rsiValue < 70) || 
                (currentMove < 0 && rsiValue > 30)) {
              probability = 'HIGH';
            } else if ((currentMove > 0 && rsiValue > 80) || 
                       (currentMove < 0 && rsiValue < 20)) {
              probability = 'LOW';
            }
          }
          
          opportunities.push({
            type: 'MOMENTUM_SCALP',
            position: i,
            direction: currentMove > 0 ? 'BULLISH' : 'BEARISH',
            strength: Math.abs(currentMove / prevMove),
            probability,
            volumeConfirmation: volumeIncrease,
            rsiValue
          });
        }
      }
      
      // Range scalping opportunities
      if (i > 5) {
        const ranges = data
          .slice(i-5, i)
          .map(candle => candle.h - candle.l);
        const avgRange = ranges.reduce((a, b) => a + b) / ranges.length;
        const currentRange = data[i].h - data[i].l;
        
        // Look for tight consolidation
        if (currentRange < avgRange * 0.5) {
          const volumePattern = data[i].v < data[i-1].v && data[i-1].v < data[i-2].v;
          
          opportunities.push({
            type: 'RANGE_SCALP',
            position: i,
            rangeSize: currentRange,
            averageRange: avgRange,
            compressionRatio: avgRange / currentRange,
            volumeCompression: volumePattern,
            levels: {
              support: data[i].l,
              resistance: data[i].h
            }
          });
        }
      }
      
      // Breakout scalping setups
      if (i > 20) {
        const avgVolume = data
          .slice(i-20, i)
          .reduce((sum, candle) => sum + candle.v, 0) / 20;
          
        const isVolumeSurge = data[i].v > avgVolume * 2;
        const priceRange = data[i].h - data[i].l;
        const avgPriceRange = data
          .slice(i-5, i)
          .reduce((sum, candle) => sum + (candle.h - candle.l), 0) / 5;
        
        if (isVolumeSurge && priceRange > avgPriceRange * 1.5) {
          opportunities.push({
            type: 'BREAKOUT_SCALP',
            position: i,
            direction: data[i].c > data[i].o ? 'BULLISH' : 'BEARISH',
            volumeSurge: data[i].v / avgVolume,
            rangeExpansion: priceRange / avgPriceRange,
            confirmation: {
              volume: isVolumeSurge,
              momentum: priceRange > avgPriceRange * 1.5
            }
          });
        }
      }
      
      // Mean reversion scalping
      if (i > 10) {
        const avgPrice = data
          .slice(i-10, i)
          .reduce((sum, candle) => sum + (candle.h + candle.l) / 2, 0) / 10;
        const currentPrice = (data[i].h + data[i].l) / 2;
        const deviation = Math.abs(currentPrice - avgPrice) / avgPrice;
        
        if (deviation > 0.01) { // 1% deviation threshold
          opportunities.push({
            type: 'MEAN_REVERSION_SCALP',
            position: i,
            direction: currentPrice > avgPrice ? 'BEARISH' : 'BULLISH',
            deviation: deviation * 100, // Convert to percentage
            avgPrice,
            currentPrice,
            potentialTarget: avgPrice,
            riskLevel: deviation > 0.02 ? 'HIGH' : 'MEDIUM'
          });
        }
      }
    }
    
    // Sort opportunities by position
    opportunities.sort((a, b) => a.position - b.position);
    
    // Add additional metadata
    return {
      opportunities,
      stats: {
        total: opportunities.length,
        byType: opportunities.reduce((acc, opp) => {
          acc[opp.type] = (acc[opp.type] || 0) + 1;
          return acc;
        }, {}),
        successRate: calculateSuccessRate(opportunities, data)
      }
    };
  };


  const calculateSuccessRate = (opportunities, data) => {
    const results = opportunities.map(opp => {
      // Skip opportunities too close to the end of the dataset
      if (opp.position >= data.length - 5) return null;
      
      const nextFiveCandles = data.slice(opp.position + 1, opp.position + 6);
      let success = false;
      
      switch (opp.type) {
        case 'QUICK_REVERSAL':
          success = opp.direction === 'BULLISH' ? 
            Math.max(...nextFiveCandles.map(c => c.h)) > data[opp.position].h :
            Math.min(...nextFiveCandles.map(c => c.l)) < data[opp.position].l;
          break;
          
        case 'MOMENTUM_SCALP':
          const continuation = nextFiveCandles.some(candle => 
            opp.direction === 'BULLISH' ? 
              candle.c > data[opp.position].h :
              candle.c < data[opp.position].l
          );
          success = continuation;
          break;
          
        case 'RANGE_SCALP':
          const breakout = nextFiveCandles.some(candle =>
            candle.h > opp.levels.resistance || candle.l < opp.levels.support
          );
          success = breakout;
          break;
          
        case 'BREAKOUT_SCALP':
          success = opp.direction === 'BULLISH' ?
            nextFiveCandles.some(c => c.c > data[opp.position].h) :
            nextFiveCandles.some(c => c.c < data[opp.position].l);
          break;
          
        case 'MEAN_REVERSION_SCALP':
          const reversion = nextFiveCandles.some(candle => 
            Math.abs((candle.h + candle.l) / 2 - opp.avgPrice) / opp.avgPrice < 0.005
          );
          success = reversion;
          break;
      }
      
      return success;
    }).filter(result => result !== null);
    
    return {
      overall: results.filter(Boolean).length / results.length,
      sampleSize: results.length
    };
  };

  module.exports = { analyzeScalpingOpportunities };
  