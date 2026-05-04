import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/utils/apiError'
import API from '@/api'
import { shiftService } from '@/api/services'
import ShiftStats from './ShiftStats'
import ShiftFilters from './ShiftFilters'
import ShiftDetails from './ShiftDetails'
import ShiftDeleteConfirm from './ShiftDeleteConfirm'
import CreateShiftModal from './modals/CreateShiftModal'
import EditShiftModal from './modals/EditShiftModal'
import ShiftToolbar from './components/ShiftToolbar'
import ShiftList from './components/ShiftList'
import ShiftDistributionAside from './components/ShiftDistributionAside'
import { useShiftFilters } from './hooks/useShiftFilters'
import { useShiftList } from './hooks/useShiftList'
import { useShiftMutations } from './hooks/useShiftMutations'

const ShiftsPage = () => {
  const {
    activeFilter,
    setActiveFilter,
    searchText,
    setSearchText,
    debouncedSearch,
  } = useShiftFilters()

  const {
    shifts,
    loading,
    fetchError,
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    totalShifts,
    lastUpdated,
    loadShifts,
  } = useShiftList(activeFilter, debouncedSearch)

  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    ongoing: 0,
    upcoming: 0,
    completed: 0,
  })
  const [dashData, setDashData] = useState(null)
  const [showFiltersPanel, setShowFiltersPanel] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedShift, setSelectedShift] = useState(null)

  const loadStats = useCallback(async () => {
    try {
      const [counts, dash] = await Promise.all([
        shiftService.getStatusCounts(),
        shiftService.getDashboardData(),
      ])
      setStatusCounts(counts)
      setDashData(dash)
    } catch {
      /* keep previous stats */
    }
  }, [])

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- initial KPI/dashboard fetch on mount */
    void loadStats()
  }, [loadStats])

  const reloadListOnly = useCallback(
    () => loadShifts(currentPage),
    [loadShifts, currentPage],
  )
  const closeCreateModalCb = useCallback(() => setShowCreateForm(false), [])

  const {
    shiftToDelete,
    setShiftToDelete,
    isDeleting,
    createFormData,
    isCreating,
    shiftToEdit,
    setShiftToEdit,
    isEditing,
    handleCreateFormChange,
    handleEditFormChange,
    handleCreateSubmit,
    handleEditSubmit,
    handleConfirmDelete,
  } = useShiftMutations(loadStats, reloadListOnly, {
    closeCreateModal: closeCreateModalCb,
  })

  useEffect(() => {
    function esc(e) {
      if (e.key !== 'Escape') return
      if (selectedShift) return void setSelectedShift(null)
      if (showCreateForm) return void setShowCreateForm(false)
      if (shiftToEdit) return void setShiftToEdit(null)
      if (shiftToDelete) return void setShiftToDelete(null)
    }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [
    selectedShift,
    showCreateForm,
    shiftToEdit,
    shiftToDelete,
    setShiftToDelete,
    setShiftToEdit,
  ])

  const handleExportCsv = useCallback(async () => {
    try {
      const res = await API.get('/api/manager/shifts/export/csv', {
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shifts-export-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('CSV download started')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Export failed. Please try again.'))
    }
  }, [])

  const handleEditOpen = useCallback(
    (shift) => setShiftToEdit(shift),
    [setShiftToEdit],
  )
  const handleDeletePrompt = useCallback(
    (shift) => setShiftToDelete(shift),
    [setShiftToDelete],
  )

  return (
    <div className="min-h-screen bg-[#F8F9FC] px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <ShiftToolbar
          onCreateShift={() => setShowCreateForm(true)}
          onExport={handleExportCsv}
          shiftsCount={totalShifts}
          showFilters={showFiltersPanel}
          onToggleFilters={() => setShowFiltersPanel((v) => !v)}
        />

        <ShiftStats
          statusCounts={statusCounts}
          activeFilter={activeFilter}
          onFilterClick={setActiveFilter}
          loading={loading}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
          <div className="order-2 overflow-hidden rounded-2xl border border-gray-100 bg-white p-0 shadow-sm lg:order-1 lg:col-span-8">
            <div className={showFiltersPanel ? 'block' : 'hidden md:block'}>
              <ShiftFilters
                searchText={searchText}
                onSearchChange={setSearchText}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                statusCounts={statusCounts}
              />
            </div>

            <ShiftList
              shifts={shifts}
              onEdit={handleEditOpen}
              onDelete={handleDeletePrompt}
              onViewDetails={setSelectedShift}
              loading={loading}
              fetchError={fetchError}
              onRetry={() => loadShifts(currentPage)}
              totalShifts={totalShifts}
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              lastUpdated={lastUpdated}
              emptyOnCreate={() => setShowCreateForm(true)}
            />
          </div>

          <ShiftDistributionAside dashData={dashData} />
        </div>
      </div>

      <CreateShiftModal
        show={showCreateForm}
        setShow={setShowCreateForm}
        createShift={createFormData}
        onChange={handleCreateFormChange}
        onSubmit={handleCreateSubmit}
        submitting={isCreating}
      />

      {shiftToEdit ? (
        <EditShiftModal
          editingShift={shiftToEdit}
          setEditingShift={setShiftToEdit}
          onEditChange={handleEditFormChange}
          onUpdateHandler={handleEditSubmit}
          submitting={isEditing}
        />
      ) : null}

      <ShiftDetails
        shift={selectedShift}
        onClose={() => setSelectedShift(null)}
        onEdit={(shift) => {
          setSelectedShift(null)
          handleEditOpen(shift)
        }}
        onDelete={(shift) => {
          setSelectedShift(null)
          handleDeletePrompt(shift)
        }}
      />

      <ShiftDeleteConfirm
        shift={shiftToDelete}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShiftToDelete(null)}
      />
    </div>
  )
}

export default ShiftsPage
