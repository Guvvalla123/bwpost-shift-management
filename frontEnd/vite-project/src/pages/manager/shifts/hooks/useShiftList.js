import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/utils/apiError'
import { shiftService } from '@/api/services'

const LIMIT = 20

export function useShiftList(activeFilter, debouncedSearch) {
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalShifts, setTotalShifts] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(() => new Date())

  const silentRefreshRef = useRef(null)

  const loadShifts = useCallback(
    async (page, silent = false) => {
      try {
        if (!silent) {
          setLoading(true)
          setFetchError(false)
        }
        const result = await shiftService.getAllShifts(
          page,
          LIMIT,
          activeFilter,
          debouncedSearch,
        )
        setShifts(result.shifts)
        setTotalPages(result.totalPages)
        setTotalShifts(result.total)
        setLastUpdated(new Date())
      } catch (err) {
        if (!silent) {
          setFetchError(true)
          toast.error(
            getApiErrorMessage(err, 'Failed to load shifts. Please try again.'),
          )
        }
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [activeFilter, debouncedSearch],
  )

  useEffect(() => {
    setCurrentPage(1)
    loadShifts(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, debouncedSearch])

  useEffect(() => {
    loadShifts(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  silentRefreshRef.current = () => loadShifts(currentPage, true)

  useEffect(() => {
    const interval = setInterval(() => {
      silentRefreshRef.current?.()
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  const refetch = useCallback(() => {
    loadShifts(currentPage)
  }, [currentPage, loadShifts])

  return {
    shifts,
    loading,
    error: fetchError,
    fetchError,
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    totalItems: totalShifts,
    totalShifts,
    lastUpdated,
    refetch,
    loadShifts,
  }
}
