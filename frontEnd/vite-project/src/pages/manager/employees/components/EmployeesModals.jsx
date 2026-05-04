import AddEmployeeModal from '../AddEmployeeModal'
import EditEmployeeModal from '../EditEmployeeModal'
import DeleteEmployeeModal from '../DeleteEmployeeModal'
import InviteEmployeeModal from '../InviteEmployeeModal'
import ResetPasswordModal from '../ResetPasswordModal'

export default function EmployeesModals({
  showAddModal,
  onCloseAdd,
  onAddSuccess,
  showInviteModal,
  onCloseInvite,
  employeeToEdit,
  onCloseEdit,
  onEditSuccess,
  employeeToDelete,
  deleting,
  onConfirmDelete,
  onCancelDelete,
  employeeForReset,
  resetLink,
  resetData,
  isGeneratingReset,
  onCloseReset,
  onGenerateResetLink,
}) {
  return (
    <>
      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={onCloseAdd}
        onSuccess={onAddSuccess}
      />
      <InviteEmployeeModal
        isOpen={showInviteModal}
        onClose={onCloseInvite}
        onSuccess={() => {}}
      />
      <EditEmployeeModal
        isOpen={!!employeeToEdit}
        employee={employeeToEdit}
        onClose={onCloseEdit}
        onSuccess={onEditSuccess}
      />
      <DeleteEmployeeModal
        isOpen={!!employeeToDelete}
        employee={employeeToDelete}
        isRemoving={deleting}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
      <ResetPasswordModal
        isOpen={!!employeeForReset}
        employee={employeeForReset}
        onClose={onCloseReset}
        resetLink={resetLink}
        resetData={resetData}
        isGenerating={isGeneratingReset}
        onGenerate={onGenerateResetLink}
      />
    </>
  )
}
