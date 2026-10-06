# NairaFlow React App - Improvement Tasks Map

This document maps out potential improvements for the NairaFlow React application. Since you're working with limited internet connectivity, these tasks are organized by priority and complexity so you can work on them systematically when you have better connectivity.

---

## 🎯 Priority 1: TypeScript Migration (Foundation)

### Task 1.1: Initialize TypeScript Configuration
**Files to Create/Modify:**
- Create: `tsconfig.json`
- Modify: `package.json` (add TypeScript dependencies)
- Modify: `vite.config.js` → rename to `vite.config.ts`

**Implementation Steps:**
1. Install TypeScript dependencies:
   ```bash
   npm install -D typescript @types/node
   ```
2. Create `tsconfig.json` with React + Vite configuration
3. Update vite config to TypeScript
4. Add TypeScript script to package.json

**Dependencies to Add:**
- `typescript` (latest stable, at least 7 days old)
- `@types/node` (for Node.js types)

---

### Task 1.2: Define Core Type Definitions
**Files to Create:**
- Create: `src/types/index.ts` (central type definitions)

**Implementation Steps:**
1. Define API response types:
   ```typescript
   // API Response Types
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

   interface TransferRequest {
     accountNumber: string;
     bankCode: string;
     amount: number;
     currency: 'NGN' | 'USD' | 'GBP' | 'EUR' | 'CAD';
     narration?: string;
   }

   interface TransferResponse {
     success: boolean;
     reference: string;
     amount: number;
     recipient: string;
   }

   interface SavingsPlan {
     id: string;
     type: 'fixed' | 'flexible' | 'safelock';
     name: string;
     target: number;
     current: number;
     apy: number;
     locked: boolean;
   }

   interface SavingsResponse {
     plans: SavingsPlan[];
   }

   interface ExchangeRates {
     NGN: number;
     USD: number;
     GBP: number;
     EUR: number;
     CAD: number;
   }

   interface RatesResponse {
     rates: ExchangeRates;
     lastUpdated: string;
   }

   interface Insight {
     id: number;
     icon: string;
     headline: string;
     detail: string;
     confidence: number;
   }

   interface InsightsResponse {
     insights: Insight[];
   }
   ```

2. Define UI component prop types:
   ```typescript
   // Component Props Types
   interface TransactionRowProps {
     description: string;
     bank: string;
     account: string;
     amount: number;
     status: 'success' | 'pending' | 'failed';
     date: string;
   }

   interface TransactionFeedProps {
     transactions: Transaction[];
     filter: 'all' | 'success' | 'pending' | 'failed';
     onFilterChange: (filter: 'all' | 'success' | 'pending' | 'failed') => void;
   }

   interface VerdictRowProps {
     balanceKobo: number;
     currency: string;
     trend: number;
     userName: string;
   }

   interface SendMoneyFormProps {
     // Add any props if needed
   }
   ```

---

### Task 1.3: Convert API Layer to TypeScript
**Files to Modify:**
- `src/lib/api.js` → rename to `src/lib/api.ts`

**Implementation Steps:**
1. Add type annotations to all API functions
2. Add type parameters to `apiFetch` function
3. Export types for use in components

**Example Conversion:**
```typescript
// Before (api.js)
export async function fetchBalance() {
  return apiFetch('/api/balance');
}

// After (api.ts)
export async function fetchBalance(): Promise<BalanceResponse> {
  return apiFetch<BalanceResponse>('/api/balance');
}

// Update apiFetch with generics
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json() as Promise<T>;
}
```

---

### Task 1.4: Convert Utility Functions to TypeScript
**Files to Modify:**
- `src/lib/utils.js` → rename to `src/lib/utils.ts`

**Implementation Steps:**
1. Add type annotations to utility functions
2. Ensure helper functions have proper input/output types

**Expected Functions to Type:**
- `formatKobo(amount: number): string`
- `formatDate(date: string): string`
- Any other utility functions

---

### Task 1.5: Convert Context Providers to TypeScript
**Files to Modify:**
- `src/contexts/AuthContext.jsx` → rename to `src/contexts/AuthContext.tsx`
- `src/contexts/ThemeContext.jsx` → rename to `src/contexts/ThemeContext.tsx`
- `src/contexts/ToastContext.jsx` → rename to `src/contexts/ToastContext.tsx`

**Implementation Steps:**
1. Define context types
2. Add type annotations to provider components
3. Add type guards for context hooks

**Example for AuthContext:**
```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ... implementation
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
```

---

### Task 1.6: Convert Components to TypeScript (Batch 1 - Utilities)
**Files to Modify:**
- `src/components/StatusPill.jsx` → rename to `src/components/StatusPill.tsx`
- `src/components/VerdictRow.jsx` → rename to `src/components/VerdictRow.tsx`
- `src/components/MoneyInMotion.jsx` → rename to `src/components/MoneyInMotion.tsx`

**Implementation Steps:**
1. Define prop interfaces
2. Add type annotations to component functions
3. Ensure event handlers are properly typed

---

### Task 1.7: Convert Components to TypeScript (Batch 2 - Features)
**Files to Modify:**
- `src/components/TransactionFeed.jsx` → rename to `src/components/TransactionFeed.tsx`
- `src/components/SendMoneyForm.jsx` → rename to `src/components/SendMoneyForm.tsx`
- `src/components/CurrencyConverter.jsx` → rename to `src/components/CurrencyConverter.tsx`
- `src/components/InsightsPanel.jsx` → rename to `src/components/InsightsPanel.tsx`
- `src/components/SavingsCard.jsx` → rename to `src/components/SavingsCard.tsx`
- `src/components/Sidebar.jsx` → rename to `src/components/Sidebar.tsx`

**Implementation Steps:**
1. Use the types defined in `src/types/index.ts`
2. Add proper typing for React Query hooks
3. Type form handlers and event callbacks

---

### Task 1.8: Convert Pages to TypeScript
**Files to Modify:**
- `src/pages/DashboardPage.jsx` → rename to `src/pages/DashboardPage.tsx`
- `src/pages/SendMoneyPage.jsx` → rename to `src/pages/SendMoneyPage.tsx`
- `src/pages/SavingsPage.jsx` → rename to `src/pages/SavingsPage.tsx`
- `src/pages/SettingsPage.jsx` → rename to `src/pages/SettingsPage.tsx`
- `src/pages/NotFoundPage.jsx` → rename to `src/pages/NotFoundPage.tsx`

**Implementation Steps:**
1. Add type annotations to page components
2. Ensure React Query hooks are properly typed
3. Type router-related props if any

---

### Task 1.9: Convert Main App Files to TypeScript
**Files to Modify:**
- `src/App.jsx` → rename to `src/App.tsx`
- `src/main.jsx` → rename to `src/main.tsx`

**Implementation Steps:**
1. Add type annotations to main components
2. Ensure router configuration is properly typed
3. Update MSW import paths if needed

---

### Task 1.10: Convert MSW Files to TypeScript
**Files to Modify:**
- `src/mocks/handlers.js` → rename to `src/mocks/handlers.ts`
- `src/mocks/data.js` → rename to `src/mocks/data.ts`
- `src/mocks/browser.js` → rename to `src/mocks/browser.ts`

**Implementation Steps:**
1. Add type annotations to handler functions
2. Type the mock data generators
3. Ensure MSW types are properly imported

---

## 🚀 Priority 2: Architecture & Code Quality Improvements

### Task 2.1: Add Environment Configuration
**Files to Create:**
- Create: `.env` (local development)
- Create: `.env.example` (template)
- Create: `.env.production` (production settings)

**Implementation Steps:**
1. Define environment variables:
   ```env
   # .env.example
   VITE_API_BASE_URL=https://api.nairaflow.com
   VITE_APP_NAME=NairaFlow
   VITE_ENABLE_MSW=true
   ```

2. Update `src/lib/api.ts` to use environment variables:
   ```typescript
   const BASE = import.meta.env.VITE_API_BASE_URL || '';
   ```

3. Update MSW initialization to check environment flag

---

### Task 2.2: Improve Error Handling
**Files to Modify:**
- `src/lib/api.ts`
- Create: `src/lib/errorHandler.ts` (centralized error handling)

**Implementation Steps:**
1. Create custom error classes:
   ```typescript
   class ApiError extends Error {
     constructor(
       message: string,
       public status?: number,
       public code?: string
     ) {
       super(message);
       this.name = 'ApiError';
     }
   }

   class NetworkError extends Error {
     constructor(message: string) {
       super(message);
       this.name = 'NetworkError';
     }
   }
   ```

2. Enhance `apiFetch` with better error handling:
   - Network error detection
   - Timeout handling
   - Rate limit detection
   - Authentication error handling

3. Add error logging service

---

### Task 2.3: Add Request/Response Interceptors
**Files to Create:**
- Create: `src/lib/apiClient.ts` (advanced API client)

**Implementation Steps:**
1. Create a more sophisticated API client that supports:
   - Request interceptors (add auth headers, logging)
   - Response interceptors (error handling, data transformation)
   - Request cancellation
   - Retry logic with exponential backoff

2. Migrate existing API functions to use the new client

---

### Task 2.4: Add API Response Validation
**Files to Create:**
- Create: `src/lib/validation.ts` (Zod schemas for API responses)

**Implementation Steps:**
1. Create Zod schemas for all API responses:
   ```typescript
   import { z } from 'zod';

   const BalanceResponseSchema = z.object({
     amount: z.number(),
     currency: z.string(),
     trend: z.number(),
   });

   const TransactionSchema = z.object({
     id: z.string(),
     description: z.string(),
     amount: z.number(),
     currency: z.string(),
     status: z.enum(['success', 'pending', 'failed']),
     bank: z.string(),
     account: z.string(),
     date: z.string(),
     fee: z.number(),
   });
   ```

2. Integrate validation into API functions
3. Add runtime type checking for MSW responses

---

### Task 2.5: Improve React Query Configuration
**Files to Modify:**
- `src/App.tsx` (QueryClient configuration)

**Implementation Steps:**
1. Create dedicated QueryClient configuration:
   ```typescript
   // src/lib/reactQueryConfig.ts
   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 30 * 1000, // 30 seconds
         retry: (failureCount, error) => {
           if (error instanceof ApiError && error.status === 401) {
             return false; // Don't retry auth errors
           }
           return failureCount < 2;
         },
         refetchOnWindowFocus: false,
       },
       mutations: {
         retry: 1,
       },
     },
   });
   ```

2. Add query invalidation strategies
3. Implement optimistic updates for transfers

---

### Task 2.6: Add Loading States Management
**Files to Create:**
- Create: `src/hooks/useLoadingState.ts` (custom hook for loading states)

**Implementation Steps:**
1. Create a reusable loading state hook
2. Add global loading indicator
3. Implement skeleton loading components

---

### Task 2.7: Add Form Validation Enhancement
**Files to Modify:**
- `src/components/SendMoneyForm.tsx`

**Implementation Steps:**
1. Add real-time bank account validation
2. Add amount validation based on available balance
3. Add currency conversion preview
4. Implement form field dependencies

---

## 🎨 Priority 3: UI/UX Improvements

### Task 3.1: Add Responsive Design Improvements
**Files to Modify:**
- `src/components/Sidebar.tsx`
- `src/App.tsx` (layout components)

**Implementation Steps:**
1. Improve mobile navigation
2. Add tablet-specific layouts
3. Implement proper responsive breakpoints
4. Add touch-friendly interactions

---

### Task 3.2: Add Accessibility Improvements
**Files to Modify:**
- All component files

**Implementation Steps:**
1. Add ARIA labels to all interactive elements
2. Implement keyboard navigation
3. Add screen reader support
4. Improve color contrast ratios
5. Add focus indicators

---

### Task 3.3: Add Animation and Transitions
**Files to Create:**
- Create: `src/styles/animations.css` or use Tailwind animations

**Implementation Steps:**
1. Add page transition animations
2. Add loading state animations
3. Implement micro-interactions (button clicks, form inputs)
4. Add success/error state animations

---

### Task 3.4: Improve Theme System
**Files to Modify:**
- `src/contexts/ThemeContext.tsx`
- Create: `src/styles/themes.css` or enhance CSS variables

**Implementation Steps:**
1. Add more theme options (light, dark, high contrast)
2. Implement system theme detection
3. Add theme persistence
4. Create theme switcher component

---

## 🔒 Priority 4: Security Improvements

### Task 4.1: Add Input Sanitization
**Files to Modify:**
- All form components
- Create: `src/lib/sanitization.ts`

**Implementation Steps:**
1. Add XSS protection for user inputs
2. Implement CSRF protection
3. Add content security policy headers
4. Sanitize transaction descriptions

---

### Task 4.2: Add Authentication Enhancement
**Files to Modify:**
- `src/contexts/AuthContext.tsx`
- `src/lib/api.ts`

**Implementation Steps:**
1. Add JWT token handling
2. Implement token refresh logic
3. Add session timeout handling
4. Implement secure storage (httpOnly cookies or secure storage)

---

### Task 4.3: Add Rate Limiting
**Files to Modify:**
- `src/lib/api.ts`
- MSW handlers

**Implementation Steps:**
1. Implement client-side rate limiting
2. Add request throttling
3. Implement circuit breaker pattern
4. Add retry with exponential backoff

---

## 📊 Priority 5: Feature Enhancements

### Task 5.1: Add Transaction Search and Filtering
**Files to Modify:**
- `src/components/TransactionFeed.tsx`
- `src/pages/DashboardPage.tsx`

**Implementation Steps:**
1. Add search input for transactions
2. Add date range filter
3. Add amount range filter
4. Add advanced filtering options

---

### Task 5.2: Add Transaction Details View
**Files to Create:**
- Create: `src/pages/TransactionDetailPage.tsx`
- Create: `src/components/TransactionDetail.tsx`

**Implementation Steps:**
1. Add API endpoint for transaction details
2. Create transaction detail page
3. Add receipt generation
4. Add share transaction feature

---

### Task 5.3: Add Savings Plan Management
**Files to Modify:**
- `src/pages/SavingsPage.tsx`
- `src/components/SavingsCard.tsx`

**Implementation Steps:**
1. Add create new savings plan form
2. Add edit/delete savings plans
3. Add savings goal progress tracking
4. Add savings history

---

### Task 5.4: Add Budget and Expense Tracking
**Files to Create:**
- Create: `src/pages/BudgetPage.tsx`
- Create: `src/components/BudgetCard.tsx`
- Add API endpoints in `src/lib/api.ts`

**Implementation Steps:**
1. Create budget management feature
2. Add expense categorization
3. Add budget vs actual spending
4. Add spending alerts

---

### Task 5.5: Add Notifications System
**Files to Create:**
- Create: `src/contexts/NotificationContext.tsx`
- Create: `src/components/NotificationCenter.tsx`
- Add API endpoints in `src/lib/api.ts`

**Implementation Steps:**
1. Add in-app notifications
2. Add push notification support
3. Add notification preferences
4. Add notification history

---

### Task 5.6: Add Analytics Dashboard
**Files to Create:**
- Create: `src/pages/AnalyticsPage.tsx`
- Create: `src/components/AnalyticsChart.tsx`
- Add API endpoints in `src/lib/api.ts`

**Implementation Steps:**
1. Add spending analytics
2. Add income vs expense charts
3. Add savings growth charts
4. Add financial health score

---

## 🧪 Priority 6: Testing Infrastructure

### Task 6.1: Add Unit Testing Setup
**Files to Create:**
- Create: `src/__tests__/` directory structure
- Modify: `package.json` (add test dependencies)
- Create: `vitest.config.ts`

**Implementation Steps:**
1. Install testing dependencies:
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```

2. Configure Vitest with React support
3. Add test scripts to package.json

---

### Task 6.2: Add Component Tests
**Files to Create:**
- Create: `src/components/__tests__/` (test files for each component)

**Implementation Steps:**
1. Write tests for StatusPill
2. Write tests for VerdictRow
3. Write tests for TransactionFeed
4. Write tests for SendMoneyForm
5. Continue with other components

---

### Task 6.3: Add API Layer Tests
**Files to Create:**
- Create: `src/lib/__tests__/api.test.ts`

**Implementation Steps:**
1. Mock fetch for API tests
2. Test error handling
3. Test request/response transformation
4. Test retry logic

---

### Task 6.4: Add Integration Tests
**Files to Create:**
- Create: `src/pages/__tests__/` (integration tests for pages)

**Implementation Steps:**
1. Test complete user flows
2. Test authentication flow
3. Test transfer flow
4. Test navigation

---

### Task 6.5: Add E2E Testing Setup
**Files to Create:**
- Create: `e2e/` directory
- Create: `playwright.config.ts`

**Implementation Steps:**
1. Install Playwright:
   ```bash
   npm install -D @playwright/test
   ```

2. Configure Playwright
3. Write E2E tests for critical user journeys
4. Add visual regression testing

---

## 📝 Priority 7: Documentation & Developer Experience

### Task 7.1: Add Code Documentation
**Files to Modify:**
- All source files

**Implementation Steps:**
1. Add JSDoc comments to all functions
2. Add inline comments for complex logic
3. Add README for each major module
4. Add architecture documentation

---

### Task 7.2: Add Storybook for Components
**Files to Create:**
- Create: `.storybook/` configuration
- Create: `src/stories/` (component stories)

**Implementation Steps:**
1. Install Storybook:
   ```bash
   npx storybook@latest init
   ```

2. Create stories for components
3. Add documentation for component props
4. Add interactive component playground

---

### Task 7.3: Add Pre-commit Hooks
**Files to Create:**
- Create: `.husky/pre-commit`
- Modify: `package.json` (add lint-staged)

**Implementation Steps:**
1. Install Husky and lint-staged:
   ```bash
   npm install -D husky lint-staged
   npx husky init
   ```

2. Configure pre-commit hooks for:
   - Linting
   - Type checking
   - Formatting
   - Running tests

---

### Task 7.4: Add CI/CD Pipeline
**Files to Create:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`

**Implementation Steps:**
1. Create GitHub Actions workflow for:
   - Running tests
   - Type checking
   - Building application
   - Deploying to production

2. Add environment-specific configurations
3. Add automated testing on PR

---

## 🎯 Priority 8: Performance Optimization

### Task 8.1: Add Code Splitting
**Files to Modify:**
- `src/App.tsx`
- Route components

**Implementation Steps:**
1. Implement lazy loading for routes
2. Add React Suspense boundaries
3. Optimize bundle size
4. Analyze bundle with webpack-bundle-analyzer

---

### Task 8.2: Add Image Optimization
**Files to Modify:**
- Components that use images

**Implementation Steps:**
1. Implement lazy loading for images
2. Add responsive images
3. Use next-gen image formats
4. Add image compression

---

### Task 8.3: Add Caching Strategy
**Files to Modify:**
- `src/lib/api.ts`
- React Query configuration

**Implementation Steps:**
1. Implement aggressive caching for static data
2. Add cache invalidation strategies
3. Implement offline support
4. Add service worker for caching

---

## 📦 Priority 9: Build and Deployment

### Task 9.1: Add Build Optimization
**Files to Modify:**
- `vite.config.ts`
- `package.json`

**Implementation Steps:**
1. Configure build optimizations
2. Add tree shaking
3. Minimize bundle size
4. Add compression

---

### Task 9.2: Add Docker Support
**Files to Create:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `docker-compose.yml`

**Implementation Steps:**
1. Create multi-stage Docker build
2. Optimize for production
3. Add development Docker setup
4. Document Docker usage

---

### Task 9.3: Add Deployment Configuration
**Files to Create:**
- Create: `vercel.json` or `netlify.toml` (depending on platform)
- Create: `.env.production.example`

**Implementation Steps:**
1. Configure deployment platform
2. Add environment variables
3. Set up custom domains
4. Configure CDN

---

## 🔄 Implementation Order Recommendation

### Phase 1: Foundation (Week 1-2)
1. Task 1.1-1.3: TypeScript setup and core types
2. Task 1.4-1.5: Utility and Context TypeScript conversion
3. Task 2.1: Environment configuration

### Phase 2: Core Features (Week 3-4)
1. Task 1.6-1.9: Component and Page TypeScript conversion
2. Task 1.10: MSW TypeScript conversion
3. Task 2.2-2.3: Error handling and API client improvements

### Phase 3: Quality & Testing (Week 5-6)
1. Task 2.4-2.5: Validation and React Query improvements
2. Task 6.1-6.3: Unit and integration testing setup
3. Task 7.3: Pre-commit hooks

### Phase 4: UX & Features (Week 7-8)
1. Task 3.1-3.2: Responsive and accessibility improvements
2. Task 5.1-5.2: Transaction search and details
3. Task 2.6-2.7: Loading states and form validation

### Phase 5: Advanced Features (Week 9-10)
1. Task 5.3-5.6: Savings, budget, notifications, analytics
2. Task 4.1-4.3: Security improvements
3. Task 6.4-6.5: E2E testing

### Phase 6: Production Ready (Week 11-12)
1. Task 3.3-3.4: Animations and theme system
2. Task 7.1-7.2: Documentation and Storybook
3. Task 8.1-8.3: Performance optimization
4. Task 9.1-9.3: Build and deployment

---

## 📋 Quick Reference Summary

### Files to Rename (.js → .ts/.tsx)
- `src/lib/api.js` → `src/lib/api.ts`
- `src/lib/utils.js` → `src/lib/utils.ts`
- `src/contexts/*.jsx` → `src/contexts/*.tsx`
- `src/components/*.jsx` → `src/components/*.tsx`
- `src/pages/*.jsx` → `src/pages/*.tsx`
- `src/App.jsx` → `src/App.tsx`
- `src/main.jsx` → `src/main.tsx`
- `src/mocks/*.js` → `src/mocks/*.ts`
- `vite.config.js` → `vite.config.ts`

### Files to Create
- `tsconfig.json`
- `src/types/index.ts`
- `.env`, `.env.example`, `.env.production`
- `src/lib/errorHandler.ts`
- `src/lib/apiClient.ts`
- `src/lib/validation.ts`
- `src/lib/reactQueryConfig.ts`
- `src/hooks/useLoadingState.ts`
- `src/lib/sanitization.ts`
- `vitest.config.ts`
- `playwright.config.ts`
- `Dockerfile`, `docker-compose.yml`
- `.github/workflows/ci.yml`

### Dependencies to Add
- TypeScript: `typescript`, `@types/node`
- Testing: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
- E2E: `@playwright/test`
- Git hooks: `husky`, `lint-staged`
- Documentation: `storybook` (optional)

---

## 💡 Tips for Working Offline

1. **Download Documentation**: Before going offline, download:
   - TypeScript documentation
   - React Query documentation
   - Zod documentation
   - Vitest/Playwright documentation

2. **Save Reference Examples**: Keep examples of:
   - TypeScript patterns used in the project
   - Common React Query patterns
   - Zod schema examples
   - Testing patterns

3. **Use IDE Features**: Leverage:
   - VS Code IntelliSense
   - TypeScript autocomplete
   - Inline documentation
   - Code snippets

4. **Incremental Approach**: Work on one task at a time and test frequently

5. **Keep Notes**: Document any issues or decisions made while working offline

---

## 🚨 Notes on Breaking Changes

When implementing these improvements, be aware of:

1. **TypeScript Migration**: Will require gradual conversion to avoid breaking the build
2. **API Changes**: Changes to API layer will affect all consuming components
3. **Context Changes**: Modifying contexts will require updating all consumers
4. **Route Changes**: Adding new routes requires updating navigation components
5. **Environment Variables**: Adding new env vars requires updating deployment configs

---

This task map provides a comprehensive roadmap for improving the NairaFlow application. Start with the TypeScript migration (Priority 1) as it provides the foundation for most other improvements. Work through the priorities systematically, and don't hesitate to adjust the order based on your specific needs and constraints.