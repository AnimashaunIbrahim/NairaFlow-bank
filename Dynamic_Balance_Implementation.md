# Dynamic Balance Implementation - Changes Summary

## Overview
This document explains the changes made to implement dynamic balance updates when money is sent. The balance now decreases in real-time as transfers are made, instead of remaining static at ₦2,450,000.

---

## Changes Made

### 1. File: `src/mocks/handlers.js`

#### Change 1.1: Added Dynamic Balance State Variable
**Location:** Line 11 (after cachedTransactions)
**What was added:**
```javascript
// Track dynamic balance (in kobo - starts at 2,450,000 NGN = 245,000,000 kobo)
let currentBalance = 245000000;
```

**Why:**
- Created a mutable variable to track the current balance across API calls
- Balance is stored in kobo (smallest currency unit) to avoid floating-point precision issues
- Initial value matches the original static balance of ₦2,450,000 (245,000,000 kobo)

**Key Teaching Points:**
- State management in mock APIs
- Currency handling in kobo vs naira (multiply by 100 for kobo)
- Why we use integers for currency calculations (precision)

---

#### Change 1.2: Updated Balance API Handler to Use Dynamic State
**Location:** Lines 13-21 (GET /api/balance handler)
**What was changed:**
```javascript
// Before:
return HttpResponse.json({
  amount: 245000000,  // Static value
  currency: 'NGN',
  trend: 12,
});

// After:
return HttpResponse.json({
  amount: currentBalance,  // Dynamic value from state variable
  currency: 'NGN',
  trend: 12,
});
```

**Why:**
- The balance endpoint now returns the current state of `currentBalance` instead of a hardcoded value
- This allows the balance to change as transfers are made

**Key Teaching Points:**
- How API responses can be dynamic based on internal state
- The importance of state consistency across API calls
- How mock APIs can simulate real backend behavior

---

#### Change 1.3: Enhanced Transfer Handler with Balance Deduction Logic
**Location:** Lines 33-62 (POST /api/transfers handler)
**What was changed:**

**Added balance calculation logic:**
```javascript
const amountInKobo = Number(body.amount) * 100;
const transferFee = 15000; // 150 NGN fee in kobo
const currency = body.currency || 'NGN';

// Calculate total deduction from balance
let totalDeduction = amountInKobo + transferFee;
```

**Added balance validation:**
```javascript
// Deduct from balance (only if sufficient funds)
if (currentBalance >= totalDeduction) {
  currentBalance -= totalDeduction;
} else {
  return HttpResponse.json(
    { error: 'Insufficient funds for this transfer.' },
    { status: 400 }
  );
}
```

**Updated transaction creation:**
```javascript
const newTx = {
  // ... other fields
  amount: amountInKobo,  // Use calculated amount
  currency: currency,
  fee: transferFee,      // Include the fee
};
```

**Added new balance to response:**
```javascript
return HttpResponse.json({
  success: true,
  reference: `NF-${Date.now()}`,
  amount: newTx.amount,
  recipient: body.accountNumber,
  newBalance: currentBalance,  // Include updated balance in response
});
```

**Why:**
- Calculates the total cost including transfer fees (₦150)
- Validates sufficient funds before processing the transfer
- Deducts the total amount from the current balance
- Returns the new balance in the response for immediate UI feedback
- Prepared structure for future international currency support

**Key Teaching Points:**
- Financial transaction logic (amount + fees)
- Input validation and error handling
- State mutation in mock APIs
- API response design (including computed values)
- Future-proofing code for international transfers
- HTTP status codes (400 for client errors like insufficient funds)

---

### 2. File: `src/components/SendMoneyForm.jsx`

#### Change 2.1: Added React Query Import for Balance
**Location:** Line 4 (imports)
**What was added:**
```javascript
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
```

**Why:**
- Added `useQuery` hook to fetch the current balance
- This allows the form to display available funds and validate transfers

**Key Teaching Points:**
- React Query hooks for data fetching
- Import statements and their purpose
- Combining multiple React Query hooks in one component

---

#### Change 2.2: Added Balance Query Hook
**Location:** Lines 30-32 (inside SendMoneyForm component)
**What was added:**
```javascript
// Fetch current balance to show available funds and validate transfers
const balanceQuery = useQuery({ queryKey: ['balance'], queryFn: fetchBalance });
```

**Why:**
- Fetches the current balance when the component mounts
- Automatically refetches when the balance query is invalidated
- Provides loading, error, and data states for the balance

**Key Teaching Points:**
- React Query's `useQuery` hook usage
- Query keys for cache management
- How React Query handles data synchronization

---

#### Change 2.3: Enhanced Success Handler with Balance Feedback
**Location:** Lines 40-48 (mutation onSuccess callback)
**What was changed:**
```javascript
// Before:
onSuccess: (data) => {
  toast.success(`Transfer sent! Ref: ${data.reference}`);
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['balance'] });
  reset();
},

// After:
onSuccess: (data) => {
  const newBalance = data.newBalance || balanceQuery.data?.amount;
  toast.success(`Transfer sent! Ref: ${data.reference}. New balance: ${formatKobo(newBalance)}`);
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['balance'] });
  reset();
},
```

**Why:**
- Displays the new balance in the success message for immediate user feedback
- Uses the new balance from the API response if available, otherwise falls back to cached data
- Provides better user experience by showing the result of the transaction

**Key Teaching Points:**
- API response data usage in success handlers
- User feedback patterns
- Fallback values for optional data
- React Query cache invalidation for data consistency

---

#### Change 2.4: Added Available Balance Display
**Location:** Lines 79-87 (form JSX)
**What was added:**
```javascript
{/* Available Balance Display */}
{balanceQuery.data && (
  <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}>
    <span style={{ color: 'var(--color-text-secondary)' }}>Available Balance: </span>
    <span className="font-semibold">{formatKobo(balanceQuery.data.amount)}</span>
  </div>
)}
```

**Why:**
- Shows users their available balance before making a transfer
- Helps users make informed decisions about how much to send
- Only displays when balance data is available (handles loading/error states)

**Key Teaching Points:**
- Conditional rendering in React
- Data display patterns
- User experience design for financial applications
- Loading state handling

---

#### Change 2.5: Added Client-Side Balance Validation
**Location:** Lines 54-66 (onSubmit function)
**What was changed:**
```javascript
// Before:
function onSubmit(data) {
  mutation.mutate(data);
}

// After:
function onSubmit(data) {
  // Validate sufficient balance before sending
  const transferAmount = Number(data.amount) * 100; // Convert to kobo
  const transferFee = 15000; // 150 NGN fee in kobo
  const totalRequired = transferAmount + transferFee;
  const availableBalance = balanceQuery.data?.amount || 0;

  if (totalRequired > availableBalance) {
    toast.error(`Insufficient funds. Available: ${formatKobo(availableBalance)}, Required: ${formatKobo(totalRequired)}`);
    return;
  }

  mutation.mutate(data);
}
```

**Why:**
- Validates balance on the client side before making the API call
- Provides immediate feedback to users without waiting for the API
- Prevents unnecessary API calls when funds are insufficient
- Shows exactly how much is available vs. required
- Acts as a first line of defense (defense in depth)

**Key Teaching Points:**
- Client-side validation patterns
- User experience optimization (immediate feedback)
- Defense in depth (client + server validation)
- Currency conversion and calculation
- Form submission logic and early returns

---

## How It Works

### User Flow:
1. User opens Send Money page
2. Component fetches current balance via React Query
3. Available balance is displayed in the form
4. User enters transfer amount
5. On form submit, client-side validation checks if sufficient funds exist
6. If insufficient, user sees error with available vs. required amounts
7. If sufficient, transfer API call is made
8. MSW handler validates balance again (server-side validation)
9. If sufficient, balance is deducted and new transaction is created
10. API returns success with new balance
11. React Query invalidates balance cache, triggering refetch
12. Success message shows the new balance
13. Dashboard reflects the updated balance

### Data Flow:
```
User Input → Client Validation → API Call → MSW Handler → Balance Deduction → Response → Cache Update → UI Update
```

---

## Key Concepts for Students

### 1. State Management in Mock APIs
- Mock APIs can maintain state just like real backends
- Variables outside handler functions persist across requests
- This simulates database behavior

### 2. Currency Handling Best Practices
- Store currency amounts in smallest unit (kobo for NGN)
- Avoid floating-point math with money
- Convert to display format only for UI

### 3. Defense in Depth
- Validate on both client and server side
- Client validation = better UX (immediate feedback)
- Server validation = security and data integrity

### 4. React Query Cache Management
- Query keys identify cached data
- `invalidateQueries` triggers refetch
- Automatic UI updates when data changes

### 5. Financial Transaction Logic
- Always include fees in total cost calculation
- Validate sufficient funds before processing
- Return updated balance in response for UX
- Handle edge cases (insufficient funds)

### 6. Error Handling Patterns
- Use appropriate HTTP status codes (400 for client errors)
- Provide descriptive error messages
- Show users exactly what went wrong and why

---

## Future Enhancements (Already Structured in Code)

### International Currency Support
The code is prepared for international transfers:
- Currency field already exists in the form
- MSW handler has placeholder for currency conversion
- Exchange rates are available in the mock data

**To implement:**
```javascript
// In MSW handler, replace the placeholder with:
if (currency !== 'NGN') {
  const { EXCHANGE_RATES } = await import('./data');
  const rate = EXCHANGE_RATES[currency];
  totalDeduction = (amountInKobo / rate) + transferFee;
}
```

---

## Testing the Changes

### Test Scenarios:
1. **Normal Transfer:**
   - Send ₦5,000 with ₦2,450,000 balance
   - Expected: Balance becomes ₦2,444,850 (₦5,000 + ₦150 fee)

2. **Insufficient Funds:**
   - Try to send ₦3,000,000 with ₦2,450,000 balance
   - Expected: Error message showing available vs. required

3. **Multiple Transfers:**
   - Send ₦1,000, then ₦2,000, then ₦500
   - Expected: Balance decreases progressively

4. **Zero Balance:**
   - Send exact remaining balance
   - Expected: Balance becomes ₦0

5. **Currency Display:**
   - Check that balance displays correctly in Naira format
   - Expected: ₦2,450,000.00 format

---

## Files Modified Summary

1. **`src/mocks/handlers.js`** - MSW API handlers
   - Added dynamic balance state variable
   - Updated balance endpoint to return dynamic value
   - Enhanced transfer handler with balance deduction logic
   - Added insufficient funds validation
   - Included new balance in transfer response

2. **`src/components/SendMoneyForm.jsx`** - Send money form component
   - Added balance query hook
   - Added available balance display
   - Enhanced success handler with balance feedback
   - Added client-side balance validation
   - Improved user feedback messages

---

## Benefits of These Changes

1. **Realistic Behavior:** Mock API now behaves like a real banking system
2. **Better UX:** Users see their balance and get immediate feedback
3. **Teaching Value:** Demonstrates real-world financial transaction patterns
4. **Safety:** Multiple validation layers prevent errors
5. **Extensibility:** Code structure supports future international transfers
6. **Data Consistency:** React Query ensures UI stays in sync with backend state

---

## Potential Extensions

1. **Add Transfer History:** Show recent transfers in the form
2. **Balance Graph:** Visual representation of balance over time
3. **Transfer Limits:** Implement daily/monthly transfer limits
4. **Beneficiary Management:** Save frequent transfer recipients
5. **Scheduled Transfers:** Allow users to schedule future transfers
6. **Transaction Categories:** Categorize transfers for better tracking

---

This implementation provides a solid foundation for teaching students about financial application development, state management, API design, and user experience patterns in React applications.