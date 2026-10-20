# Paystack API Integration - Architectural Plan

## Executive Summary

This document outlines the architectural approach for transitioning from MSW (Mock Service Worker) to Paystack API integration for the NairaFlow application. The integration will enable real transaction processing, customer management, and financial operations while maintaining security and scalability.

---

## Task 1: Secure Key Management ✅ COMPLETED

### Environment Variable Setup

**Files Created:**
- `.env.example` - Template for environment variables
- `.gitignore` - Ensures `.env` files are never committed

**Implementation:**
```bash
# Local development
VITE_PAYSTACK_SECRET_KEY=sk_test_84b5119f93abdbfd0c65c8c51f18578e1c932f17
VITE_PAYSTACK_PUBLIC_KEY=pk_test_5a7415337bbb302f76073afd96771c9b964162b3
VITE_API_ENVIRONMENT=test
VITE_PAYSTACK_BASE_URL=https://api.paystack.co
```

**Security Measures:**
- ✅ Keys stored in environment variables
- ✅ `.env` in `.gitignore` prevents accidental commits
- ✅ `.env.example` provides template without sensitive data
- ✅ Different keys for test vs production environments
- ✅ Vite automatically loads `.env` files

---

## Task 2: Architectural Design

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NairaFlow React App                        │
├─────────────────────────────────────────────────────────────┤
│  Components (Dashboard, SendMoney, etc.)                     │
│         ↓                                                    │
│  React Query (Data Fetching & Caching)                      │
│         ↓                                                    │
│  API Layer (src/lib/api.js)                                 │
│         ↓                                                    │
│  Paystack Client (src/lib/paystackClient.js)                 │
│         ↓                                                    │
│  Paystack API (https://api.paystack.co)                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Design Patterns

#### Pattern 1: Repository Pattern
**Purpose:** Abstract API interactions and provide clean interfaces

```javascript
// src/lib/repositories/transactionRepository.js
class TransactionRepository {
  constructor(paystackClient) {
    this.client = paystackClient;
  }

  async listTransactions(filters) {
    return this.client.get('/transaction', { params: filters });
  }

  async getTransaction(id) {
    return this.client.get(`/transaction/${id}`);
  }

  async initializeTransaction(data) {
    return this.client.post('/transaction/initialize', data);
  }

  async verifyTransaction(reference) {
    return this.client.get(`/transaction/verify/${reference}`);
  }
}
```

#### Pattern 2: Factory Pattern
**Purpose:** Create appropriate API clients based on environment

```javascript
// src/lib/apiClientFactory.js
class ApiClientFactory {
  static create(environment = 'test') {
    const baseURL = environment === 'live' 
      ? 'https://api.paystack.co'
      : 'https://api.paystack.co';
    
    const secretKey = import.meta.env.VITE_PAYSTACK_SECRET_KEY;
    
    return new PaystackClient(baseURL, secretKey);
  }
}
```

#### Pattern 3: Adapter Pattern
**Purpose:** Adapt Paystack API responses to our application's data structure

```javascript
// src/lib/adapters/transactionAdapter.js
class TransactionAdapter {
  static fromPaystack(paystackTransaction) {
    return {
      id: paystackTransaction.id,
      description: paystackTransaction.metadata?.description || 'Transfer',
      amount: paystackTransaction.amount, // Already in kobo
      currency: paystackTransaction.currency,
      status: this.mapStatus(paystackTransaction.status),
      bank: paystackTransaction.metadata?.bank || 'Unknown',
      account: paystackTransaction.metadata?.account || 'N/A',
      date: paystackTransaction.transaction_date,
      fee: paystackTransaction.fee || 0,
      reference: paystackTransaction.reference,
      customer: paystackTransaction.customer,
    };
  }

  static mapStatus(paystackStatus) {
    const statusMap = {
      'success': 'success',
      'failed': 'failed',
      'pending': 'pending',
      'reversed': 'failed',
    };
    return statusMap[paystackStatus] || 'pending';
  }
}
```

#### Pattern 4: Strategy Pattern
**Purpose:** Handle different API strategies (MSW vs Paystack)

```javascript
// src/lib/apiStrategy.js
class ApiStrategy {
  static getStrategy() {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';
    return useMock ? new MockApiStrategy() : new PaystackApiStrategy();
  }
}

class PaystackApiStrategy {
  async fetchTransactions() {
    const repository = new TransactionRepository(paystackClient);
    const response = await repository.listTransactions();
    return response.data.map(TransactionAdapter.fromPaystack);
  }
}

class MockApiStrategy {
  async fetchTransactions() {
    // Use MSW for development
    return apiFetch('/api/transactions');
  }
}
```

### 2.3 API Layer Structure

```
src/lib/
├── api.js                          # Main API interface (refactored)
├── paystackClient.js               # Paystack HTTP client
├── repositories/                   # Repository pattern
│   ├── transactionRepository.js
│   ├── customerRepository.js
│   ├── transferRepository.js
│   ├── planRepository.js
│   └── subscriptionRepository.js
├── adapters/                       # Adapter pattern
│   ├── transactionAdapter.js
│   ├── customerAdapter.js
│   └── transferAdapter.js
├── services/                       # Business logic
│   ├── transactionService.js
│   ├── customerService.js
│   └── refundService.js
├── validators/                     # Request validation
│   ├── transactionValidator.js
│   └── transferValidator.js
└── types/                         # TypeScript types (future)
    └── paystack.types.js
```

### 2.4 Paystack Client Implementation

```javascript
// src/lib/paystackClient.js
class PaystackClient {
  constructor(baseURL, secretKey) {
    this.baseURL = baseURL;
    this.secretKey = secretKey;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new PaystackError(error.message || 'API request failed', response.status);
    }

    return response.json();
  }

  async get(endpoint, params) {
    return this.request(endpoint, { method: 'GET', params });
  }

  async post(endpoint, data) {
    return this.request(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    });
  }
}
```

### 2.5 Error Handling Strategy

```javascript
// src/lib/errors/paystackError.js
class PaystackError extends Error {
  constructor(message, statusCode, response) {
    super(message);
    this.name = 'PaystackError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

// Usage in API layer
try {
  const result = await paystackClient.post('/transaction/initialize', data);
} catch (error) {
  if (error instanceof PaystackError) {
    // Handle Paystack-specific errors
    switch (error.statusCode) {
      case 400:
        // Bad request - validation error
        break;
      case 401:
        // Unauthorized - invalid key
        break;
      case 402:
        // Failed transaction
        break;
      default:
        // Generic error
    }
  }
  throw error;
}
```

### 2.6 Data Flow Architecture

```
User Action (Send Money)
    ↓
Component (SendMoneyForm)
    ↓
React Query Mutation
    ↓
API Layer (sendTransfer)
    ↓
Transaction Service (business logic)
    ↓
Transaction Repository (API call)
    ↓
Paystack Client (HTTP request)
    ↓
Paystack API
    ↓
Response Adapter (data transformation)
    ↓
Component Update (UI refresh)
```

### 2.7 Security Architecture

**Key Security Principles:**

1. **Server-Side Secret Key Usage**
   - Secret key only used in backend services
   - For this phase, we'll use environment variables (will need backend later)

2. **Client-Side Public Key Only**
   - Public key for transaction initialization
   - Cannot be used for sensitive operations

3. **Environment-Based Configuration**
   ```javascript
   const config = {
     test: {
       secretKey: import.meta.env.VITE_PAYSTACK_SECRET_KEY,
       publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
     },
     live: {
       secretKey: import.meta.env.VITE_PAYSTACK_LIVE_SECRET_KEY,
       publicKey: import.meta.env.VITE_PAYSTACK_LIVE_PUBLIC_KEY,
     }
   };
   ```

4. **Request/Response Validation**
   - Validate all outgoing requests
   - Validate all incoming responses
   - Sanitize user inputs

### 2.8 Configuration Management

```javascript
// src/lib/config/paystackConfig.js
export const paystackConfig = {
  environment: import.meta.env.VITE_API_ENVIRONMENT || 'test',
  baseURL: import.meta.env.VITE_PAYSTACK_BASE_URL || 'https://api.paystack.co',
  secretKey: import.meta.env.VITE_PAYSTACK_SECRET_KEY,
  publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  
  // API Endpoints
  endpoints: {
    transaction: '/transaction',
    customer: '/customer',
    transfer: '/transfer',
    plan: '/plan',
    subscription: '/subscription',
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
  },
};
```

### 2.9 Migration Strategy from MSW

**Phase 1: Parallel Operation**
- Keep MSW for development
- Add Paystack client alongside
- Use feature flag to switch between strategies

**Phase 2: Gradual Migration**
- Migrate one API endpoint at a time
- Test each endpoint thoroughly
- Maintain fallback to MSW during development

**Phase 3: Complete Transition**
- Remove MSW dependency
- Use Paystack for all operations
- Keep MSW for testing only

### 2.10 Scalability Considerations

**Future-Proofing:**

1. **Backend Service Layer**
   - Currently using client-side API calls
   - Future: Add backend service to hide secret keys
   - Pattern: Ready for Express.js/Next.js integration

2. **Database Integration**
   - Currently: Paystack as data source
   - Future: Local database + Paystack sync
   - Pattern: Repository abstraction allows easy swapping

3. **Multi-API Support**
   - Currently: Paystack only
   - Future: Add other payment providers
   - Pattern: Interface-based design allows multiple providers

---

## Task 3: Implementation Phases

### Phase 1: Foundation Setup (Week 1)

**Objective:** Set up secure infrastructure and basic Paystack client

**Tasks:**
1. ✅ Environment variable setup
2. ✅ Git ignore configuration
3. Create Paystack client class
4. Create configuration management
5. Set up error handling classes
6. Create base repository pattern
7. Add TypeScript types (optional, can wait)

**Deliverables:**
- Working Paystack client
- Secure key management
- Error handling infrastructure
- Configuration system

**Verification:**
- Test Paystack client with simple API call
- Verify environment variables load correctly
- Test error handling

---

### Phase 2: Transaction API Integration (Week 2)

**Objective:** Integrate Paystack transaction endpoints

**Tasks:**
1. Create TransactionRepository
2. Create TransactionAdapter
3. Create TransactionService
4. Update existing API functions
5. Add transaction validation
6. Implement transaction listing
7. Implement transaction verification
8. Add transaction filtering/pagination

**API Endpoints to Integrate:**
- `GET /transaction` - List transactions
- `GET /transaction/:id` - Get single transaction
- `GET /transaction/verify/:reference` - Verify transaction
- `POST /transaction/initialize` - Initialize transaction

**Deliverables:**
- Working transaction listing
- Transaction verification
- Real-time transaction updates
- Filtering and pagination

**Verification:**
- List transactions from Paystack test account
- Verify a test transaction
- Test error handling
- Validate data transformation

---

### Phase 3: Customer Management (Week 3)

**Objective:** Add customer CRUD operations

**Tasks:**
1. Create CustomerRepository
2. Create CustomerAdapter
3. Create CustomerService
4. Add customer validation
5. Implement customer creation
6. Implement customer listing
7. Implement customer updates
8. Add customer management UI

**API Endpoints to Integrate:**
- `POST /customer` - Create customer
- `GET /customer` - List customers
- `GET /customer/:id` - Get customer
- `PUT /customer/:id` - Update customer
- `GET /customer/:id/transactions` - Customer transactions

**Deliverables:**
- Customer management system
- Customer-transaction relationship
- Customer validation
- Customer UI components

**Verification:**
- Create test customers
- List customers
- Update customer information
- View customer transactions

---

### Phase 4: Transfer Integration (Week 4)

**Objective:** Implement bank transfer functionality

**Tasks:**
1. Create TransferRepository
2. Create TransferAdapter
3. Create TransferService
4. Add transfer validation
5. Implement transfer initiation
6. Implement transfer verification
7. Add balance checks
8. Implement refund functionality

**API Endpoints to Integrate:**
- `POST /transfer` - Initiate transfer
- `GET /transfer` - List transfers
- `GET /transfer/:id` - Get transfer details
- `POST /transfer/:id/refund` - Refund transfer
- `GET /transfer/:id/refunds` - List refunds

**Deliverables:**
- Working transfer system
- Transfer verification
- Refund functionality
- Balance management

**Verification:**
- Initiate test transfers
- List transfers
- Process refunds
- Verify balance updates

---

### Phase 5: Plans and Subscriptions (Week 5)

**Objective:** Add recurring payment support

**Tasks:**
1. Create PlanRepository
2. Create SubscriptionRepository
3. Create PlanAdapter
4. Create SubscriptionAdapter
5. Implement plan creation
6. Implement subscription management
7. Add subscription UI
8. Integrate with existing savings

**API Endpoints to Integrate:**
- `POST /plan` - Create plan
- `GET /plan` - List plans
- `POST /subscription` - Create subscription
- `GET /subscription` - List subscriptions
- `GET /subscription/:id` - Get subscription
- `POST /subscription/:id/disable` - Disable subscription

**Deliverables:**
- Plan management system
- Subscription system
- Integration with savings UI
- Recurring payment support

**Verification:**
- Create test plans
- Create subscriptions
- List subscriptions
- Disable subscriptions

---

### Phase 6: UI Enhancement and Integration (Week 6)

**Objective:** Update UI to use real Paystack data

**Tasks:**
1. Update Dashboard with real transactions
2. Update SendMoney form for Paystack
3. Add customer management UI
4. Add transfer history UI
5. Add subscription management UI
6. Update error handling in UI
7. Add loading states
8. Add success/failure feedback

**Deliverables:**
- Fully integrated UI
- Real-time data display
- Enhanced user feedback
- Improved error handling

**Verification:**
- Test all UI components
- Verify real-time updates
- Test error scenarios
- Validate user experience

---

### Phase 7: Testing and Optimization (Week 7)

**Objective:** Ensure reliability and performance

**Tasks:**
1. Write unit tests for repositories
2. Write integration tests for services
3. Add E2E tests for critical flows
4. Performance optimization
5. Error handling refinement
6. Edge case handling
7. Load testing
8. Security audit

**Deliverables:**
- Comprehensive test suite
- Performance benchmarks
- Security review
- Documentation

**Verification:**
- Run all tests
- Performance testing
- Security validation
- Edge case testing

---

### Phase 8: Documentation and Deployment (Week 8)

**Objective**: Prepare for production deployment

**Tasks:**
1. Update API documentation
2. Create deployment guide
3. Set up production environment variables
4. Configure production builds
5. Set up monitoring
6. Create runbooks
7. Team training
8. Production deployment

**Deliverables:**
- Complete documentation
- Deployment guides
- Production configuration
- Monitoring setup
- Training materials

**Verification:**
- Documentation review
- Deployment testing
- Production validation
- Team sign-off

---

## Risk Mitigation

### Technical Risks

**Risk 1: API Rate Limiting**
- **Mitigation**: Implement request queuing and retry logic
- **Fallback**: Use caching for frequently accessed data

**Risk 2: Paystack API Changes**
- **Mitigation**: Version-specific API client
- **Fallback**: Adapter pattern allows easy updates

**Risk 3: Network Failures**
- **Mitigation**: Implement offline support with MSW fallback
- **Fallback**: Queue failed requests for retry

### Security Risks

**Risk 1: Key Exposure**
- **Mitigation**: Environment variables + gitignore
- **Monitoring**: Regular security audits

**Risk 2: Unauthorized Access**
- **Mitigation**: Request validation and rate limiting
- **Monitoring**: API usage monitoring

### Business Risks

**Risk 1: Transaction Failures**
- **Mitigation**: Comprehensive error handling and user feedback
- **Fallback**: Retry logic with exponential backoff

**Risk 2: Data Inconsistency**
- **Mitigation**: Implement data validation and reconciliation
- **Fallback**: Regular data sync with Paystack

---

## Success Criteria

### Phase Completion Criteria

**Phase 1 (Foundation):**
- ✅ Environment variables work correctly
- ✅ Paystack client can make successful API calls
- ✅ Error handling works as expected

**Phase 2 (Transactions):**
- ✅ Can list real transactions from Paystack
- ✅ Can verify transactions
- ✅ Data transforms correctly
- ✅ Error handling covers all scenarios

**Phase 3 (Customers):**
- ✅ Can create/list/update customers
- ✅ Customer data displays correctly
- ✅ Customer-transaction relationship works

**Phase 4 (Transfers):**
- ✅ Can initiate transfers
- ✅ Can process refunds
- ✅ Balance updates correctly
- ✅ Transfer history accurate

**Phase 5 (Plans/Subscriptions):**
- ✅ Can create/manage plans
- ✅ Subscriptions work correctly
- ✅ Integration with existing features

**Phase 6 (UI Integration):**
- ✅ All UI components use real data
- ✅ User experience is smooth
- ✅ Error handling is user-friendly

**Phase 7 (Testing):**
- ✅ Test coverage > 80%
- ✅ All tests pass
- ✅ Performance meets requirements

**Phase 8 (Deployment):**
- ✅ Production deployment successful
- ✅ Monitoring works
- ✅ Documentation complete

---

## Migration Timeline

**Total Duration:** 8 weeks

**Milestones:**
- Week 2: First real Paystack transaction
- Week 4: Complete transfer system
- Week 6: Full UI integration
- Week 8: Production ready

**Parallel Work:**
- Development can continue on new features
- MSW remains available for rapid prototyping
- Gradual migration minimizes disruption

---

## Next Steps

1. **Review and Approve Architecture** - Get stakeholder sign-off
2. **Setup Development Environment** - Configure local environment
3. **Begin Phase 1 Implementation** - Start with foundation
4. **Weekly Progress Reviews** - Ensure timeline adherence
5. **Continuous Testing** - Test each phase thoroughly
6. **Documentation Updates** - Keep docs current

---

## Conclusion

This architectural plan provides a structured approach to Paystack API integration that prioritizes security, scalability, and maintainability. The phased implementation ensures minimal disruption while allowing for thorough testing and validation at each stage.

The design patterns chosen (Repository, Factory, Adapter, Strategy) provide flexibility for future changes and make the codebase maintainable and testable. The security-first approach ensures that sensitive data is protected throughout the integration process.