/**
 * Paystack API Client
 * Handles all HTTP requests to Paystack API with authentication and error handling
 */

import { paystackConfig, validateConfig } from './config/paystackConfig.js';
import { PaystackError } from './errors/paystackError.js';

class PaystackClient {
  constructor(config = paystackConfig) {
    this.config = config;
    this.baseURL = config.baseURL;
    this.secretKey = config.secretKey;
    this.timeout = config.timeout;
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
   * Build URL with query parameters
   */
  buildURL(endpoint, params = {}) {
    const queryString = this.buildQueryString(params);
    return `${this.baseURL}${endpoint}${queryString}`;
  }

  /**
   * Create timeout promise
   */
  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });
  }

  /**
   * Make HTTP request to Paystack API
   */
  async request(endpoint, options = {}) {
    const url = this.buildURL(endpoint, options.params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const config = {
      ...options,
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Remove params from config as they're already in URL
    delete config.params;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw PaystackError.fromResponse({
          status: response.status,
          data: errorData,
        });
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new PaystackError('Request timeout', 408);
      }

      if (error instanceof PaystackError) {
        throw error;
      }

      throw new PaystackError(
        error.message || 'Network error occurred',
        null,
        { message: error.message }
      );
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
   * POST request
   */
  async post(endpoint, data = {}, params = {}) {
    return this.request(endpoint, {
      method: 'POST',
      params,
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}, params = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      params,
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, params = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      params,
    });
  }

  /**
   * Check if client is properly configured
   */
  isConfigured() {
    try {
      validateConfig();
      return true;
    } catch (error) {
      console.error('Paystack client configuration error:', error.message);
      return false;
    }
  }
}

/**
 * Create a singleton instance of the Paystack client
 */
let clientInstance = null;

export function getPaystackClient() {
  if (!clientInstance) {
    clientInstance = new PaystackClient();
  }

  if (!clientInstance.isConfigured()) {
    console.warn('Paystack client is not properly configured');
  }

  return clientInstance;
}

/**
 * Create a new Paystack client instance (for testing or custom config)
 */
export function createPaystackClient(config) {
  return new PaystackClient(config);
}

export default PaystackClient;