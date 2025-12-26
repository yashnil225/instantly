import { useState, useEffect, useCallback } from 'react'

export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

export function usePagination(totalItems: number, itemsPerPage: number = 20) {
    const [currentPage, setCurrentPage] = useState(1)
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    }

    const nextPage = () => goToPage(currentPage + 1)
    const prevPage = () => goToPage(currentPage - 1)

    return {
        currentPage,
        totalPages,
        startIndex,
        endIndex,
        goToPage,
        nextPage,
        prevPage,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
    }
}
