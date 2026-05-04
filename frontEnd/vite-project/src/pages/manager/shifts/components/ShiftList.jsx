import { CalendarDays } from 'lucide-react'
import {
  SkeletonTable,
  SkeletonList,
  ErrorState,
  EmptyState,
} from '@/components/ui'
import ShiftCard from '../ShiftCard'
import ShiftTableRow from '../ShiftTableRow'

/**
 * Shift list: skeletons while loading, error + retry, empty state, desktop table + mobile cards, pagination.
 * @param {Object} props
 * @param {Array<object>} props.shifts
 * @param {(shift: object) => void} props.onEdit
 * @param {(shift: object) => void} props.onDelete
 * @param {(shift: object) => void} props.onViewDetails
 * @param {boolean} props.loading
 * @param {boolean} props.fetchError
 * @param {() => void} props.onRetry
 * @param {number} props.totalShifts
 * @param {number} props.totalPages
 * @param {number} props.currentPage
 * @param {(page: number) => void} props.onPageChange
 * @param {Date} props.lastUpdated
 * @param {() => void} props.emptyOnCreate
 */
export default function ShiftList({
  shifts,
  onEdit,
  onDelete,
  onViewDetails,
  loading,
  fetchError,
  onRetry,
  totalShifts,
  totalPages,
  currentPage,
  onPageChange,
  lastUpdated,
  emptyOnCreate,
}) {
  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <div className="hidden md:block">
          <SkeletonTable rows={5} cols={5} />
        </div>
        <div className="md:hidden">
          <SkeletonList count={4} />
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <ErrorState
          title="Failed to load shifts"
          description="Could not load shifts. Please try again."
          onRetry={onRetry}
        />
      </div>
    )
  }

  if (shifts.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No shifts found"
        description="Create your first shift to get started."
        actionLabel="Create Shift"
        onAction={emptyOnCreate}
      />
    )
  }

  return (
    <>
      <div className="space-y-3 px-4 pb-4 md:hidden">
        {shifts.map((shift) => (
          <ShiftCard
            key={shift._id}
            shift={shift}
            onView={onViewDetails}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-slate-50/50">
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Shift
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Fill Rate
              </th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <ShiftTableRow
                key={shift._id}
                shift={shift}
                onView={onViewDetails}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {!loading && !fetchError && shifts.length > 0 ? (
        <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/50 space-y-3">
          <p className="text-xs text-gray-400">
            Showing{' '}
            <span className="font-semibold text-gray-600">{shifts.length}</span>{' '}
            of{' '}
            <span className="font-semibold text-gray-600">{totalShifts}</span>{' '}
            shifts · Page{' '}
            <span className="font-semibold text-gray-600">{currentPage}</span>{' '}
            of <span className="font-semibold text-gray-600">{totalPages}</span>
          </p>

          <div className="flex items-center justify-between mt-4 px-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm bg-gray-100 rounded-lg disabled:opacity-40 hover:bg-gray-200 transition"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm bg-gray-100 rounded-lg disabled:opacity-40 hover:bg-gray-200 transition"
            >
              Next →
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center pt-2 md:hidden">
            Updated{' '}
            {lastUpdated.toLocaleTimeString('en-DE', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      ) : null}
    </>
  )
}
