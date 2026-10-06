import { useState, useEffect } from 'react';

/**
 * A generic hook for syncing state with localStorage.
 * 
 * @param key - The localStorage key
 * @param initialValue - The default value if the key doesn't exist
 * @returns A tuple of the current value and a setter function, similar to useState
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      // We cast the parsed JSON to <T> since JSON.parse returns 'any'
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Keep localStorage in sync with our state
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // 'as const' tells TypeScript this is a tuple [T, function], not an array (T | function)[]
  return [storedValue, setStoredValue] as const;
}
