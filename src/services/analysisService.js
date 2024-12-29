const { findKeyLevels } = require('../analysis/marketStructure/keyLevels');
const { analyzeCandlestickPatterns } = require('../analysis/patterns/candlestickPatterns');
const { findChartPatterns } = require('../analysis/patterns/chartPatterns');
const { calculateMovingAverages } = require('../analysis/indicators/movingAverages');
const { analyzeBollingerBands } = require('../analysis/indicators/bollingerBands');
const { analyzeSwings } = require('../analysis/marketStructure/swingAnalysis');
const { analyzeMomentum } = require('../analysis/priceAction/momentumAnalysis');
const { calculateFibonacciLevels } = require('../analysis/indicators/fibonacci');
const { calculateRSI } = require('../analysis/indicators/rsi');
const { analyzeMACD } = require('../analysis/indicators/macd');
const { analyzeTrend } = require('../analysis/marketStructure/trendAnalysis');
const { analyzeScalpingOpportunities } = require('../analysis/strategies/scalping');
const ApiService = require('./apiService');

class AnalysisService {
  static async analyzeMarket(data, timeframe) {
    if (!data || data.length === 0) {
      throw new Error(`No data received for timeframe ${timeframe}`);
    }

    try {
      // Market Structure Analysis
      const trend = await analyzeTrend(data);
      const keyLevels = await findKeyLevels(data);
      const swings = await analyzeSwings(data);
      
      // Pattern Analysis
      const candlestickPatterns = await analyzeCandlestickPatterns(data);
      const chartPatterns = await findChartPatterns(data);
      const momentum = await analyzeMomentum(data);
      
      // Technical Indicators
      const fibonacci = await calculateFibonacciLevels(data);
      const rsi = await calculateRSI(data);
      const movingAverages = await calculateMovingAverages(data);
      const bollingerBands = await analyzeBollingerBands(data);
      const macd = await analyzeMACD(data);

      // Strategy Signals
      const scalpingOpportunities = await analyzeScalpingOpportunities(data, {
        rsi,
        momentum
      });
      
      const direction = await this.determineDirection({
        trend,
        keyLevels,
        candlestickPatterns,
        chartPatterns,
        movingAverages,
        bollingerBands,
        macd,
        rsi,
        fibonacci,
        momentum
      });

      return {
        timeframe,
        direction,
        signals: {
          trend,
          // rsi: rsi.values[rsi.values.length - 1],
          // macd: macd.signals,
          // momentum: momentum.impulses,
          // movingAverages: {
          //   ema9: movingAverages.ema9[movingAverages.ema9.length - 1],
          //   ema21: movingAverages.ema21[movingAverages.ema21.length - 1]
          // },
          // bollingerBands: bollingerBands.signals
        }
      };
    } catch (error) {
      console.error(`Analysis failed for timeframe ${timeframe}:`, error);
      throw new Error(`Analysis failed for timeframe ${timeframe}: ${error.message}`);
    }
  }

  static async analyzeMultiTimeframe(pair) {
    try {
      console.log(`Starting multi-timeframe analysis for ${pair}`);
      
      // Get data for different timeframes
      const timeframePromises = [
        ApiService.getForexData(pair, '2'),
        ApiService.getForexData(pair, '5'),
        ApiService.getForexData(pair, '15')
      ];

      const [twoMinData, fiveMinData, fifteenMinData] = await Promise.all(timeframePromises)
        .catch(error => {
          console.error('Error fetching timeframe data:', error);
          throw new Error(`Failed to fetch timeframe data: ${error.message}`);
        });

      console.log('Data fetched for all timeframes, starting analysis');

      // Analyze each timeframe
      const analysisPromises = [
        this.analyzeMarket(twoMinData, '2m'),
        this.analyzeMarket(fiveMinData, '5m'),
        this.analyzeMarket(fifteenMinData, '15m')
      ];

      const analyses = await Promise.all(analysisPromises)
        .catch(error => {
          console.error('Error during timeframe analysis:', error);
          throw new Error(`Failed to analyze timeframes: ${error.message}`);
        });

      console.log('All timeframe analyses completed, combining results');

      return this.combineTimeframeAnalyses(analyses);
    } catch (error) {
      console.error('Multi-timeframe analysis failed:', error);
      throw error;
    }
  }

  static determineDirection(analyses) {
    let score = 0;
    
    // Trend Analysis
    if (analyses.trend.trend === 'UPTREND') score += 2;
    if (analyses.trend.trend === 'DOWNTREND') score -= 2;
    
    // RSI
    const lastRSI = analyses.rsi.values[analyses.rsi.values.length - 1];
    if (lastRSI < 30) score += 1;
    if (lastRSI > 70) score -= 1;
    
    // Moving Averages
    const lastIndex = analyses.movingAverages.ema9.length - 1;
    if (analyses.movingAverages.ema9[lastIndex] > analyses.movingAverages.ema21[lastIndex]) {
      score += 1;
    } else {
      score -= 1;
    }
    
    // Bollinger Bands
    if (analyses.bollingerBands && analyses.bollingerBands.signals) {
      analyses.bollingerBands.signals.forEach(signal => {
        if (signal.type === 'BREAKOUT_UP') score += 1;
        if (signal.type === 'BREAKOUT_DOWN') score -= 1;
      });
    }
    
    // MACD
    if (analyses.macd && analyses.macd.signals) {
      analyses.macd.signals.forEach(signal => {
        if (signal.type === 'BULLISH_CROSSOVER' || 
            signal.type === 'BULLISH_DIVERGENCE') score += 1;
        if (signal.type === 'BEARISH_CROSSOVER' || 
            signal.type === 'BEARISH_DIVERGENCE') score -= 1;
      });
    }
    
    // Fibonacci Retracements
    if (analyses.fibonacci && analyses.fibonacci.retracements) {
      analyses.fibonacci.retracements.forEach(retracement => {
        if (retracement.direction === 'BULLISH') score += 0.5;
        if (retracement.direction === 'BEARISH') score -= 0.5;
      });
    }
    
    // Momentum
    if (analyses.momentum && analyses.momentum.impulses) {
      analyses.momentum.impulses.forEach(impulse => {
        if (impulse.direction === 'BULLISH') score += 0.5;
        if (impulse.direction === 'BEARISH') score -= 0.5;
      });
    }
    
    // Determine final direction with adjusted thresholds
    if (score > 4) return 'STRONGLY_BULLISH';
    if (score > 2) return 'BULLISH';
    if (score < -4) return 'STRONGLY_BEARISH';
    if (score < -2) return 'BEARISH';
    return 'NEUTRAL';
  }

  static combineTimeframeAnalyses(analyses) {
    // Weight assignments for different timeframes
    const weights = {
      '2m': 0.2,   // 20% weight for short-term
      '5m': 0.3,   // 30% weight for medium-term
      '15m': 0.5   // 50% weight for longer-term
    };

    let totalScore = 0;
    const signals = {};

    analyses.forEach(analysis => {
      if (!analysis || !analysis.timeframe) {
        console.error('Invalid analysis object:', analysis);
        return;
      }

      const timeframeWeight = weights[analysis.timeframe];
      let timeframeScore = 0;

      // Convert direction to score
      switch (analysis.direction) {
        case 'STRONGLY_BULLISH': timeframeScore = 2; break;
        case 'BULLISH': timeframeScore = 1; break;
        case 'NEUTRAL': timeframeScore = 0; break;
        case 'BEARISH': timeframeScore = -1; break;
        case 'STRONGLY_BEARISH': timeframeScore = -2; break;
        default:
          console.warn(`Unknown direction "${analysis.direction}" for timeframe ${analysis.timeframe}`);
          timeframeScore = 0;
      }

      // Apply timeframe weight
      totalScore += timeframeScore * timeframeWeight;

      // Store signals for each timeframe
      signals[analysis.timeframe] = {
        direction: analysis.direction,
        signals: analysis.signals
      };
    });

    // Determine final direction based on weighted score
    let finalDirection;
    if (totalScore >= 1.5) finalDirection = 'STRONGLY_BULLISH';
    else if (totalScore >= 0.5) finalDirection = 'BULLISH';
    else if (totalScore <= -1.5) finalDirection = 'STRONGLY_BEARISH';
    else if (totalScore <= -0.5) finalDirection = 'BEARISH';
    else finalDirection = 'NEUTRAL';

    return {
      direction: finalDirection,
      confidence: Math.abs(totalScore) / 2, // Normalized confidence score (0-1)
      timeframes: signals,
      weightedScore: totalScore
    };
  }
}

module.exports = AnalysisService;