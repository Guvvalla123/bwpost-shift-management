import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/utils/apiError'
import { shiftService } from '@/api/services'

export function useShiftMutations(
  loadStats,
  reloadListOnly,
  { closeCreateModal } = {},
) {
  const [shiftToDelete, setShiftToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [createFormData, setCreateFormData] = useState({
    shiftTitle: '',
    shiftStartTime: '',
    shiftEndTime: '',
    shiftNotes: '',
    slotsAvailable: '',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [shiftToEdit, setShiftToEdit] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  const refreshAfterMutation = useCallback(async () => {
    await reloadListOnly()
    await loadStats()
  }, [reloadListOnly, loadStats])

  const handleCreateFormChange = useCallback((e) => {
    const { name, value } = e.target
    if (name === 'shiftStartTime') {
      setCreateFormData((prev) => {
        const updated = { ...prev, shiftStartTime: value }
        if (
          prev.shiftEndTime &&
          new Date(prev.shiftEndTime) <= new Date(value)
        ) {
          updated.shiftEndTime = ''
          toast.info('Please select a new end time')
        }
        return updated
      })
      return
    }
    setCreateFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleEditFormChange = useCallback((e) => {
    const { name, value } = e.target
    setShiftToEdit((prev) => {
      if (!prev) return prev
      if (name === 'shiftStartTime') {
        const updated = { ...prev, shiftStartTime: value }
        if (
          prev.shiftEndTime &&
          new Date(prev.shiftEndTime) <= new Date(value)
        ) {
          updated.shiftEndTime = ''
          toast.info('Please select a new end time')
        }
        return updated
      }
      return { ...prev, [name]: value }
    })
  }, [])

  const handleCreateSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      const d = createFormData
      if (
        !d.shiftTitle ||
        !d.shiftStartTime ||
        !d.shiftEndTime ||
        !d.slotsAvailable
      ) {
        return toast.error('Please fill all required fields')
      }
      const startTime = new Date(d.shiftStartTime)
      const endTime = new Date(d.shiftEndTime)
      if (
        Number.isNaN(startTime.getTime()) ||
        Number.isNaN(endTime.getTime())
      ) {
        return toast.error('Please select a valid start and end date and time')
      }
      if (endTime <= startTime)
        return toast.error('End time must be after start time')
      const durationHours = (endTime - startTime) / (1000 * 60 * 60)
      if (durationHours > 24)
        return toast.error('Shift cannot be longer than 24 hours')

      setIsCreating(true)
      try {
        await shiftService.createShift(d)
        toast.success('Shift created successfully')
        setCreateFormData({
          shiftTitle: '',
          shiftStartTime: '',
          shiftEndTime: '',
          shiftNotes: '',
          slotsAvailable: '',
        })
        closeCreateModal?.()
        await refreshAfterMutation()
      } catch (err) {
        toast.error(
          getApiErrorMessage(err, 'Failed to create shift. Please try again.'),
        )
      } finally {
        setIsCreating(false)
      }
    },
    [createFormData, refreshAfterMutation, closeCreateModal],
  )

  const handleEditSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      if (!shiftToEdit) return
      const startTime = new Date(shiftToEdit.shiftStartTime)
      const endTime = new Date(shiftToEdit.shiftEndTime)
      if (
        Number.isNaN(startTime.getTime()) ||
        Number.isNaN(endTime.getTime())
      ) {
        return toast.error('Please select a valid start and end date and time')
      }
      if (endTime <= startTime)
        return toast.error('End time must be after start time')
      const durationHours = (endTime - startTime) / (1000 * 60 * 60)
      if (durationHours > 24)
        return toast.error('Shift cannot be longer than 24 hours')

      setIsEditing(true)
      try {
        await shiftService.updateShift(shiftToEdit._id, shiftToEdit)
        toast.success('Shift updated successfully')
        setShiftToEdit(null)
        await refreshAfterMutation()
      } catch {
        toast.error('Failed to update shift. Please try again.')
      } finally {
        setIsEditing(false)
      }
    },
    [shiftToEdit, refreshAfterMutation],
  )

  const handleConfirmDelete = useCallback(async () => {
    if (!shiftToDelete) return
    setIsDeleting(true)
    try {
      await shiftService.deleteShift(shiftToDelete._id)
      toast.success('Shift deleted')
      setShiftToDelete(null)
      await refreshAfterMutation()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed. Please try again.'))
    } finally {
      setIsDeleting(false)
    }
  }, [shiftToDelete, refreshAfterMutation])

  return {
    shiftToDelete,
    setShiftToDelete,
    isDeleting,
    createFormData,
    setCreateFormData,
    isCreating,
    shiftToEdit,
    setShiftToEdit,
    isEditing,
    handleCreateFormChange,
    handleEditFormChange,
    handleCreateSubmit,
    handleEditSubmit,
    handleConfirmDelete,
  }
}
