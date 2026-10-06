# API Architecture & MSW (Mock Service Worker) Breakdown

## Overview

This document breaks down the API layer architecture in the NairaFlow React application and explains how Mock Service Worker (MSW) fits into the development workflow. This is designed to help learners understand the separation between API calls and actual network requests.

---

## 1. API Layer Architecture (`src/lib/api.js`)

### Core Concept: Separation of Concerns

The API layer serves as a **centralized interface** between your React components and the backend. This follows the Single Responsibility Principle - components focus on UI, while the API layer handles all HTTP communication.

### File Structure

```javascript
/**
 * API layer — all fetch functions used by React Query.
 * Same pattern as Phase 2's api.js, but typed for React Query.
 */

const BASE = '';
// In production app, the base url must be specified
```

**Key Points:**
- `BASE` is currently empty string for development with MSW
- In production, this would be something like `'https://api.nairaflow.com'`
- All API calls go through this centralized layer

### The `apiFetch` Helper Function

```javascript
async function apiFetch(url, options) {
  const res = await fetch(`${BASE}${url}`, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}
```

**What this does:**
1. **Centralizes fetch logic** - All HTTP requests go through this single function
2. **Handles errors consistently** - Automatic error checking and standardized error messages
3. **Simplifies API calls** - Other functions don't need to worry about error handling
4. **Makes testing easier** - You can mock this one function instead of multiple fetch calls

**Error Handling Flow:**
- If response is not OK (!res.ok), try to parse error JSON
- If error JSON exists, use the `error` field from the response
- If error JSON parsing fails, fall back to generic HTTP error message
- Throw the error so React Query can handle it

### API Functions

Each function corresponds to a specific backend endpoint:

#### 1. `fetchBalance()` - GET /api/balance
```javascript
export async function fetchBalance() {
  return apiFetch('/api/balance');
}
```
- **Purpose**: Get user's current account balance
- **Used in**: DashboardPage component
- **Expected Response**: `{ amount: number, currency: string, trend: number }`

#### 2. `fetchTransactions()` - GET /api/transactions
```javascript
export async function fetchTransactions() {
  const data = await apiFetch('/api/transactions');
  return data.transactions;
}
```
- **Purpose**: Get user's transaction history
- **Used in**: DashboardPage component
- **Expected Response**: `{ transactions: Transaction[] }`
- **Note**: Extracts the `transactions` array from the response

#### 3. `sendTransfer(transferData)` - POST /api/transfers
```javascript
export async function sendTransfer(transferData) {
  return apiFetch('/api/transfers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transferData),
  });
}
```
- **Purpose**: Send money to another account
- **Used in**: SendMoneyPage component
- **Expected Response**: `{ success: boolean, reference: string, amount: number, recipient: string }`
- **Note**: Only function that uses POST method and sends data in request body

#### 4. `fetchSavings()` - GET /api/savings
```javascript
export async function fetchSavings() {
  const data = await apiFetch('/api/savings');
  return data.plans;
}
```
- **Purpose**: Get user's savings plans
- **Used in**: SavingsPage component
- **Expected Response**: `{ plans: SavingsPlan[] }`

#### 5. `fetchRates()` - GET /api/rates
```javascript
export async function fetchRates() {
  return apiFetch('/api/rates');
}
```
- **Purpose**: Get current exchange rates
- **Used in**: CurrencyConverter component
- **Expected Response**: `{ rates: object, lastUpdated: string }`

#### 6. `fetchInsights()` - GET /api/insights
```javascript
export async function fetchInsights() {
  const data = await apiFetch('/api/insights');
  return data.insights;
}
```
- **Purpose**: Get AI-powered financial insights
- **Used in**: InsightsPanel component
- **Expected Response**: `{ insights: Insight[] }`

---

## 2. Integration with React Query

### How React Query Uses These Functions

React Query (TanStack Query) manages data fetching, caching, and state:

```javascript
// In DashboardPage.jsx
const balanceQuery = useQuery({ 
  queryKey: ['balance'], 
  queryFn: fetchBalance 
});
```

**Key Concepts:**
- **queryKey**: Unique identifier for the cache (used for refetching, invalidation)
- **queryFn**: The function from our API layer that actually fetches data
- **Automatic states**: `isPending`, `isError`, `data`, `refetch()`

### Benefits of This Architecture

1. **Testability**: Mock the API functions instead of mocking fetch
2. **Reusability**: Same API functions can be used across different components
3. **Maintainability**: Changes to API structure only need to be made in one place
4. **Type Safety**: When migrated to TypeScript, functions can have strict type definitions
5. **Error Handling**: Centralized error handling logic

---

## 3. Mock Service Worker (MSW) Integration

### What is MSW?

MSW (Mock Service Worker) is a library that **intercepts network requests at the browser level** using Service Workers. This means:
- Your actual API code doesn't need to change
- MSW sits between your app and the network
- In development, MSW responds to requests instead of a real server
- In production, MSW is disabled and requests go to real servers

### MSW Setup Flow

#### Step 1: MSW Browser Setup (`src/mocks/browser.js`)
```javascript
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

**What this does:**
- Creates a Service Worker that will intercept requests
- Registers all the mock handlers (our fake API endpoints)

#### Step 2: MSW Handlers (`src/mocks/handlers.js`)

Each handler corresponds to an API endpoint in `api.js`:

```javascript
export const handlers = [
  // GET /api/balance
  http.get('/api/balance', async () => {
    await delay(600); // Simulate network latency
    if (Math.random() < 0.05) return new HttpResponse(null, { status: 500 });
    return HttpResponse.json({
      amount: 245000000,
      currency: 'NGN',
      trend: 12,
    });
  }),
  
  // POST /api/transfers
  http.post('/api/transfers', async ({ request }) => {
    await delay(1500);
    const body = await request.json();
    // Process transfer and return response
    return HttpResponse.json({ success: true, reference: `NF-${Date.now()}` });
  }),
  
  // ... more handlers
];
```

**Key Features:**
- **Simulates network delays** using `await delay()` - makes app feel realistic
- **Simulates random failures** - helps test error handling (5% chance of 500 error)
- **Returns realistic data** - Matches the structure expected by your API functions
- **Stateful mocking** - Can maintain state (like adding new transactions)

#### Step 3: Mock Data Generation (`src/mocks/data.js`)

```javascript
const NIGERIAN_NAMES = ['Chinedu Okafor', 'Amina Bello', ...];
const BANKS = ['GTBank', 'Access Bank', ...];

export function generateTransactions(count = 15) {
  return Array.from({ length: count }, (_, i) => ({
    id: `tx-${String(i + 1).padStart(3, '0')}`,
    description: `Transfer to ${NIGERIAN_NAMES[i % NIGERIAN_NAMES.length]}`,
    amount: Math.floor(Math.random() * 50000000) + 10000,
    currency: 'NGN',
    status: randomItem(['success', 'success', 'success', 'success', 'pending', 'failed']),
    bank: randomItem(BANKS),
    account: String(Math.floor(Math.random() * 9000000000) + 1000000000),
    date: new Date(Date.now() - i * 3600000 * (2 + Math.random() * 20)).toISOString(),
    fee: Math.random() > 0.5 ? 15000 : 0,
  }));
}
```

**Why generate data dynamically?**
- More realistic than static data
- Different data on each refresh
- Simulates real API behavior
- Can test edge cases (different statuses, amounts, etc.)

#### Step 4: MSW Initialization (`src/main.jsx`)

```javascript
async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    return worker.start({ onUnhandledRequest: 'bypass' });
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
```

**How this works:**
- Only runs in development mode (`import.meta.env.DEV`)
- Waits for MSW to start before rendering the app
- `onUnhandledRequest: 'bypass'` lets non-mocked requests pass through

### The Magic: Request Flow

**Development with MSW:**
```
Component → React Query → fetchBalance() → apiFetch('/api/balance')
                                                    ↓
                                            MSW Service Worker
                                                    ↓
                                    Returns mock data after 600ms delay
```

**Production without MSW:**
```
Component → React Query → fetchBalance() → apiFetch('/api/balance')
                                                    ↓
                                            Real Network Request
                                                    ↓
                                    https://api.nairaflow.com/api/balance
```

**Key Insight:** Your `api.js` code **never changes** between development and production!

---

## 4. Benefits of This Architecture for Learners

### For Teaching API Concepts

1. **Clear separation**: Learners can see UI logic separate from API logic
2. **Easy to understand**: Each function has a single, clear purpose
3. **Progressive complexity**: Start with simple GET, move to POST with data
4. **Real-world patterns**: This is how production apps are structured

### For Teaching Testing

1. **Easy to mock**: Just mock the API functions, not the entire fetch API
2. **MSW for integration tests**: Test the full flow without needing a real backend
3. **Error handling**: MSW can simulate errors to test error states

### For Teaching State Management

1. **React Query integration**: Shows how to connect API calls to state
2. **Loading states**: Built-in `isPending`, `isError` states
3. **Caching**: React Query automatically caches responses

---

## 5. Common Patterns and Anti-Patterns

### ✅ Good Patterns (Used in This Codebase)

1. **Centralized API layer**: All API calls in one file
2. **Consistent error handling**: Single error handling logic
3. **Type-aligned responses**: Mock data matches expected API structure
4. **Network simulation**: MSW simulates realistic delays and failures

### ❌ Anti-Patterns to Avoid

1. **Fetch directly in components**: Makes components hard to test and reuse
2. **Inconsistent error handling**: Different error handling per endpoint
3. **Hard-coded URLs**: Should use environment variables for different environments
4. **No loading states**: Users don't know if requests are in progress

---

## 6. Migration Path to TypeScript

When migrating to TypeScript, the API layer would look like:

```typescript
// Define types for API responses
interface BalanceResponse {
  amount: number;
  currency: string;
  trend: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: string;
  status: 'success' | 'pending' | 'failed';
  bank: string;
  account: string;
  date: string;
  fee: number;
}

interface TransactionsResponse {
  transactions: Transaction[];
}

// Typed API functions
export async function fetchBalance(): Promise<BalanceResponse> {
  return apiFetch('/api/balance');
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const data = await apiFetch<TransactionsResponse>('/api/transactions');
  return data.transactions;
}
```

This provides:
- **Compile-time type checking**
- **Autocomplete in IDE**
- **Prevents runtime errors**
- **Self-documenting code**

---

## 7. Summary for Learners

### Key Takeaways

1. **API Layer = Contract**: Your API functions define the contract between frontend and backend
2. **MSW = Development Tool**: MSW helps you develop without a real backend
3. **React Query = State Manager**: React Query handles the complexity of data fetching
4. **Separation = Maintainability**: Keeping concerns separate makes code easier to maintain

### Learning Sequence

1. **Start with API functions**: Understand what each endpoint does
2. **Add React Query**: See how components use the API functions
3. **Introduce MSW**: Understand how mocking works without changing API code
4. **Add error handling**: Learn to handle loading and error states
5. **TypeScript migration**: Add types for better development experience

### Practice Exercises

1. **Add a new endpoint**: Create `fetchNotifications()` in api.js and corresponding MSW handler
2. **Simulate errors**: Increase the error rate in MSW to test error handling
3. **Add caching**: Experiment with React Query's `staleTime` and `cacheTime`
4. **Type the responses**: Add TypeScript interfaces for each API response

---

## 8. Files Reference

### Core API Files
- `src/lib/api.js` - API layer functions
- `src/mocks/handlers.js` - MSW request handlers
- `src/mocks/data.js` - Mock data generators
- `src/mocks/browser.js` - MSW browser setup
- `src/main.jsx` - MSW initialization

### Usage Files
- `src/pages/DashboardPage.jsx` - Uses fetchBalance, fetchTransactions
- `src/pages/SendMoneyPage.jsx` - Uses sendTransfer
- `src/pages/SavingsPage.jsx` - Uses fetchSavings
- `src/components/CurrencyConverter.jsx` - Uses fetchRates
- `src/components/InsightsPanel.jsx` - Uses fetchInsights

### Configuration
- `package.json` - MSW dependency and worker directory configuration
- `public/mockServiceWorker.js` - Service Worker script (auto-generated by MSW)
