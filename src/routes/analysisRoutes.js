const express = require('express');
const router = express.Router();
const AnalysisService = require('../services/analysisService');
const ApiService = require('../services/apiService');

router.get('/analyze/:pair', async (req, res) => {
  try {
    const { pair } = req.params;
    
    console.log(`Starting analysis for pair: ${pair}`);
    const analysis = await AnalysisService.analyzeMultiTimeframe(pair);
    
    res.json({
      success: true,
      pair,
      timestamp: new Date().toISOString(),
      analysis
    });
  } catch (error) {
    console.error('Analysis route error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;