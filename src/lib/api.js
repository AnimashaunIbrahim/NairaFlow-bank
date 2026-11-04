/**
 * API layer â€” all fetch functions used by React Query.
 * Integrated with Paystack API for real transaction processing.
 * Maintains MSW fallback for development when VITE_USE_MOCK=true.
 */

import { paystackConfig } from './config/paystackConfig.js';
import { getTransactionService } from './services/transactionService.js';
import { getCustomerService } from './services/customerService.js';

// Legacy MSW support (for development)
const BASE = '';
async function apiFetch(url, options) {
  const res = await fetch(`${BASE}${url}`, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

/**
 * Transaction API Functions
 * Integrated with Paystack API
 */

export async function fetchTransactions(filters = {}) {
  // Use Paystack API if not in mock mode
  if (!paystackConfig.useMock) {
    const transactionService = getTransactionService();
    const result = await transactionService.fetchTransactions(filters);
    return result.transactions;
  }
  
  // Fallback to MSW for development
  const data = await apiFetch('/api/transactions');
  return data.transactions;
}

export async function fetchTransaction(id) {
  if (!paystackConfig.useMock) {
    const transactionService = getTransactionService();
    return await transactionService.fetchTransaction(id);
  }
  
  // MSW fallback (implement if needed)
  return apiFetch(`/api/transactions/${id}`);
}

export async function verifyTransaction(reference) {
  if (!paystackConfig.useMock) {
    const transactionService = getTransactionService();
    return await transactionService.verifyTransaction(reference);
  }
  
  // MSW fallback
  return apiFetch(`/api/transactions/verify/${reference}`);
}

export async function initializeTransaction(transactionData) {
  if (!paystackConfig.useMock) {
    const transactionService = getTransactionService();
    return await transactionService.initializeTransaction(transactionData);
  }
  
  // MSW fallback
  return apiFetch('/api/transactions/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transactionData),
  });
}

/**
 * Balance API Functions
 * Currently using MSW, to be integrated with Paystack in future phases
 */

export async function fetchBalance() {
  // Paystack doesn't have a direct balance API
  // This will be implemented with custom backend service
  // For now, use MSW
  return apiFetch('/api/balance');
}

/**
 * Transfer API Functions
 * Will be integrated with Paystack in Phase 4
 */

export async function sendTransfer(transferData) {
  // Paystack transfer integration coming in Phase 4
  // For now, use MSW
  return apiFetch('/api/transfers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transferData),
  });
}

/**
 * Savings API Functions
 * Currently using MSW, to be integrated with Paystack plans in Phase 5
 */

export async function fetchSavings() {
  // Will be integrated with Paystack plans in Phase 5
  const data = await apiFetch('/api/savings');
  return data.plans;
}

/**
 * Exchange Rate API Functions
 * Integrated with OpenExchangeRates API
 */

export async function fetchRates() {
  // Use OpenExchangeRates API if not in mock mode
  if (!paystackConfig.useMock) {
    try {
      const { getExchangeRateService } = await import('./services/exchangeRateService.js');
      const exchangeRateService = getExchangeRateService();
      const ratesData = await exchangeRateService.getLatestRates();
      return ratesData;
    } catch (error) {
      console.error('Failed to fetch rates from OpenExchangeRates, falling back to MSW:', error);
      // Fallback to MSW
      const data = await apiFetch('/api/rates');
      return data;
    }
  }
  
  // Fallback to MSW for development
  const data = await apiFetch('/api/rates');
  return data;
}

export async function convertCurrency(amount, from, to) {
  if (!paystackConfig.useMock) {
    try {
      const { getExchangeRateService } = await import('./services/exchangeRateService.js');
      const exchangeRateService = getExchangeRateService();
      const converted = await exchangeRateService.convert(amount, from, to);
      return converted;
    } catch (error) {
      console.error('Failed to convert currency:', error);
      throw error;
    }
  }
  
  // For mock, use simple calculation
  const rates = await fetchRates();
  if (!rates?.rates) throw new Error('Rates not available');
  const fromRate = rates.rates[from] || 1;
  const toRate = rates.rates[to] || 1;
  const amountInNGN = amount / fromRate;
  return amountInNGN * toRate;
}

/**
 * Insights API Functions
 * Currently using MSW, to be integrated with transaction statistics
 */

export async function fetchInsights() {
  // Can be implemented using Paystack transaction statistics
  const data = await apiFetch('/api/insights');
  return data.insights;
}

/**
 * Transaction Statistics
 * New function using Paystack API
 */

export async function fetchTransactionStatistics(filters = {}) {
  if (!paystackConfig.useMock) {
    const transactionService = getTransactionService();
    return await transactionService.getTransactionStatistics(filters);
  }
  
  // MSW fallback
  return apiFetch('/api/transactions/statistics');
}

/**
 * Customer API Functions
 * Integrated with Paystack Customers API (create, list, fetch, update)
 */

export async function fetchCustomers(filters = {}) {
  if (!paystackConfig.useMock) {
    const result = await getCustomerService().fetchCustomers(filters);
    return { customers: result.customers, pagination: result.pagination };
  }

  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.perPage) params.set('perPage', String(filters.perPage));
  const query = params.toString();

  const data = await apiFetch(`/api/customers${query ? `?${query}` : ''}`);
  return { customers: data.customers, pagination: data.pagination };
}

export async function fetchCustomer(emailOrCode) {
  if (!paystackConfig.useMock) {
    return await getCustomerService().fetchCustomer(emailOrCode);
  }

  return apiFetch(`/api/customers/${encodeURIComponent(emailOrCode)}`);
}

export async function createCustomer(customerData) {
  if (!paystackConfig.useMock) {
    return await getCustomerService().createCustomer(customerData);
  }

  return apiFetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
}

export async function updateCustomer(code, customerData) {
  if (!paystackConfig.useMock) {
    return await getCustomerService().updateCustomer(code, customerData);
  }

  return apiFetch(`/api/customers/${encodeURIComponent(code)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
}

export async function setCustomerRiskAction(customer, riskAction = 'default') {
  if (!paystackConfig.useMock) {
    return await getCustomerService().setRiskAction(customer, riskAction);
  }

  return apiFetch('/api/customers/risk-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer, riskAction }),
  });
}

export async function fetchCustomerTransactions(customerId, filters = {}) {
  if (!paystackConfig.useMock) {
    const result = await getTransactionService().getCustomerTransactions(customerId, filters);
    return { transactions: result.transactions, pagination: result.pagination };
  }

  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.perPage) params.set('perPage', String(filters.perPage));
  const query = params.toString();

  const data = await apiFetch(
    `/api/customers/${encodeURIComponent(customerId)}/transactions${query ? `?${query}` : ''}`
  );
  return { transactions: data.transactions, pagination: data.pagination };
}