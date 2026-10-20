/**
 * Customer Repository
 * Handles all customer-related API calls to Paystack
 */

import { getPaystackClient } from '../paystackClient.js';
import { CustomerAdapter } from '../adapters/customerAdapter.js';

class CustomerRepository {
  constructor(client = null) {
    this.client = client || getPaystackClient();
  }

  async listCustomers(filters = {}) {
    const response = await this.client.get('/customer', filters);

    return {
      data: CustomerAdapter.fromPaystackArray(response.data || []),
      meta: CustomerAdapter.extractPagination(response),
      status: response.status,
      message: response.message,
    };
  }

  async getCustomer(emailOrCode) {
    const response = await this.client.get(
      `/customer/${encodeURIComponent(emailOrCode)}`
    );

    return {
      data: CustomerAdapter.fromPaystack(response.data),
      status: response.status,
      message: response.message,
    };
  }

  async createCustomer(customerData) {
    const payload = CustomerAdapter.toPaystackCreate(customerData);
    const response = await this.client.post('/customer', payload);

    return {
      data: CustomerAdapter.fromPaystack(response.data),
      status: response.status,
      message: response.message,
    };
  }

  async updateCustomer(code, customerData) {
    const payload = CustomerAdapter.toPaystackUpdate(customerData);
    const response = await this.client.put(
      `/customer/${encodeURIComponent(code)}`,
      payload
    );

    return {
      data: CustomerAdapter.fromPaystack(response.data),
      status: response.status,
      message: response.message,
    };
  }

  async setRiskAction(customer, riskAction = 'default') {
    const response = await this.client.post('/customer/set_risk_action', {
      customer,
      risk_action: riskAction,
    });

    return {
      data: CustomerAdapter.fromPaystack(response.data),
      status: response.status,
      message: response.message,
    };
  }
}

let customerRepositoryInstance = null;

export function getCustomerRepository() {
  if (!customerRepositoryInstance) {
    customerRepositoryInstance = new CustomerRepository();
  }
  return customerRepositoryInstance;
}

export function createCustomerRepository(client) {
  return new CustomerRepository(client);
}

export default CustomerRepository;
