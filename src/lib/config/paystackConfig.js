/**
 * Paystack API Configuration
 * Centralized configuration for Paystack API integration
 */

export const paystackConfig = {
  environment: import.meta.env.VITE_API_ENVIRONMENT || 'test',
  baseURL: import.meta.env.VITE_PAYSTACK_BASE_URL || 'https://api.paystack.co',
  secretKey: import.meta.env.VITE_PAYSTACK_SECRET_KEY,
  publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  useMock: import.meta.env.VITE_USE_MOCK === 'true',

  // API Endpoints
  endpoints: {
    transaction: '/transaction',
    customer: '/customer',
    transfer: '/transfer',
    plan: '/plan',
    subscription: '/subscription',
    balance: '/balance',
    dedicated_account: '/dedicated_account',
  },

  // Pagination defaults
  pagination: {
    perPage: 50,
    defaultPage: 1,
  },

  // Retry configuration
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
  },

  // Request timeout (milliseconds)
  timeout: 30000,

  // Currency configuration
  currency: 'NGN',
};

/**
 * Validate configuration
 * @throws {Error} If required configuration is missing
 */
export function validateConfig() {
  if (!paystackConfig.secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is required in environment variables');
  }

  if (!paystackConfig.publicKey) {
    throw new Error('PAYSTACK_PUBLIC_KEY is required in environment variables');
  }

  if (!paystackConfig.baseURL) {
    throw new Error('PAYSTACK_BASE_URL is required in environment variables');
  }

  // Validate key format
  if (!paystackConfig.secretKey.startsWith('sk_')) {
    console.warn('PAYSTACK_SECRET_KEY should start with "sk_"');
  }

  if (!paystackConfig.publicKey.startsWith('pk_')) {
    console.warn('PAYSTACK_PUBLIC_KEY should start with "pk_"');
  }

  return true;
}