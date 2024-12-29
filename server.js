// server.js
const express = require('express');
const app = express();
const config = require('./src/config/config');
const analysisRoutes = require('./src/routes/analysisRoutes');
const CronSignalMonitor = require('./monitorRunner');

// Add error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process
});

// Add error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process
});

app.use(express.json());
app.use('/api', analysisRoutes);

const server = app.listen(config.PORT, () => {
  const monitorConfig = {
    pair: 'EURUSD'
  };
  
  const monitor = new CronSignalMonitor(monitorConfig);
  monitor.start();
  console.log(`Server running on port ${config.PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  // Don't exit the process
});