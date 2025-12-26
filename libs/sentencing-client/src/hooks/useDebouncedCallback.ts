// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { debounce } from "lodash";
import { useEffect, useRef } from "react";

/**
 * Custom hook for creating a debounced callback function
 *
 * Creates a stable debounced function that:
 * - Always calls the latest version of the callback
 * - Flushes pending calls on unmount
 * - Uses a ref pattern to avoid stale closures
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns A debounced version of the callback with cancel() and flush() methods
 *
 * @example
 * ```tsx
 * const debouncedSave = useDebouncedCallback(
 *   (value: string) => saveToApi(value),
 *   500
 * );
 *
 * // In your handler:
 * onChange={(e) => debouncedSave(e.target.value)}
 * ```
 */
export function useDebouncedCallback<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (...args: any[]) => any,
>(callback: T, delay: number) {
  // Store the latest callback in a ref to avoid stale closures
  const callbackRef = useRef(callback);

  // Keep the ref up to date with the latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Create the debounced function once and store in a ref
  const debouncedFnRef = useRef(
    debounce((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }, delay),
  );

  // Cleanup on unmount - flush pending calls
  useEffect(() => {
    const debouncedFn = debouncedFnRef.current;
    return () => {
      debouncedFn?.flush();
    };
  }, []);

  return debouncedFnRef.current;
}
