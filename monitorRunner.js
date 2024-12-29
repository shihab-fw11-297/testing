// cronMonitor.js
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const AnalysisService = require('./src/services/analysisService');

class CronSignalMonitor {
  constructor(config = {}) {
    this.pair = config.pair || 'EURUSD';
    this.signalsPath = path.join(__dirname, 'signals.json');
    this.ordersPath = path.join(__dirname, 'orders.json');
    this.requiredConsistentSignals = 3;
  }

  async init() {
    // Initialize files if they don't exist
    for (const filePath of [this.signalsPath, this.ordersPath]) {
      try {
        await fs.access(filePath);
      } catch {
        await fs.writeFile(filePath, JSON.stringify([], null, 2));
      }
    }
  }

  async checkAndStoreSignal() {
    try {
      const analysis = await AnalysisService.analyzeMultiTimeframe(this.pair);
      const timestamp = new Date().toISOString();
      const signal = {
        timestamp,
        direction: analysis.direction,
        confidence: analysis.confidence,
        weightedScore: analysis.weightedScore
      };

      // Read existing signals
      let signals = [];
      try {
        const data = await fs.readFile(this.signalsPath, 'utf8');
        signals = JSON.parse(data);
      } catch (error) {
        console.error('Error reading signals file:', error);
        signals = [];
      }

      signals.push(signal);
      console.log(`Current signals count: ${signals.length}`);

      // Check if we have enough signals to make a decision
      if (signals.length >= this.requiredConsistentSignals) {
        const lastFourSignals = signals.slice(-this.requiredConsistentSignals);
        const directions = lastFourSignals.map(s => s.direction);
        const isConsistent = directions.every(dir => dir === directions[0]);

        if (isConsistent) {
          await this.updateOrders(directions[0], timestamp);
          // Clear signals after processing
          await fs.writeFile(this.signalsPath, JSON.stringify([], null, 2), { flag: 'w' });
          console.log('Signals processed and file cleared');
        } else {
          // Keep only the last 3 signals if we don't have consistency
          signals = signals.slice(-3);
          await fs.writeFile(this.signalsPath, JSON.stringify(signals, null, 2), { flag: 'w' });
        }
      } else {
        // Just update signals file normally
        await fs.writeFile(this.signalsPath, JSON.stringify(signals, null, 2), { flag: 'w' });
      }

    } catch (error) {
      console.error('Error in checkAndStoreSignal:', error);
    }
  }

  async updateOrders(direction, timestamp) {
    try {
      let orders = [];
      try {
        const data = await fs.readFile(this.ordersPath, 'utf8');
        orders = JSON.parse(data);
      } catch (error) {
        console.error('Error reading orders file:', error);
        orders = [];
      }

      const lastOrder = orders[orders.length - 1];

      // Check if we need to close previous order
      if (lastOrder && lastOrder.type === 'OPEN' && lastOrder.direction !== direction) {
        orders.push({
          type: 'CLOSE',
          direction: lastOrder.direction,
          timestamp,
          pair: this.pair
        });
      }

      // Create new order if different from last open order
      if (!lastOrder || lastOrder.type === 'CLOSE' || lastOrder.direction !== direction) {
        orders.push({
          type: 'OPEN',
          direction,
          timestamp,
          pair: this.pair
        });
      }

      await fs.writeFile(this.ordersPath, JSON.stringify(orders, null, 2), { flag: 'w' });
      console.log(`Order updated: ${direction} at ${timestamp}`);
    } catch (error) {
      console.error('Error updating orders:', error);
    }
  }

  start() {
    this.init()
      .then(() => {
        // Run every 1 minute
        cron.schedule('*/1 * * * *', () => {
          this.checkAndStoreSignal();
        });
        console.log('Cron monitor started');
      })
      .catch(error => {
        console.error('Failed to initialize monitor:', error);
      });
  }
}

module.exports = CronSignalMonitor;