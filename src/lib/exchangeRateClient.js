/**
 * OpenExchangeRates API Client
 * Handles all HTTP requests to OpenExchangeRates API
 */

import { xchangeratesConfig, validateExchangeRateConfig } from './config/xchangeratesConfig.js';

class ExchangeRateClient {
  constructor(config = xchangeratesConfig) {
    this.config = config;
    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;
    this.timeout = 30000;
  }

  /**
   * Build query string from parameters
   */
  buildQueryString(params) {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return `?${searchParams.toString()}`;
  }

  /**
   * Build URL with query parameters including app_id
   */
  buildURL(endpoint, params = {}) {
    const allParams = {
      app_id: this.apiKey,
      ...params,
    };
    const queryString = this.buildQueryString(allParams);
    return `${this.baseURL}${endpoint.replace(/^\//, '')}${queryString}`;
  }

  /**
   * Make HTTP request to OpenExchangeRates API
   */
  async request(endpoint, options = {}) {
    const url = this.buildURL(endpoint, options.params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...(options.body ? { body: options.body } : {}),
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.description || errorData.message || `HTTP error ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    return this.request(endpoint, {
      method: 'GET',
      params,
    });
  }

  /**
   * Check if client is properly configured
   */
  isConfigured() {
    try {
      validateExchangeRateConfig();
      return true;
    } catch (error) {
      console.error('Exchange rate client configuration error:', error.message);
      return false;
    }
  }
}

/**
 * Create a singleton instance of the Exchange Rate client
 */
let exchangeRateClientInstance = null;

export function getExchangeRateClient() {
  if (!exchangeRateClientInstance) {
    exchangeRateClientInstance = new ExchangeRateClient();
  }

  if (!exchangeRateClientInstance.isConfigured()) {
    console.warn('Exchange rate client is not properly configured');
  }

  return exchangeRateClientInstance;
}

/**
 * Create a new Exchange Rate client instance
 */
export function createExchangeRateClient(config) {
  return new ExchangeRateClient(config);
}

export default ExchangeRateClient;
