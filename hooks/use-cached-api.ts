"use client"

import { useState, useEffect, useCallback } from "react"

interface CacheEntry<T> {
    data: T
    timestamp: number
}

interface UseCachedApiOptions {
    cacheKey: string
    cacheDuration?: number // in milliseconds, default 5 minutes
    enabled?: boolean
}

/**
 * Custom hook for API requests with localStorage caching
 * Supports optimistic updates and automatic cache invalidation
 */
export function useCachedApi<T>(
    fetchFn: () => Promise<T>,
    options: UseCachedApiOptions
) {
    const { cacheKey, cacheDuration = 5 * 60 * 1000, enabled = true } = options

    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    // Get cached data from localStorage
    const getCachedData = useCallback((): T | null => {
        if (typeof window === "undefined") return null

        try {
            const cached = localStorage.getItem(`api_cache_${cacheKey}`)
            if (!cached) return null

            const entry: CacheEntry<T> = JSON.parse(cached)
            const isExpired = Date.now() - entry.timestamp > cacheDuration

            if (isExpired) {
                localStorage.removeItem(`api_cache_${cacheKey}`)
                return null
            }

            return entry.data
        } catch {
            return null
        }
    }, [cacheKey, cacheDuration])

    // Set data to cache
    const setCachedData = useCallback((newData: T) => {
        if (typeof window === "undefined") return

        const entry: CacheEntry<T> = {
            data: newData,
            timestamp: Date.now()
        }
        localStorage.setItem(`api_cache_${cacheKey}`, JSON.stringify(entry))
    }, [cacheKey])

    // Invalidate cache
    const invalidateCache = useCallback(() => {
        if (typeof window === "undefined") return
        localStorage.removeItem(`api_cache_${cacheKey}`)
    }, [cacheKey])

    // Fetch data with caching
    const fetchData = useCallback(async (forceRefresh = false) => {
        if (!enabled) return

        // Try cache first (unless force refresh)
        if (!forceRefresh) {
            const cached = getCachedData()
            if (cached) {
                setData(cached)
                setLoading(false)
                return
            }
        }

        setLoading(true)
        setError(null)

        try {
            const result = await fetchFn()
            setData(result)
            setCachedData(result)
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Failed to fetch"))
        } finally {
            setLoading(false)
        }
    }, [enabled, fetchFn, getCachedData, setCachedData])

    // Optimistic update helper
    const optimisticUpdate = useCallback(async <R>(
        updateFn: () => Promise<R>,
        optimisticData: T,
        rollbackData?: T
    ): Promise<R> => {
        const previousData = data

        // Apply optimistic update immediately
        setData(optimisticData)
        setCachedData(optimisticData)

        try {
            const result = await updateFn()
            return result
        } catch (err) {
            // Rollback on error
            const rollback = rollbackData ?? previousData
            if (rollback) {
                setData(rollback)
                setCachedData(rollback)
            }
            throw err
        }
    }, [data, setCachedData])

    // Initial fetch
    useEffect(() => {
        fetchData()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return {
        data,
        loading,
        error,
        refetch: () => fetchData(true),
        invalidateCache,
        optimisticUpdate,
        setData: (newData: T) => {
            setData(newData)
            setCachedData(newData)
        }
    }
}

/**
 * Utility to invalidate all API caches
 */
export function invalidateAllCaches() {
    if (typeof window === "undefined") return

    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith("api_cache_")) {
            keysToRemove.push(key)
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
}

/**
 * Hook to clear cache on component unmount (useful for settings pages)
 */
export function useCacheInvalidation(cacheKeys: string[]) {
    useEffect(() => {
        return () => {
            cacheKeys.forEach(key => {
                localStorage.removeItem(`api_cache_${key}`)
            })
        }
    }, [cacheKeys])
}
