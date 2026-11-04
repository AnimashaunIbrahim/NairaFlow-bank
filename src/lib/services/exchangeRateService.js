/**
 * Exchange Rate Service
 * Business logic layer for exchange rate operations
 */

import { getExchangeRateRepository } from '../repositories/exchangeRateRepository.js';
import { ExchangeRateAdapter } from '../adapters/exchangeRateAdapter.js';
import { xchangeratesConfig } from '../config/xchangeratesConfig.js';

class ExchangeRateService {
  constructor(repository = null) {
    this.repository = repository || getExchangeRateRepository();
    this.cache = null;
    this.cacheTime = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get latest exchange rates with caching
   * @param {Object} options - Options
   * @param {string} options.base - Base currency
   * @param {boolean} options.forceRefresh - Force refresh cache
   * @returns {Promise<Object>} Exchange rates
   */
  async getLatestRates(options = {}) {
    const { base = 'USD', forceRefresh = false, symbols = ['USD', 'EUR', 'GBP', 'NGN', 'AED'] } = options;
    
    // Check cache
    if (!forceRefresh && this.cache && this.cacheTime) {
      const now = Date.now();
      if (now - this.cacheTime < this.cacheDuration) {
        return this.cache;
      }
    }

    try {
      if (xchangeratesConfig.useMock) {
        // Fallback to mock data with only 5 major currencies
        const { EXCHANGE_RATES } = await import('../../mocks/data.js');
        const filteredRates = {};
        symbols.forEach(symbol => {
          if (EXCHANGE_RATES[symbol] !== undefined) {
            filteredRates[symbol] = EXCHANGE_RATES[symbol];
          }
        });
        const ratesData = {
          base: 'NGN',
          rates: filteredRates,
          timestamp: Math.floor(Date.now() / 1000),
          lastUpdated: new Date().toISOString(),
        };
        const converted = ExchangeRateAdapter.toAppFormat(ratesData, 'NGN');
        this.cache = converted;
        this.cacheTime = Date.now();
        return converted;
      }

      const ratesData = await this.repository.getLatestRates({ base, symbols });
      const filteredRates = {};
      symbols.forEach(symbol => {
        if (ratesData.rates[symbol] !== undefined) {
          filteredRates[symbol] = ratesData.rates[symbol];
        }
      });
      ratesData.rates = filteredRates;
      const converted = ExchangeRateAdapter.toAppFormat(ratesData, 'NGN');
      
      this.cache = converted;
      this.cacheTime = Date.now();
      
      return converted;
    } catch (error) {
      console.error('Error in ExchangeRateService.getLatestRates:', error);
      
      // Fallback to mock data on error
      try {
        const { EXCHANGE_RATES } = await import('../../mocks/data.js');
        const filteredRates = {};
        symbols.forEach(symbol => {
          if (EXCHANGE_RATES[symbol] !== undefined) {
            filteredRates[symbol] = EXCHANGE_RATES[symbol];
          }
        });
        const ratesData = {
          base: 'NGN',
          rates: filteredRates,
          timestamp: Math.floor(Date.now() / 1000),
          lastUpdated: new Date().toISOString(),
        };
        const converted = ExchangeRateAdapter.toAppFormat(ratesData, 'NGN');
        return converted;
      } catch (mockError) {
        throw error;
      }
    }
  }

  /**
   * Convert amount between currencies
   * @param {number} amount - Amount to convert
   * @param {string} from - From currency
   * @param {string} to - To currency
   * @returns {Promise<number>} Converted amount
   */
  async convert(amount, from, to) {
    try {
      const ratesData = await this.getLatestRates();
      return ExchangeRateAdapter.convert(amount, from, to, ratesData);
    } catch (error) {
      console.error('Error converting currency:', error);
      throw error;
    }
  }

  /**
   * Get supported currencies
   * @returns {Promise<Array<string>>} List of supported currencies
   */
  async getSupportedCurrencies() {
    try {
      const ratesData = await this.getLatestRates();
      return ExchangeRateAdapter.getSupportedCurrencies(ratesData);
    } catch (error) {
      console.error('Error getting supported currencies:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = null;
    this.cacheTime = null;
  }
}

/**
 * Create a singleton instance of the exchange rate service
 */
let exchangeRateServiceInstance = null;

export function getExchangeRateService() {
  if (!exchangeRateServiceInstance) {
    exchangeRateServiceInstance = new ExchangeRateService();
  }
  return exchangeRateServiceInstance;
}

/**
 * Create a new exchange rate service instance
 */
export function createExchangeRateService(repository) {
  return new ExchangeRateService(repository);
}

export default ExchangeRateService;
