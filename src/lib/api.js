/**
 * API layer — all fetch functions used by React Query.
 * Same pattern as Phase 2's api.js, but typed for React Query.
 */

const BASE = '';
// In production app, the base url must be specified
// https://api.nairaflow.com/v1/payments
async function apiFetch(url, options) {
  const res = await fetch(`${BASE}${url}`, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export async function fetchBalance() {
  return apiFetch('/api/balance');
}

export async function fetchTransactions() {
  const data = await apiFetch('/api/transactions');
  return data.transactions;
}

export async function sendTransfer(transferData) {
  return apiFetch('/api/transfers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transferData),
  });
}

export async function fetchSavings() {
  const data = await apiFetch('/api/savings');
  return data.plans;
}

export async function fetchRates() {
  return apiFetch('/api/rates');
}

export async function fetchInsights() {
  const data = await apiFetch('/api/insights');
  return data.insights;
}
