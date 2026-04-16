/**
 * Debounce Hook
 * 
 * Delays updating a value until after a specified delay has passed
 * without the value changing. Useful for search inputs and filters.
 * 
 * @example
 * ```typescript
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 * 
 * // Use debouncedSearch in useEffect or query
 * useEffect(() => {
 *   fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 * ```
 */

import { useState, useEffect } from "react"

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Debounced callback hook
 * 
 * Returns a debounced version of the callback function.
 * 
 * @example
 * ```typescript
 * const debouncedSave = useDebouncedCallback((data) => {
 *   saveToServer(data)
 * }, 500)
 * ```
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null)

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const id = setTimeout(() => {
      callback(...args)
    }, delay)

    setTimeoutId(id)
  }
}
