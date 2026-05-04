import { useState, useEffect, useCallback, useRef } from 'react'
import { employeeService } from '@/api/services'

const PAGE_SIZE = 20
const DEBOUNCE_MS = 300

export function useEmployeeList() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [search, setSearchState] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [dashLoading, setDashLoading] = useState(true)
  const [dashStats, setDashStats] = useState(null)

  const refreshTimerRef = useRef(null)

  const setSearch = useCallback((text) => {
    setSearchState(text)
    setPage(1)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [search])

  const fetchList = useCallback(
    async (silent) => {
      if (!silent) {
        setLoading(true)
        setFetchError(false)
      }
      try {
        const result = await employeeService.getAllEmployees(
          page,
          debouncedSearch,
        )
        setEmployees(result.employees)
        setTotalPages(result.totalPages)
        setTotalItems(result.total)
        if (!silent) setFetchError(false)
      } catch {
        if (!silent) {
          setFetchError(true)
          setEmployees([])
          setTotalPages(1)
          setTotalItems(0)
        }
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [page, debouncedSearch],
  )

  const fetchDashSilent = useCallback(async () => {
    try {
      const stats = await employeeService.getDashboardStats()
      setDashStats(stats)
    } catch {
      /* keep previous dash data */
    }
  }, [])

  const fetchDashboardStats = useCallback(async () => {
    setDashLoading(true)
    try {
      const stats = await employeeService.getDashboardStats()
      setDashStats(stats)
    } catch {
      setDashStats(null)
    } finally {
      setDashLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchList(false)
  }, [fetchList])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      fetchList(true)
      fetchDashSilent()
    }, 60_000)
    return () => clearInterval(refreshTimerRef.current)
  }, [fetchList, fetchDashSilent])

  const refetchAll = useCallback(async () => {
    await fetchList(false)
    await fetchDashboardStats()
  }, [fetchList, fetchDashboardStats])

  const stats = dashStats?.stats ?? {}
  const activeEmployees = stats.totalEmployees ?? 0
  const newThisMonth = stats.newThisMonth ?? stats.newEmployeesThisMonth ?? 0

  return {
    employees,
    loading,
    fetchError,
    dashLoading,
    page,
    setPage,
    totalPages,
    totalItems,
    search,
    setSearch,
    refetchAll,
    stats: {
      activeEmployees,
      newThisMonth,
    },
  }
}

export { PAGE_SIZE }
