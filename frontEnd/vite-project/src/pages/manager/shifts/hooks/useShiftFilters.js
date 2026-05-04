import { useState, useEffect, useCallback } from 'react'

export function useShiftFilters(initial = {}) {
  const [filters, setFilters] = useState({
    activeFilter: initial.activeFilter ?? 'all',
    searchText: initial.searchText ?? '',
    ...initial,
  })
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { activeFilter, searchText } = filters

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 300)
    return () => clearTimeout(t)
  }, [searchText])

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setActiveFilter = useCallback((v) => {
    setFilters((prev) => ({ ...prev, activeFilter: v }))
  }, [])

  const setSearchText = useCallback((v) => {
    setFilters((prev) => ({
      ...prev,
      searchText: typeof v === 'function' ? v(prev.searchText) : v,
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({ activeFilter: 'all', searchText: '' })
  }, [])

  return {
    filters,
    activeFilter,
    searchText,
    debouncedSearch,
    setFilter,
    setActiveFilter,
    setSearchText,
    resetFilters,
    setFilters,
  }
}
