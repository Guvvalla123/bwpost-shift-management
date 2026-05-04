import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { employeeService } from '@/api/services'
import EmployeeAttendanceDrawer from './components/EmployeeAttendanceDrawer'
import EmployeeFilters from './components/EmployeeFilters'
import EmployeeList from './components/EmployeeList'
import EmployeePageHeader from './components/EmployeePageHeader'
import EmployeeStats from './components/EmployeeStats'
import EmployeesModals from './components/EmployeesModals'
import { useEmployeeList } from './hooks/useEmployeeList'
import { useEmployeeMutations } from './hooks/useEmployeeMutations'
import { getApiErrorMessage } from '@/utils/apiError'
import { toast } from 'sonner'

const EmployeesPage = () => {
  const location = useLocation()
  const {
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
    stats: { activeEmployees, newThisMonth },
  } = useEmployeeList()

  const [roleFilter, setRoleFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [employeeToEdit, setEmployeeToEdit] = useState(null)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)

  const [employeeForReset, setEmployeeForReset] = useState(null)
  const [resetLink, setResetLink] = useState('')
  const [resetData, setResetData] = useState(null)
  const [isGeneratingReset, setIsGeneratingReset] = useState(false)

  const [viewTarget, setViewTarget] = useState(null)
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [attendanceLoading, setAttendanceLoading] = useState(false)

  const { deleteEmployee, deleting } = useEmployeeMutations(refetchAll)

  const pillCounts = useMemo(
    () => ({
      all: totalItems,
      manager: employees.filter((e) => e.role === 'manager').length,
      employee: totalItems,
    }),
    [employees, totalItems],
  )

  const filteredEmployees = useMemo(() => {
    if (roleFilter === 'manager')
      return employees.filter((e) => e.role === 'manager')
    if (roleFilter === 'employee')
      return employees.filter((e) => (e.role || 'employee') === 'employee')
    return employees
  }, [employees, roleFilter])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return
      setEmployeeToEdit(null)
      setEmployeeToDelete(null)
      setViewTarget(null)
      setEmployeeForReset(null)
      setResetLink('')
      setResetData(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleOpenDrawer = async (employee) => {
    setViewTarget(employee)
    setAttendanceHistory([])
    setAttendanceLoading(true)
    try {
      setAttendanceHistory(await employeeService.getEmployeeAttendance(employee._id))
    } catch {
      setAttendanceHistory([])
    } finally {
      setAttendanceLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return
    try {
      await deleteEmployee(employeeToDelete._id)
      setEmployeeToDelete(null)
    } catch {
      /* toast in hook */
    }
  }

  const handleGenerateResetLink = async () => {
    if (!employeeForReset) return
    setIsGeneratingReset(true)
    try {
      const isAdmin = location.pathname.startsWith('/admin')
      const data = await employeeService.generateResetLink(
        employeeForReset._id,
        isAdmin,
      )
      setResetLink(data?.resetLink || '')
      setResetData(data)
      toast.success('Password reset link generated')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to generate link'))
    } finally {
      setIsGeneratingReset(false)
    }
  }

  const statsLoading = loading || dashLoading

  return (
    <div className="min-h-screen bg-[#F8F9FC] px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <EmployeePageHeader
          onInvite={() => setShowInviteModal(true)}
          onAdd={() => setShowAddModal(true)}
        />
        <EmployeeStats
          totalEmployees={totalItems}
          activeEmployees={activeEmployees}
          newThisMonth={newThisMonth}
          loading={statsLoading}
        />
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <EmployeeFilters
            search={search}
            onSearchChange={setSearch}
            onReset={() => {
              setSearch('')
              setRoleFilter('all')
            }}
            roleFilter={roleFilter}
            onRoleFilterChange={(key) => {
              setRoleFilter(key)
              setPage(1)
            }}
            pillCounts={pillCounts}
          />
          <EmployeeList
            employees={filteredEmployees}
            onEdit={setEmployeeToEdit}
            onDelete={setEmployeeToDelete}
            onViewAttendance={handleOpenDrawer}
            onInvite={() => setShowInviteModal(true)}
            onAddEmployee={() => setShowAddModal(true)}
            loading={loading}
            fetchError={fetchError}
            onRetry={refetchAll}
            search={search}
            onPasswordReset={(emp) => {
              setEmployeeForReset(emp)
              setResetLink('')
              setResetData(null)
            }}
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
          />
        </div>
      </div>
      <EmployeesModals
        showAddModal={showAddModal}
        onCloseAdd={() => setShowAddModal(false)}
        onAddSuccess={() => {
          setShowAddModal(false)
          refetchAll()
        }}
        showInviteModal={showInviteModal}
        onCloseInvite={() => setShowInviteModal(false)}
        employeeToEdit={employeeToEdit}
        onCloseEdit={() => setEmployeeToEdit(null)}
        onEditSuccess={() => {
          setEmployeeToEdit(null)
          refetchAll()
        }}
        employeeToDelete={employeeToDelete}
        deleting={deleting}
        onConfirmDelete={handleConfirmDelete}
        onCancelDelete={() => setEmployeeToDelete(null)}
        employeeForReset={employeeForReset}
        resetLink={resetLink}
        resetData={resetData}
        isGeneratingReset={isGeneratingReset}
        onCloseReset={() => {
          setEmployeeForReset(null)
          setResetLink('')
          setResetData(null)
        }}
        onGenerateResetLink={handleGenerateResetLink}
      />
      {viewTarget ? (
        <EmployeeAttendanceDrawer
          employee={viewTarget}
          attendanceHistory={attendanceHistory}
          attendanceLoading={attendanceLoading}
          onClose={() => setViewTarget(null)}
          onEdit={setEmployeeToEdit}
          onDelete={setEmployeeToDelete}
        />
      ) : null}
    </div>
  )
}

export default EmployeesPage
