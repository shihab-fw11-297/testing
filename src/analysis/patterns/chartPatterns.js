const { findSwingPoints } = require("./findSwingPoints");

// src/analysis/patterns/chartPatterns.js
const findChartPatterns = (data) => {
  return {
    headAndShoulders: findHeadAndShoulders(data),
    doubleTop: findDoubleTop(data),
    doubleBottom: findDoubleBottom(data),
    triangles: findTrianglePatterns(data),
    wedges: findWedgePatterns(data),
    flags: findFlagPatterns(data),
  };
};

const isHeadAndShoulders = (leftShoulder, head, rightShoulder) => {
  // Head should be higher than both shoulders
  const isHeadHigher =
    head.price > leftShoulder.price && head.price > rightShoulder.price;

  // Shoulders should be roughly at the same level (within 5% difference)
  const shoulderDiff = Math.abs(leftShoulder.price - rightShoulder.price);
  const shoulderAvg = (leftShoulder.price + rightShoulder.price) / 2;
  const areShouldersSimilar = shoulderDiff / shoulderAvg < 0.05;

  return isHeadHigher && areShouldersSimilar;
};

const calculateTrendline = (points) => {
  if (points.length < 2) return null;

  // Simple linear regression
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  const n = points.length;

  points.forEach((point) => {
    sumX += point.index;
    sumY += point.price;
    sumXY += point.index * point.price;
    sumX2 += point.index * point.index;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    start: points[0],
    end: points[points.length - 1],
    getY: (x) => slope * x + intercept,
  };
};

const isConverging = (line1, line2) => {
  // Lines are converging if their slopes are moving toward each other
  return (
    (line1.slope > line2.slope && line1.slope < 0 && line2.slope > 0) ||
    (line1.slope < line2.slope && line1.slope > 0 && line2.slope < 0)
  );
};

const findDoubleTop = (data) => {
  const patterns = [];
  const swings = findSwingPoints(data);

  for (let i = 1; i < swings.highs.length - 1; i++) {
    const firstPeak = swings.highs[i - 1];
    const secondPeak = swings.highs[i];
    const valley = findValleyBetweenPeaks(swings.lows, firstPeak, secondPeak);

    if (valley && isDoubleTop(firstPeak, secondPeak, valley)) {
      patterns.push({
        type: "DOUBLE_TOP",
        points: {
          firstPeak,
          valley,
          secondPeak,
        },
        neckline: valley.price,
      });
    }
  }

  return patterns;
};

const findDoubleBottom = (data) => {
  const patterns = [];
  const swings = findSwingPoints(data);

  for (let i = 1; i < swings.lows.length - 1; i++) {
    const firstTrough = swings.lows[i - 1];
    const secondTrough = swings.lows[i];
    const peak = findPeakBetweenTroughs(
      swings.highs,
      firstTrough,
      secondTrough
    );

    if (peak && isDoubleBottom(firstTrough, secondTrough, peak)) {
      patterns.push({
        type: "DOUBLE_BOTTOM",
        points: {
          firstTrough,
          peak,
          secondTrough,
        },
        neckline: peak.price,
      });
    }
  }

  return patterns;
};

const isDoubleTop = (firstPeak, secondPeak, valley) => {
  // Peaks should be at similar levels (within 2%)
  const peakDiff = Math.abs(firstPeak.price - secondPeak.price);
  const peakAvg = (firstPeak.price + secondPeak.price) / 2;
  const arePeaksSimilar = peakDiff / peakAvg < 0.02;

  // Valley should be significantly lower (at least 5% below peaks)
  const valleyDepth = (peakAvg - valley.price) / peakAvg;
  const isValleyDeep = valleyDepth > 0.05;

  // Peaks should be separated by enough time
  const timeBetweenPeaks = secondPeak.index - firstPeak.index;
  const isTimeValid = timeBetweenPeaks >= 10 && timeBetweenPeaks <= 100;

  return arePeaksSimilar && isValleyDeep && isTimeValid;
};

const isDoubleBottom = (firstTrough, secondTrough, peak) => {
  // Troughs should be at similar levels (within 2%)
  const troughDiff = Math.abs(firstTrough.price - secondTrough.price);
  const troughAvg = (firstTrough.price + secondTrough.price) / 2;
  const areTroughsSimilar = troughDiff / troughAvg < 0.02;

  // Peak should be significantly higher (at least 5% above troughs)
  const peakHeight = (peak.price - troughAvg) / troughAvg;
  const isPeakHigh = peakHeight > 0.05;

  // Troughs should be separated by enough time
  const timeBetweenTroughs = secondTrough.index - firstTrough.index;
  const isTimeValid = timeBetweenTroughs >= 10 && timeBetweenTroughs <= 100;

  return areTroughsSimilar && isPeakHigh && isTimeValid;
};

const findValleyBetweenPeaks = (lows, firstPeak, secondPeak) => {
  return lows.find(
    (low) => low.index > firstPeak.index && low.index < secondPeak.index
  );
};

const findPeakBetweenTroughs = (highs, firstTrough, secondTrough) => {
  return highs.find(
    (high) => high.index > firstTrough.index && high.index < secondTrough.index
  );
};

const findHeadAndShoulders = (data) => {
  const patterns = [];
  const swings = findSwingPoints(data);

  for (let i = 2; i < swings.highs.length - 2; i++) {
    const leftShoulder = swings.highs[i - 2];
    const head = swings.highs[i];
    const rightShoulder = swings.highs[i + 2];

    if (isHeadAndShoulders(leftShoulder, head, rightShoulder)) {
      patterns.push({
        type: "HEAD_AND_SHOULDERS",
        points: {
          leftShoulder,
          head,
          rightShoulder,
        },
      });
    }
  }

  return patterns;
};

const findWedgePatterns = (data) => {
  const patterns = [];
  const swings = findSwingPoints(data);

  // Look for converging trendlines
  for (let i = 3; i < swings.highs.length - 1; i++) {
    const highTrendline = calculateTrendline(swings.highs.slice(i - 3, i + 1));
    const lowTrendline = calculateTrendline(swings.lows.slice(i - 3, i + 1));

    if (isConverging(highTrendline, lowTrendline)) {
      patterns.push({
        type: "WEDGE",
        direction:
          highTrendline.slope > lowTrendline.slope ? "FALLING" : "RISING",
        start: i - 3,
        end: i,
        trendlines: { high: highTrendline, low: lowTrendline },
      });
    }
  }

  return patterns;
};

const findTrianglePatterns = (data) => {
  const patterns = [];
  const swings = findSwingPoints(data);

  // Look for triangle patterns
  for (let i = 3; i < swings.highs.length - 1; i++) {
    const highTrendline = calculateTrendline(swings.highs.slice(i - 3, i + 1));
    const lowTrendline = calculateTrendline(swings.lows.slice(i - 3, i + 1));

    if (Math.abs(highTrendline.slope) < 0.1 && lowTrendline.slope > 0) {
      patterns.push({
        type: "ASCENDING_TRIANGLE",
        start: i - 3,
        end: i,
        trendlines: { high: highTrendline, low: lowTrendline },
      });
    } else if (highTrendline.slope < 0 && Math.abs(lowTrendline.slope) < 0.1) {
      patterns.push({
        type: "DESCENDING_TRIANGLE",
        start: i - 3,
        end: i,
        trendlines: { high: highTrendline, low: lowTrendline },
      });
    } else if (Math.abs(highTrendline.slope + lowTrendline.slope) < 0.1) {
      patterns.push({
        type: "SYMMETRICAL_TRIANGLE",
        start: i - 3,
        end: i,
        trendlines: { high: highTrendline, low: lowTrendline },
      });
    }
  }

  return patterns;
};

const findFlagPatterns = (data) => {
  const patterns = [];
  const swings = findSwingPoints(data);

  for (let i = 4; i < swings.highs.length - 1; i++) {
    // Look for strong trend (pole) followed by parallel lines (flag)
    const preFlagMove = Math.abs(data[i - 4].c - data[i - 2].c);
    const flagHeight = Math.abs(swings.highs[i].price - swings.lows[i].price);

    if (preFlagMove > flagHeight * 2) {
      const highTrendline = calculateTrendline(
        swings.highs.slice(i - 2, i + 1)
      );
      const lowTrendline = calculateTrendline(swings.lows.slice(i - 2, i + 1));

      if (Math.abs(highTrendline.slope - lowTrendline.slope) < 0.1) {
        patterns.push({
          type: "FLAG",
          direction: data[i - 4].c < data[i - 2].c ? "BULLISH" : "BEARISH",
          start: i - 4,
          end: i,
          pole: { start: i - 4, end: i - 2 },
          flag: { start: i - 2, end: i },
        });
      }
    }
  }

  return patterns;
};

module.exports = { findChartPatterns };
