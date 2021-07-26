import { Dispatch, SetStateAction, useEffect, useState, useCallback } from 'react';
import { isClient } from '../utils';

/**
 * Initialized storage keys.
 */
const initializedStorageKeys = new Set<string>();

/**
 * useLocalStorage hook options.
 */
type useLocalStorageOptions = {
  sync: boolean;
};

/**
 * useLocalStorage hook.
 * @param key - local storage key
 * @param initialValue - initial value
 * @param options - hook options
 * @returns a stateful value and a function to update it
 */
const useLocalStorage = <T>(
  key: string,
  initialValue: T,
  options: useLocalStorageOptions = { sync: false }
): [T, Dispatch<SetStateAction<T>>] => {
  /**
   * State to store persisted value.
   */
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isClient) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(
        `An error occured when trying to READ from local storage key: ${key}. Returning initial value.`,
        error
      );
      return initialValue;
    }
  });

  /**
   * Detect multiple hook instances for the same key.
   */
  useEffect(() => {
    if (initializedStorageKeys.has(key)) {
      throw new Error(
        `Detected multiple instances of useLocalStorage for the same key ${key}. Please consider using global state.`
      );
    } else {
      initializedStorageKeys.add(key);
    }

    return () => {
      initializedStorageKeys.delete(key);
    };
  }, [key]);

  /**
   * Set new value. Functional updates supported.
   */
  const setNewValue: Dispatch<SetStateAction<T>> = useCallback(
    value => {
      if (!isClient) {
        console.warn('Trying to set a value inside SSR app - not supported.');
        return;
      }
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(
          `An error occured when trying to WRITE to local storage key: ${key})`,
          error
        );
      }
    },
    [key, storedValue]
  );

  /**
   * Sync changes across browser tabs/windows.
   */
  useEffect(() => {
    if (!options.sync) return;

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === window.localStorage) {
        const newValue = event.newValue ? JSON.parse(event.newValue) : initialValue;
        setStoredValue(newValue);
      }
    };

    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [initialValue, key, options.sync]);

  return [storedValue, setNewValue];
};

export default useLocalStorage;
