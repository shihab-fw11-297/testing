const analyzeCandlestickPatterns = (data) => {
  const patterns = [];
  
  // Analyze each candle for patterns
  for (let i = 2; i < data.length; i++) {
    const current = data[i];
    const prev1 = data[i-1];
    const prev2 = data[i-2];

    // Pin Bar (Hammer/Shooting Star)
    if (isPinBar(current)) {
      patterns.push({
        type: 'PIN_BAR',
        position: i,
        direction: getPinBarDirection(current)
      });
    }

    // Engulfing Pattern
    if (isEngulfing(current, prev1)) {
      patterns.push({
        type: 'ENGULFING',
        position: i,
        direction: getEngulfingDirection(current, prev1)
      });
    }

    // Inside Bar
    if (isInsideBar(current, prev1)) {
      patterns.push({
        type: 'INSIDE_BAR',
        position: i
      });
    }

    // Morning/Evening Star
    if (isMorningStar(current, prev1, prev2)) {
      patterns.push({
        type: 'MORNING_STAR',
        position: i
      });
    } else if (isEveningStar(current, prev1, prev2)) {
      patterns.push({
        type: 'EVENING_STAR',
        position: i
      });
    }
  }

  return patterns;
};

// Helper functions for candlestick pattern detection
const isPinBar = (candle) => {
  const bodySize = Math.abs(candle.o - candle.c);
  const upperWick = candle.h - Math.max(candle.o, candle.c);
  const lowerWick = Math.min(candle.o, candle.c) - candle.l;
  const totalSize = candle.h - candle.l;

  return (upperWick > bodySize * 2 || lowerWick > bodySize * 2) && 
         bodySize < totalSize * 0.3;
};

const getPinBarDirection = (candle) => {
  const upperWick = candle.h - Math.max(candle.o, candle.c);
  const lowerWick = Math.min(candle.o, candle.c) - candle.l;
  
  return upperWick > lowerWick ? 'BEARISH' : 'BULLISH';
};

const isEngulfing = (current, prev) => {
  const currentBody = Math.abs(current.c - current.o);
  const prevBody = Math.abs(prev.c - prev.o);
  const currentBullish = current.c > current.o;
  const prevBullish = prev.c > prev.o;
  
  return currentBody > prevBody && 
         currentBullish !== prevBullish &&
         ((currentBullish && current.o <= prev.c && current.c > prev.o) ||
          (!currentBullish && current.o >= prev.c && current.c < prev.o));
};

const getEngulfingDirection = (current, prev) => {
  return current.c > current.o ? 'BULLISH' : 'BEARISH';
};

const isInsideBar = (current, prev) => {
  return current.h <= prev.h && 
         current.l >= prev.l;
};

const getBodySize = (candle) => {
  return Math.abs(candle.c - candle.o);
};

const isMorningStar = (current, prev1, prev2) => {
  // First candle should be bearish and large
  const firstBearish = prev2.c < prev2.o && getBodySize(prev2) > getBodySize(prev1);
  
  // Second candle should be small body with gap down
  const secondSmall = getBodySize(prev1) < getBodySize(prev2) * 0.3;
  const gapDown = Math.max(prev1.o, prev1.c) < prev2.c;
  
  // Third candle should be bullish and close above midpoint of first candle
  const thirdBullish = current.c > current.o;
  const closeAboveMidpoint = current.c > (prev2.o + prev2.c) / 2;
  
  return firstBearish && secondSmall && gapDown && thirdBullish && closeAboveMidpoint;
};

const isEveningStar = (current, prev1, prev2) => {
  // First candle should be bullish and large
  const firstBullish = prev2.c > prev2.o && getBodySize(prev2) > getBodySize(prev1);
  
  // Second candle should be small body with gap up
  const secondSmall = getBodySize(prev1) < getBodySize(prev2) * 0.3;
  const gapUp = Math.min(prev1.o, prev1.c) > prev2.c;
  
  // Third candle should be bearish and close below midpoint of first candle
  const thirdBearish = current.c < current.o;
  const closeBelowMidpoint = current.c < (prev2.o + prev2.c) / 2;
  
  return firstBullish && secondSmall && gapUp && thirdBearish && closeBelowMidpoint;
};

module.exports = { 
  analyzeCandlestickPatterns,
  isPinBar,
  getPinBarDirection,
  isEngulfing,
  getEngulfingDirection,
  isInsideBar,
  isMorningStar,
  isEveningStar
};