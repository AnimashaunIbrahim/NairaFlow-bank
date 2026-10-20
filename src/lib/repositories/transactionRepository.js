/**
 * Transaction Repository
 * Handles all transaction-related API calls to Paystack
 */

import { getPaystackClient } from '../paystackClient.js';
import { TransactionAdapter } from '../adapters/transactionAdapter.js';

class TransactionRepository {
  constructor(client = null) {
    this.client = client || getPaystackClient();
  }

  /**
   * List all transactions with optional filters
   * @param {Object} filters - Query parameters for filtering
   * @param {string} filters.perPage - Number of results per page
   * @param {string} filters.page - Page number to retrieve
   * @param {string} filters.from - Start date to filter transactions
   * @param {string} filters.to - End date to filter transactions
   * @param {string} filters.customer - Customer ID to filter
   * @param {string} filters.status - Transaction status to filter
   * @returns {Promise<Object>} Paginated transaction list
   */
  async listTransactions(filters = {}) {
    const response = await this.client.get('/transaction', filters);
    
    return {
      data: TransactionAdapter.fromPaystackArray(response.data),
      meta: TransactionAdapter.extractPagination(response),
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Get a single transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransaction(id) {
    const response = await this.client.get(`/transaction/${id}`);
    
    return {
      data: TransactionAdapter.fromPaystack(response.data),
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Verify a transaction using its reference
   * @param {string} reference - Transaction reference
   * @returns {Promise<Object>} Verification result
   */
  async verifyTransaction(reference) {
    const response = await this.client.get(`/transaction/verify/${reference}`);
    
    return {
      data: TransactionAdapter.fromPaystack(response.data),
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Initialize a transaction
   * @param {Object} transactionData - Transaction initialization data
   * @param {string} transactionData.email - Customer email
   * @param {number} transactionData.amount - Amount in kobo
   * @param {string} transactionData.currency - Currency code
   * @param {string} transactionData.reference - Unique transaction reference
   * @param {Object} transactionData.metadata - Additional metadata
   * @param {string} transactionData.callbackUrl - URL for Paystack callback
   * @param {Array} transactionData.channels - Payment channels to use
   * @returns {Promise<Object>} Initialization result with payment URL
   */
  async initializeTransaction(transactionData) {
    const payload = TransactionAdapter.toPaystackInitialize(transactionData);
    const response = await this.client.post('/transaction/initialize', payload);
    
    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Charge an existing authorization
   * @param {Object} chargeData - Authorization charge data
   * @param {string} chargeData.reference - Transaction reference
   * @param {string} chargeData.authorization_code - Authorization code
   * @param {string} chargeData.email - Customer email
   * @param {number} chargeData.amount - Amount in kobo
   * @returns {Promise<Object>} Charge result
   */
  async chargeAuthorization(chargeData) {
    const response = await this.client.post('/transaction/charge_authorization', chargeData);
    
    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  }

  /**
   * View transaction timeline
   * @param {string} id - Transaction ID
   * @returns {Promise<Object>} Transaction timeline
   */
  async getTransactionTimeline(id) {
    const response = await this.client.get(`/transaction/timeline/${id}`);
    
    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Get totals for transactions
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} Transaction totals
   */
  async getTransactionTotals(filters = {}) {
    const response = await this.client.get('/transaction/totals', filters);
    
    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Export transactions
   * @param {Object} filters - Filter parameters
   * @param {string} filters.from - Start date
   * @param {string} filters.to - End date
   * @param {string} filters.customer - Customer ID
   * @param {string} filters.status - Transaction status
   * @returns {Promise<Object>} Export result with download URL
   */
  async exportTransactions(filters = {}) {
    const response = await this.client.get('/transaction/export', filters);
    
    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Get partial debit transactions
   * @returns {Promise<Object>} Partial debit transactions
   */
  async getPartialDebits() {
    const response = await this.client.get('/transaction/partial_debit');
    
    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Search transactions by reference
   * @param {string} query - Search query
   * @returns {Promise<Object>} Search results
   */
  async searchTransactions(query) {
    const response = await this.client.get('/transaction/search', { query });
    
    return {
      data: TransactionAdapter.fromPaystackArray(response.data),
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Get recent transactions (convenience method)
   * @param {number} limit - Number of recent transactions to fetch
   * @returns {Promise<Object>} Recent transactions
   */
  async getRecentTransactions(limit = 10) {
    return this.listTransactions({
      perPage: limit,
      page: 1,
    });
  }

  /**
   * Get transactions by customer
   * @param {string} customerId - Customer ID or email
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Customer transactions
   */
  async getCustomerTransactions(customerId, filters = {}) {
    return this.listTransactions({
      ...filters,
      customer: customerId,
    });
  }

  /**
   * Get transactions by date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Transactions in date range
   */
  async getTransactionsByDateRange(startDate, endDate, filters = {}) {
    return this.listTransactions({
      ...filters,
      from: startDate,
      to: endDate,
    });
  }

  /**
   * Get transactions by status
   * @param {string} status - Transaction status
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Transactions with specified status
   */
  async getTransactionsByStatus(status, filters = {}) {
    return this.listTransactions({
      ...filters,
      status,
    });
  }
}

/**
 * Create a singleton instance of the transaction repository
 */
let transactionRepositoryInstance = null;

export function getTransactionRepository() {
  if (!transactionRepositoryInstance) {
    transactionRepositoryInstance = new TransactionRepository();
  }
  return transactionRepositoryInstance;
}

/**
 * Create a new transaction repository instance (for testing or custom config)
 */
export function createTransactionRepository(client) {
  return new TransactionRepository(client);
}

export default TransactionRepository;