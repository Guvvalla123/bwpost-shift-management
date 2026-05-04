import { Users } from 'lucide-react'
import {
  Pagination,
  SkeletonTable,
  SkeletonList,
  EmptyState,
  ErrorState,
} from '@/components/ui'
import EmployeeTable from './EmployeeTable'
import { PAGE_SIZE } from '../hooks/useEmployeeList'

/**
 * Employee list: loading skeletons, error + retry, empty state, table/cards, pagination.
 * @param {Object} props
 * @param {Array<object>} props.employees
 * @param {(emp: object) => void} props.onEdit
 * @param {(emp: object) => void} props.onDelete
 * @param {(emp: object) => void} props.onViewAttendance
 * @param {() => void} [props.onInvite]
 * @param {() => void} [props.onAddEmployee]
 * @param {boolean} props.loading
 * @param {boolean} props.fetchError
 * @param {() => void} props.onRetry
 * @param {string} props.search
 * @param {(emp: object) => void} props.onPasswordReset
 * @param {number} props.currentPage
 * @param {number} props.totalPages
 * @param {number} props.totalItems
 * @param {(page: number) => void} props.onPageChange
 */
export default function EmployeeList({
  employees,
  onEdit,
  onDelete,
  onViewAttendance,
  onInvite,
  onAddEmployee,
  loading,
  fetchError,
  onRetry,
  search,
  onPasswordReset,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}) {
  if (loading) {
    return (
      <div className="p-6">
        <div className="hidden md:block">
          <SkeletonTable rows={8} cols={5} />
        </div>
        <div className="md:hidden">
          <SkeletonList count={5} />
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load employees"
          description="Could not fetch employee list. Please try again."
          onRetry={onRetry}
        />
      </div>
    )
  }

  return (
    <>
      {employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search.trim() ? 'No employees found' : 'No employees yet'}
          description={
            search.trim()
              ? 'No employees match your search. Try a different term.'
              : 'Invite your first employee to get started.'
          }
          actionLabel={search.trim() ? 'Add Employee' : 'Invite Employee'}
          onAction={() => (search.trim() ? onAddEmployee?.() : onInvite?.())}
        />
      ) : (
        <EmployeeTable
          employees={employees}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onViewAttendance}
          onPasswordReset={onPasswordReset}
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onPageChange={onPageChange}
        isLoading={loading}
      />
    </>
  )
}
