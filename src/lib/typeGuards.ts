/**
 * Type Guards and Assertions for NairaFlow
 */

import type { Transaction, Kobo } from './types';

/**
 * Ensures a switch statement or if/else chain is exhaustive over a union type.
 * If a new member is added to the union and not handled, TypeScript will fail to compile.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
}

/**
 * Custom type guard to filter successful transactions.
 * Usage: const successTxs = allTxs.filter(isSuccessfulTransaction);
 */
export function isSuccessfulTransaction(tx: Transaction): tx is Transaction & { status: 'success' } {
  return tx.status === 'success';
}

/**
 * Assertion function to ensure a number at runtime is actually a safe Kobo integer.
 * Usage: assertIsKobo(rawValue); // After this line, TS treats rawValue as Kobo.
 */
export function assertIsKobo(value: number): asserts value is Kobo {
  if (!Number.isInteger(value)) {
    throw new Error(`Invariant violation: ${value} is not an integer. Cannot be cast to Kobo.`);
  }
}
