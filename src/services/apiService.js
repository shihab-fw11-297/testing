const axios = require('axios');
const config = require('../config/config');
const moment = require('moment');

class ApiService {
  static async getForexData(pair, resolution = '1') {
    // Get current time in UTC
    const now = moment().utc();
    
    // Get today's and yesterday's date
    const endDate = now.format('YYYY-MM-DD');
    const startDate = now.subtract(1, 'days').format('YYYY-MM-DD');
    
    // Calculate start and end times
    const endTime = now.format('HH:mm');
    const startTime = moment().utc().subtract(3, 'hours').format('HH:mm');
    
    const url = `${config.API_BASE_URL}/agg/forex/${pair}/${resolution}/minute/${startDate}/${endDate}`;
    
    // Construct full URL with query parameters
    const fullUrl = `${url}?apikey=${config.API_KEY}&st=${startTime}&et=${endTime}`;
    console.log('Requesting Forex Data from:', fullUrl);
    //1735183980000
    
    try {
      const response = await axios.get(url, {
        params: {
          apikey: config.API_KEY,
          st: startTime,
          et: endTime
        }
      });
      
      console.log('Request successful');
      return response.data?.results;
    } catch (error) {
      console.error('API request failed:', error.message);
      throw new Error(`Failed to fetch forex data: ${error.message}`);
    }
  }
}

module.exports = ApiService;