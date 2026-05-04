import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/utils/apiError'
import { employeeService } from '@/api/services'

export function useEmployeeMutations(onSuccess) {
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const createEmployee = useCallback(
    async (data) => {
      setCreating(true)
      try {
        await employeeService.addEmployee(data)
        toast.success('Employee created successfully')
        onSuccess?.()
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to create employee'))
        throw error
      } finally {
        setCreating(false)
      }
    },
    [onSuccess],
  )

  const updateEmployee = useCallback(
    async (id, data) => {
      setUpdating(true)
      try {
        await employeeService.updateEmployee(id, data)
        toast.success('Employee updated successfully')
        onSuccess?.()
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to update employee'))
        throw error
      } finally {
        setUpdating(false)
      }
    },
    [onSuccess],
  )

  const deleteEmployee = useCallback(
    async (id) => {
      setDeleting(true)
      try {
        await employeeService.removeEmployee(id)
        toast.success('Employee deactivated successfully')
        onSuccess?.()
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to deactivate employee'))
        throw error
      } finally {
        setDeleting(false)
      }
    },
    [onSuccess],
  )

  return {
    createEmployee,
    updateEmployee,
    deleteEmployee,
    creating,
    updating,
    deleting,
  }
}
