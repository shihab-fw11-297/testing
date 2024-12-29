const findSwingPoints = (data, swingSize = 3) => {
    const highs = [];
    const lows = [];
    
    // Need at least 2 * swingSize + 1 candles to find swing points
    if (data.length < 2 * swingSize + 1) {
      return { highs, lows };
    }
  
    // Find swing highs
    for (let i = swingSize; i < data.length - swingSize; i++) {
      let isSwingHigh = true;
      let isSwingLow = true;
      
      // Check if current point is higher than surrounding points
      for (let j = i - swingSize; j <= i + swingSize; j++) {
        if (j === i) continue;
        
        if (data[j].h >= data[i].h) {
          isSwingHigh = false;
        }
        if (data[j].l <= data[i].l) {
          isSwingLow = false;
        }
      }
      
      if (isSwingHigh) {
        highs.push({
          price: data[i].h,
          index: i,
          timestamp: data[i].t // Assuming each data point has a timestamp
        });
      }
      
      if (isSwingLow) {
        lows.push({
          price: data[i].l,
          index: i,
          timestamp: data[i].t
        });
      }
    }
  
    // Filter out noise by removing swing points that are too close together
    const filteredHighs = filterClosePoints(highs);
    const filteredLows = filterClosePoints(lows);
    
    return {
      highs: filteredHighs,
      lows: filteredLows
    };
  };
  
  // Helper function to filter out swing points that are too close together
  const filterClosePoints = (points, minDistance = 5) => {
    if (points.length <= 1) return points;
    
    const filtered = [points[0]];
    
    for (let i = 1; i < points.length; i++) {
      const lastPoint = filtered[filtered.length - 1];
      const currentPoint = points[i];
      
      // If points are far enough apart or the current point is more extreme, add it
      if (currentPoint.index - lastPoint.index >= minDistance) {
        filtered.push(currentPoint);
      } else {
        // Replace the last point if current point is more extreme
        if (Math.abs(currentPoint.price) > Math.abs(lastPoint.price)) {
          filtered[filtered.length - 1] = currentPoint;
        }
      }
    }
    
    return filtered;
  };
  
  module.exports = { findSwingPoints };