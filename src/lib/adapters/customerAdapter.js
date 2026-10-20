/**
 * Customer Adapter
 * Transforms Paystack API responses to our application's data structure
 */

export class CustomerAdapter {
  static fromPaystack(paystackCustomer) {
    const firstName = paystackCustomer.first_name || '';
    const lastName = paystackCustomer.last_name || '';
    const email = paystackCustomer.email || '';

    return {
      id: paystackCustomer.id,
      customerCode: paystackCustomer.customer_code,
      email,
      firstName,
      lastName,
      phone: paystackCustomer.phone || '',
      metadata: paystackCustomer.metadata || {},
      riskAction: this.mapRiskAction(paystackCustomer.risk_action),
      domain: paystackCustomer.domain || 'test',
      createdAt: paystackCustomer.createdAt || paystackCustomer.created_at,
      updatedAt: paystackCustomer.updatedAt || paystackCustomer.updated_at,
      displayName: this.buildDisplayName(firstName, lastName, email),
      transactions: paystackCustomer.transactions,
      authorizations: paystackCustomer.authorizations,
      totalTransactions: paystackCustomer.total_transactions,
    };
  }

  static fromPaystackArray(paystackCustomers) {
    return paystackCustomers.map((customer) => this.fromPaystack(customer));
  }

  static mapRiskAction(riskAction) {
    const riskMap = {
      'default': 'default',
      'allow': 'allow',
      'deny': 'deny',
    };
    return riskMap[riskAction] || 'default';
  }

  static buildDisplayName(firstName, lastName, email) {
    const name = `${firstName || ''} ${lastName || ''}`.trim();
    if (name) return name;
    if (email) return email.split('@')[0];
    return 'Unknown Customer';
  }

  static toPaystackCreate(appCustomer) {
    const payload = {
      email: appCustomer.email,
      first_name: (appCustomer.firstName || '').trim(),
      last_name: (appCustomer.lastName || '').trim(),
    };

    const phone = (appCustomer.phone || '').trim();
    if (phone) payload.phone = phone;

    if (appCustomer.metadata && Object.keys(appCustomer.metadata).length > 0) {
      payload.metadata = appCustomer.metadata;
    }

    return payload;
  }

  static toPaystackUpdate(appCustomer) {
    const payload = {};

    if (appCustomer.firstName !== undefined) {
      payload.first_name = String(appCustomer.firstName).trim();
    }
    if (appCustomer.lastName !== undefined) {
      payload.last_name = String(appCustomer.lastName).trim();
    }
    if (appCustomer.phone !== undefined) {
      // Send even when empty so an existing phone number can be cleared
      payload.phone = String(appCustomer.phone).trim();
    }
    if (appCustomer.metadata && Object.keys(appCustomer.metadata).length > 0) {
      payload.metadata = appCustomer.metadata;
    }

    return payload;
  }

  static extractPagination(paystackResponse) {
    return {
      perPage: paystackResponse.meta?.perPage || 50,
      page: paystackResponse.meta?.page || 1,
      next: paystackResponse.meta?.next || null,
      previous: paystackResponse.meta?.previous || null,
    };
  }

  static filterByRiskAction(customers, riskAction) {
    return customers.filter((customer) => customer.riskAction === riskAction);
  }

  static sortByDate(customers) {
    return [...customers].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }
}
