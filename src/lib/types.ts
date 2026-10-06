/**
 * Core Domain Types for NairaFlow
 * This file acts as the single source of truth for our fintech data structures.
 */

export type Currency = 'NGN' | 'USD' | 'GBP' | 'EUR' | 'CAD';
export type TransactionStatus = 'success' | 'pending' | 'failed';

/**
 * Branded Type for Kobo.
 * This prevents accidentally passing a regular `number` (like an exchange rate
 * or percentage) into a function that expects Kobo.
 */
export type Kobo = number & { readonly __brand: unique symbol };

/** Helper to cast a safe integer to Kobo */
export function asKobo(value: number): Kobo {
  return Math.round(value) as Kobo;
}

export interface Transaction {
  id: string;
  description: string;
  amount: Kobo;
  currency: Currency;
  status: TransactionStatus;
  bank: string;
  account: string;
  date: string; // ISO 8601 string
  fee: Kobo;
}

export interface SavingsPlan {
  id: string;
  type: 'fixed' | 'flexible' | 'safelock';
  name: string;
  target: Kobo;
  current: Kobo;
  apy: number;
  locked: boolean;
}

export interface Insight {
  id: number;
  icon: string;
  headline: string;
  detail: string;
  confidence: number; // 0.0 to 1.0
}
