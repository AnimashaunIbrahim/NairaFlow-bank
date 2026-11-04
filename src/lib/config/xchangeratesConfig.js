export const xchangeratesConfig = {
  environment: import.meta.env.VITE_API_ENVIRONMENT || 'test',
  baseURL: import.meta.env.VITE_EXCHANGE_RATE_BASE_URL || 'https://openexchangerates.org/api/',
  apiKey: import.meta.env.VITE_EXCHANGE_RATE_API_KEY,
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
};

// API Endpoints
xchangeratesConfig.endpoints = {
  latest: '/latest.json',
  convert: '/convert',
  currencies: '/currencies.json',
  historical: '/historical',
};

/**
 * Validate exchange rate configuration
 * @throws {Error} If required configuration is missing
 */
export function validateExchangeRateConfig() {
  if (!xchangeratesConfig.apiKey) {
    throw new Error('EXCHANGE_RATE_API_KEY is required in environment variables');
  }
  if (!xchangeratesConfig.baseURL) {
    throw new Error('EXCHANGE_RATE_BASE_URL is required in environment variables');
  }
  return true;
}

export default xchangeratesConfig;

