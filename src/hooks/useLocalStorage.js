import { useState, useEffect } from "react";

const useLocalStorage = (key, initialValue) => {
  if (typeof key !== "string" || key.trim() === "") {
    console.error(
      "useLocalStorage: A valid string 'key' parameter is required. You passed:",
      key
    );
  }

  const [value, setValue] = useState(() => {
    // 2. Prevent crashes during Server-Side Rendering (e.g., Next.js)
    if (typeof window === "undefined") {
      console.warn(`useLocalStorage: Running on server, returning initialValue for key "${key}".`);
      return initialValue;
    }

    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : initialValue;
    } catch (error) {
      // 3. Catch JSON parsing errors (e.g., if someone manually edited the storage with bad data)
      console.error(
        `useLocalStorage: Error reading or parsing localStorage key "${key}". Falling back to initialValue.`,
        error
      );
      return initialValue;
    }
  });

  useEffect(() => {
    // Don't attempt to save if the key is invalid
    if (typeof key !== "string" || key.trim() === "") return;

    try {
      // 4. Warn if trying to save undefined, which strips it from JSON
      if (value === undefined) {
        console.warn(
          `useLocalStorage: You are trying to save 'undefined' for key "${key}". This might cause unexpected behavior.`
        );
      }
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // 5. Catch storage errors (e.g., QuotaExceededError if the hard drive is full, or Safari private mode blocks)
      console.error(
        `useLocalStorage: Error setting localStorage key "${key}". Storage might be full or disabled.`,
        error
      );
    }
  }, [key, value]);

  return [value, setValue];
};

export default useLocalStorage;