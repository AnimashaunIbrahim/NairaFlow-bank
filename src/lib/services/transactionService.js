/**
 * Transaction Service
 * Business logic layer for transaction operations
 */

import { getTransactionRepository } from '../repositories/transactionRepository.js';
import { TransactionAdapter } from '../adapters/transactionAdapter.js';
import { paystackConfig } from '../config/paystackConfig.js';

class TransactionService {
  constructor(repository = null) {
    this.repository = repository || getTransactionRepository();
  }

  /**
   * Fetch all transactions with optional filtering
   * @param {Object} filters - Filter options
   * @param {string} filters.status - Filter by status
   * @param {string} filters.customer - Filter by customer
   * @param {string} filters.from - Start date
   * @param {string} filters.to - End date
   * @param {number} filters.perPage - Results per page
   * @param {number} filters.page - Page number
   * @returns {Promise<Object>} Filtered transactions
   */
  async fetchTransactions(filters = {}) {
    try {
      const response = await this.repository.listTransactions(filters);
      
      // Apply additional client-side filtering if needed
      let transactions = response.data;
      
      if (filters.status) {
        transactions = TransactionAdapter.filterByStatus(transactions, filters.status);
      }
      
      if (filters.startDate && filters.endDate) {
        transactions = TransactionAdapter.filterByDateRange(
          transactions, 
          filters.startDate, 
          filters.endDate
        );
      }

      return {
        transactions,
        pagination: response.meta,
        statistics: TransactionAdapter.calculateStatistics(transactions),
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Fetch a single transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  async fetchTransaction(id) {
    try {
      const response = await this.repository.getTransaction(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  /**
   * Verify a transaction by reference
   * @param {string} reference - Transaction reference
   * @returns {Promise<Object>} Verification result
   */
  async verifyTransaction(reference) {
    try {
      const response = await this.repository.verifyTransaction(reference);
      return response.data;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      throw error;
    }
  }

  /**
   * Initialize a new transaction
   * @param {Object} transactionData - Transaction data
   * @param {string} transactionData.email - Customer email
   * @param {number} transactionData.amount - Amount in kobo
   * @param {string} transactionData.currency - Currency code
   * @param {string} transactionData.description - Transaction description
   * @param {string} transactionData.reference - Unique reference
   * @param {Object} transactionData.metadata - Additional metadata
   * @param {string} transactionData.callbackUrl - Callback URL
   * @returns {Promise<Object>} Initialization result
   */
  async initializeTransaction(transactionData) {
    try {
      // Validate required fields
      if (!transactionData.email) {
        throw new Error('Email is required');
      }

      if (!transactionData.amount || transactionData.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Generate reference if not provided
      if (!transactionData.reference) {
        transactionData.reference = this.generateReference();
      }

      const response = await this.repository.initializeTransaction(transactionData);
      return response.data;
    } catch (error) {
      console.error('Error initializing transaction:', error);
      throw error;
    }
  }

  /**
   * Get recent transactions
   * @param {number} limit - Number of transactions to fetch
   * @returns {Promise<Object>} Recent transactions
   */
  async getRecentTransactions(limit = 10) {
    try {
      const response = await this.repository.getRecentTransactions(limit);
      return {
        transactions: response.data,
        statistics: TransactionAdapter.calculateStatistics(response.data),
      };
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  }

  /**
   * Get transaction statistics
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Transaction statistics
   */
  async getTransactionStatistics(filters = {}) {
    try {
      const response = await this.repository.getTransactionTotals(filters);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction statistics:', error);
      throw error;
    }
  }

  /**
   * Get transaction timeline
   * @param {string} id - Transaction ID
   * @returns {Promise<Object>} Transaction timeline
   */
  async getTransactionTimeline(id) {
    try {
      const response = await this.repository.getTransactionTimeline(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction timeline:', error);
      throw error;
    }
  }

  /**
   * Search transactions
   * @param {string} query - Search query
   * @returns {Promise<Object>} Search results
   */
  async searchTransactions(query) {
    try {
      const response = await this.repository.searchTransactions(query);
      return {
        transactions: response.data,
        count: response.data.length,
      };
    } catch (error) {
      console.error('Error searching transactions:', error);
      throw error;
    }
  }

  /**
   * Generate unique transaction reference
   * @returns {string} Unique reference
   */
  generateReference() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `nairaflow_${timestamp}_${random}`;
  }

  /**
   * Format amount for display
   * @param {number} amount - Amount in kobo
   * @param {string} currency - Currency code
   * @returns {string} Formatted amount
   */
  formatAmount(amount, currency = 'NGN') {
    const naira = amount / 100;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(naira);
  }

  /**
   * Validate transaction data
   * @param {Object} transactionData - Transaction data to validate
   * @returns {Object} Validation result
   */
  validateTransactionData(transactionData) {
    const errors = [];

    if (!transactionData.email) {
      errors.push('Email is required');
    }

    if (!transactionData.amount || transactionData.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (transactionData.amount > 1000000000) { // Max 10 million naira
      errors.push('Amount exceeds maximum limit');
    }

    if (transactionData.currency && !['NGN', 'USD', 'GBP', 'EUR', 'CAD'].includes(transactionData.currency)) {
      errors.push('Invalid currency code');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if transaction is refundable
   * @param {Object} transaction - Transaction to check
   * @returns {boolean} Whether transaction can be refunded
   */
  isRefundable(transaction) {
    // Only successful transactions can be refunded
    if (transaction.status !== 'success') {
      return false;
    }

    // Check if transaction is within refund window (24 hours)
    const transactionDate = new Date(transaction.paid_at || transaction.date);
    const now = new Date();
    const hoursSinceTransaction = (now - transactionDate) / (1000 * 60 * 60);

    return hoursSinceTransaction <= 24;
  }

  /**
   * Calculate refund amount (with fees)
   * @param {Object} transaction - Transaction to calculate refund for
   * @returns {number} Refund amount in kobo
   */
  calculateRefundAmount(transaction) {
    // Paystack charges 1.5% + â‚¦100 fee
    const paystackFee = Math.max(transaction.amount * 0.015 + 10000, 10000);
    return transaction.amount - paystackFee;
  }

  /**
   * Get transactions for a specific customer
   * @param {string} customerId - Customer ID or email
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Customer transactions
   */
  async getCustomerTransactions(customerId, filters = {}) {
    try {
      const response = await this.repository.getCustomerTransactions(customerId, filters);
      return {
        transactions: response.data,
        pagination: response.meta,
        statistics: TransactionAdapter.calculateStatistics(response.data),
      };
    } catch (error) {
      console.error('Error fetching customer transactions:', error);
      throw error;
    }
  }

  /**
   * Batch fetch transactions with pagination
   * @param {Object} options - Pagination options
   * @param {number} options.maxPages - Maximum pages to fetch
   * @param {Object} options.filters - Filter options
   * @returns {Promise<Array>} All transactions
   */
  async fetchAllTransactions(options = {}) {
    const { maxPages = 10, filters = {} } = options;
    const allTransactions = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore && currentPage <= maxPages) {
      const response = await this.repository.listTransactions({
        ...filters,
        page: currentPage,
        perPage: 50,
      });

      allTransactions.push(...response.data);
      hasMore = currentPage < response.meta.totalPages;
      currentPage++;
    }

    return allTransactions;
  }
}

/**
 * Create a singleton instance of the transaction service
 */
let transactionServiceInstance = null;

export function getTransactionService() {
  if (!transactionServiceInstance) {
    transactionServiceInstance = new TransactionService();
  }
  return transactionServiceInstance;
}

/**
 * Create a new transaction service instance (for testing or custom config)
 */
export function createTransactionService(repository) {
  return new TransactionService(repository);
}

export default TransactionService;