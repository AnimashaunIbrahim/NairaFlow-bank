/**
 * Exchange Rate Repository
 * Handles all exchange rate-related API calls to OpenExchangeRates
 */

import { getExchangeRateClient } from '../exchangeRateClient.js';
import { ExchangeRateAdapter } from '../adapters/exchangeRateAdapter.js';
import { xchangeratesConfig } from '../config/xchangeratesConfig.js';

class ExchangeRateRepository {
  constructor(client = null) {
    this.client = client || getExchangeRateClient();
  }

  /**
   * Get latest exchange rates
   * @param {Object} options - Options for fetching rates
   * @param {string} options.base - Base currency (default: USD for free plan, but we can convert)
   * @param {Array<string>} options.symbols - Specific currencies to fetch
   * @returns {Promise<Object>} Exchange rates data
   */
  async getLatestRates(options = {}) {
    try {
      const { base, symbols } = options;
      const params = {};
      
      if (base) {
        params.base = base;
      }
      
      if (symbols && Array.isArray(symbols)) {
        params.symbols = symbols.join(',');
      }
      
      const response = await this.client.get(xchangeratesConfig.endpoints.latest, params);
      return ExchangeRateAdapter.fromLatestResponse(response);
    } catch (error) {
      console.error('Error fetching latest exchange rates:', error);
      throw error;
    }
  }

  /**
   * Get currencies list
   * @returns {Promise<Object>} Currencies object
   */
  async getCurrencies() {
    try {
      const response = await this.client.get(xchangeratesConfig.endpoints.currencies);
      return response;
    } catch (error) {
      console.error('Error fetching currencies:', error);
      throw error;
    }
  }

  /**
   * Convert currency (if using convert endpoint)
   * @param {Object} params - Conversion parameters
   * @param {number} params.value - Value to convert
   * @param {string} params.from - From currency
   * @param {string} params.to - To currency
   * @returns {Promise<Object>} Conversion result
   */
  async convertCurrency(params = {}) {
    try {
      const response = await this.client.get(xchangeratesConfig.endpoints.convert, params);
      return response;
    } catch (error) {
      console.error('Error converting currency:', error);
      throw error;
    }
  }

  /**
   * Get historical rates
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Historical rates
   */
  async getHistoricalRates(date, options = {}) {
    try {
      const params = { ...options };
      const response = await this.client.get(`/historical/${date}.json`, params);
      return ExchangeRateAdapter.fromLatestResponse(response);
    } catch (error) {
      console.error('Error fetching historical exchange rates:', error);
      throw error;
    }
  }
}

/**
 * Create a singleton instance of the exchange rate repository
 */
let exchangeRateRepositoryInstance = null;

export function getExchangeRateRepository() {
  if (!exchangeRateRepositoryInstance) {
    exchangeRateRepositoryInstance = new ExchangeRateRepository();
  }
  return exchangeRateRepositoryInstance;
}

/**
 * Create a new exchange rate repository instance
 */
export function createExchangeRateRepository(client) {
  return new ExchangeRateRepository(client);
}

export default ExchangeRateRepository;
