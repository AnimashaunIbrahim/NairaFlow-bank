/**
 * Transaction Adapter
 * Transforms Paystack API responses to our application's data structure
 */

export class TransactionAdapter {
  /**
   * Transform Paystack transaction to our app's transaction format
   */
  static fromPaystack(paystackTransaction) {
    return {
      id: paystackTransaction.id,
      description: this.extractDescription(paystackTransaction),
      amount: paystackTransaction.amount, // Paystack uses kobo
      currency: paystackTransaction.currency || 'NGN',
      status: this.mapStatus(paystackTransaction.status),
      bank: this.extractBank(paystackTransaction),
      account: this.extractAccount(paystackTransaction),
      date: paystackTransaction.transaction_date || paystackTransaction.created_at,
      fee: paystackTransaction.fee || 0,
      reference: paystackTransaction.reference,
      customer: paystackTransaction.customer,
      metadata: paystackTransaction.metadata || {},
      gateway_response: paystackTransaction.gateway_response,
      channel: paystackTransaction.channel,
      paid_at: paystackTransaction.paid_at,
    };
  }

  /**
   * Transform array of Paystack transactions
   */
  static fromPaystackArray(paystackTransactions) {
    return paystackTransactions.map(tx => this.fromPaystack(tx));
  }

  /**
   * Map Paystack status to our app's status
   */
  static mapStatus(paystackStatus) {
    const statusMap = {
      'success': 'success',
      'failed': 'failed',
      'pending': 'pending',
      'reversed': 'failed',
      'abandoned': 'failed',
      'queued': 'pending',
    };
    return statusMap[paystackStatus] || 'pending';
  }

  /**
   * Extract description from transaction data
   */
  static extractDescription(transaction) {
    // Try to get description from metadata first
    if (transaction.metadata?.description) {
      return transaction.metadata.description;
    }

    // Fallback to custom description
    if (transaction.metadata?.custom_description) {
      return transaction.metadata.custom_description;
    }

    // Generate description based on transaction type
    if (transaction.channel === 'card') {
      return 'Card Payment';
    }

    if (transaction.channel === 'bank_transfer') {
      return 'Bank Transfer';
    }

    if (transaction.channel === 'ussd') {
      return 'USSD Payment';
    }

    if (transaction.channel === 'qr') {
      return 'QR Code Payment';
    }

    // Default description
    return 'Payment';
  }

  /**
   * Extract bank from transaction metadata
   */
  static extractBank(transaction) {
    return transaction.metadata?.bank || 
           transaction.metadata?.bank_name || 
           transaction.customer?.bank || 
           'Unknown';
  }

  /**
   * Extract account from transaction metadata
   */
  static extractAccount(transaction) {
    return transaction.metadata?.account || 
           transaction.metadata?.account_number || 
           transaction.metadata?.sender_account || 
           'N/A';
  }

  /**
   * Transform our app's transaction to Paystack format (for initialization)
   */
  static toPaystackInitialize(appTransaction) {
    return {
      email: appTransaction.email,
      amount: appTransaction.amount, // Should be in kobo
      currency: appTransaction.currency || 'NGN',
      reference: appTransaction.reference,
      metadata: {
        description: appTransaction.description,
        bank: appTransaction.bank,
        account: appTransaction.account,
        custom_fields: appTransaction.customFields || {},
      },
      callback_url: appTransaction.callbackUrl,
      channels: appTransaction.channels || ['card', 'bank_transfer'],
    };
  }

  /**
   * Transform our app's transaction for verification
   */
  static toPaystackVerify(reference) {
    return { reference };
  }

  /**
   * Extract pagination metadata from Paystack response
   */
  static extractPagination(paystackResponse) {
    return {
      perPage: paystackResponse.meta?.per_page || 50,
      page: paystackResponse.meta?.page || 1,
      total: paystackResponse.meta?.total || 0,
      totalPages: paystackResponse.meta?.total_pages || 0,
    };
  }

  /**
   * Filter transactions by status
   */
  static filterByStatus(transactions, status) {
    return transactions.filter(tx => tx.status === status);
  }

  /**
   * Filter transactions by date range
   */
  static filterByDateRange(transactions, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= start && txDate <= end;
    });
  }

  /**
   * Calculate total amount for transactions
   */
  static calculateTotal(transactions) {
    return transactions.reduce((total, tx) => total + tx.amount, 0);
  }

  /**
   * Group transactions by status
   */
  static groupByStatus(transactions) {
    return transactions.reduce((groups, tx) => {
      const status = tx.status;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(tx);
      return groups;
    }, {});
  }

  /**
   * Sort transactions by date (newest first)
   */
  static sortByDate(transactions) {
    return [...transactions].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
  }

  /**
   * Get unique customers from transactions
   */
  static getUniqueCustomers(transactions) {
    const customers = new Set();
    transactions.forEach(tx => {
      if (tx.customer?.email) {
        customers.add(tx.customer.email);
      }
    });
    return Array.from(customers);
  }

  /**
   * Calculate transaction statistics
   */
  static calculateStatistics(transactions) {
    const stats = {
      total: transactions.length,
      totalAmount: this.calculateTotal(transactions),
      successful: 0,
      failed: 0,
      pending: 0,
      successRate: 0,
      averageAmount: 0,
    };

    transactions.forEach(tx => {
      if (tx.status === 'success') stats.successful++;
      if (tx.status === 'failed') stats.failed++;
      if (tx.status === 'pending') stats.pending++;
    });

    if (stats.total > 0) {
      stats.successRate = (stats.successful / stats.total) * 100;
      stats.averageAmount = stats.totalAmount / stats.total;
    }

    return stats;
  }
}