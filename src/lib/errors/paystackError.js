/**
 * Custom error class for Paystack API errors
 * Provides structured error information for better error handling
 */
export class PaystackError extends Error {
  constructor(message, statusCode = null, response = null) {
    super(message);
    this.name = 'PaystackError';
    this.statusCode = statusCode;
    this.response = response;
  }

  static fromResponse(response) {
    const errorData = response.data || {};
    return new PaystackError(
      errorData.message || 'Paystack API request failed',
      response.status,
      errorData
    );
  }

  isNetworkError() {
    return !this.statusCode;
  }

  isValidationError() {
    return this.statusCode === 400;
  }

  isUnauthorizedError() {
    return this.statusCode === 401;
  }

  isPaymentError() {
    return this.statusCode === 402;
  }

  isNotFoundError() {
    return this.statusCode === 404;
  }

  isServerError() {
    return this.statusCode >= 500;
  }
}