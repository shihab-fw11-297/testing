// src/config/config.js
require('dotenv').config();

module.exports = {
  API_KEY: `API_KEY0eCP3AS1W5VA426061GRKH7GQSZNLSNR`,
  API_BASE_URL: 'https://api.finage.co.uk',
  PORT: process.env.PORT || 3000,
  SCORE_THRESHOLD: {
    BULLISH: 3,
    BEARISH: -3
  }
};