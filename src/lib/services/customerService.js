/**
 * Customer Service
 * Business logic layer for customer operations
 */

import { getCustomerRepository } from '../repositories/customerRepository.js';
import {
  validateCustomerCreate,
  validateCustomerUpdate,
  formatValidationErrors,
} from '../validators/customerValidator.js';

class CustomerService {
  constructor(repository = null) {
    this.repository = repository || getCustomerRepository();
  }

  async fetchCustomers(filters = {}) {
    try {
      const response = await this.repository.listCustomers(filters);

      return {
        customers: response.data,
        pagination: response.meta,
        status: response.status,
        message: response.message,
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  async fetchCustomer(emailOrCode) {
    if (!emailOrCode) {
      throw new Error('Customer email or code is required');
    }

    try {
      const response = await this.repository.getCustomer(emailOrCode);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  async createCustomer(customerData) {
    try {
      const validation = validateCustomerCreate(customerData);
      if (!validation.success) {
        throw new Error(formatValidationErrors(validation.errors).map((e) => e.message).join(', '));
      }

      const response = await this.repository.createCustomer(validation.data);
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(code, customerData) {
    if (!code) {
      throw new Error('Customer code is required');
    }

    try {
      const validation = validateCustomerUpdate(customerData);
      if (!validation.success) {
        throw new Error(formatValidationErrors(validation.errors).map((e) => e.message).join(', '));
      }

      const response = await this.repository.updateCustomer(code, validation.data);
      return response.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async setRiskAction(customer, riskAction = 'default') {
    if (!customer) {
      throw new Error('Customer code or email is required');
    }
    if (!['default', 'allow', 'deny'].includes(riskAction)) {
      throw new Error('Risk action must be one of: default, allow, deny');
    }

    try {
      const response = await this.repository.setRiskAction(customer, riskAction);
      return response.data;
    } catch (error) {
      console.error('Error updating customer risk action:', error);
      throw error;
    }
  }

  async fetchAllCustomers(options = {}) {
    const { maxPages = 10, filters = {} } = options;
    const allCustomers = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore && currentPage <= maxPages) {
      const response = await this.repository.listCustomers({
        ...filters,
        page: currentPage,
        perPage: 50,
      });

      if (response.data.length === 0) break;

      allCustomers.push(...response.data);
      hasMore = Boolean(response.meta.next);
      currentPage++;
    }

    return allCustomers;
  }
}

let customerServiceInstance = null;

export function getCustomerService() {
  if (!customerServiceInstance) {
    customerServiceInstance = new CustomerService();
  }
  return customerServiceInstance;
}

export function createCustomerService(repository) {
  return new CustomerService(repository);
}

export default CustomerService;
