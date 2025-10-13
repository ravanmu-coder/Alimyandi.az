import { useState } from 'react'
import { Button } from './common/Button'
import { Modal } from './common/Modal'
import { 
  AlertTriangle, 
  UserCheck, 
  UserX, 
  Shield, 
  Crown,
  X
} from 'lucide-react'

interface ConfirmActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  action: 'ban' | 'activate' | 'deactivate'
  userName: string
  isLoading?: boolean
}

export function ConfirmActionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  action, 
  userName,
  isLoading = false 
}: ConfirmActionModalProps) {
  const [reason, setReason] = useState('')

  const getActionDetails = () => {
    switch (action) {
      case 'ban':
        return {
          title: 'Ban User',
          description: `Are you sure you want to ban ${userName}?`,
          icon: <UserX className="w-8 h-8 text-red-500" />,
          color: 'red',
          placeholder: 'Enter reason for banning this user...'
        }
      case 'activate':
        return {
          title: 'Activate User',
          description: `Are you sure you want to activate ${userName}?`,
          icon: <UserCheck className="w-8 h-8 text-green-500" />,
          color: 'green',
          placeholder: 'Enter reason for activating this user...'
        }
      case 'deactivate':
        return {
          title: 'Deactivate User',
          description: `Are you sure you want to deactivate ${userName}?`,
          icon: <UserX className="w-8 h-8 text-yellow-500" />,
          color: 'yellow',
          placeholder: 'Enter reason for deactivating this user...'
        }
      default:
        return {
          title: 'Confirm Action',
          description: `Are you sure you want to perform this action on ${userName}?`,
          icon: <AlertTriangle className="w-8 h-8 text-blue-500" />,
          color: 'blue',
          placeholder: 'Enter reason...'
        }
    }
  }

  const actionDetails = getActionDetails()

  const handleConfirm = () => {
    onConfirm(reason)
    setReason('')
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {actionDetails.icon}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
              {actionDetails.title}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
            {actionDetails.description}
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={actionDetails.placeholder}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`${
              actionDetails.color === 'red' 
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : actionDetails.color === 'green'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : actionDetails.color === 'yellow'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

interface RoleManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onAssignRole: (role: string) => void
  onRemoveRole: (role: string) => void
  userName: string
  currentRoles: string[]
  availableRoles: string[]
  isLoading?: boolean
}

export function RoleManagementModal({
  isOpen,
  onClose,
  onAssignRole,
  onRemoveRole,
  userName,
  currentRoles,
  availableRoles,
  isLoading = false
}: RoleManagementModalProps) {
  const [selectedRole, setSelectedRole] = useState('')

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <Crown className="w-4 h-4 text-red-500" />
      case 'moderator':
        return <Shield className="w-4 h-4 text-yellow-500" />
      default:
        return <Shield className="w-4 h-4 text-blue-500" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'moderator':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    }
  }

  const handleAssignRole = () => {
    if (selectedRole && !currentRoles.includes(selectedRole)) {
      onAssignRole(selectedRole)
      setSelectedRole('')
    }
  }

  const handleRemoveRole = (role: string) => {
    onRemoveRole(role)
  }

  const availableRolesToAssign = availableRoles.filter(role => !currentRoles.includes(role))

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
              Manage Roles - {userName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Current Roles */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-3">
              Current Roles
            </h4>
            <div className="space-y-2">
              {currentRoles.length > 0 ? (
                currentRoles.map((role) => (
                  <div
                    key={role}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(role)}
                      <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                        {role}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRole(role)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-dark-text-muted">
                  No roles assigned
                </p>
              )}
            </div>
          </div>

          {/* Assign New Role */}
          {availableRolesToAssign.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-3">
                Assign New Role
              </h4>
              <div className="flex space-x-3">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                >
                  <option value="">Select a role...</option>
                  {availableRolesToAssign.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleAssignRole}
                  disabled={!selectedRole || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Assign
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

interface BulkActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  action: string
  selectedCount: number
  isLoading?: boolean
}

export function BulkActionModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  selectedCount,
  isLoading = false
}: BulkActionModalProps) {
  const [reason, setReason] = useState('')

  const getActionDetails = () => {
    switch (action) {
      case 'ban':
        return {
          title: 'Ban Selected Users',
          description: `Are you sure you want to ban ${selectedCount} user${selectedCount !== 1 ? 's' : ''}?`,
          icon: <UserX className="w-8 h-8 text-red-500" />,
          color: 'red',
          placeholder: 'Enter reason for banning these users...'
        }
      case 'activate':
        return {
          title: 'Activate Selected Users',
          description: `Are you sure you want to activate ${selectedCount} user${selectedCount !== 1 ? 's' : ''}?`,
          icon: <UserCheck className="w-8 h-8 text-green-500" />,
          color: 'green',
          placeholder: 'Enter reason for activating these users...'
        }
      case 'deactivate':
        return {
          title: 'Deactivate Selected Users',
          description: `Are you sure you want to deactivate ${selectedCount} user${selectedCount !== 1 ? 's' : ''}?`,
          icon: <UserX className="w-8 h-8 text-yellow-500" />,
          color: 'yellow',
          placeholder: 'Enter reason for deactivating these users...'
        }
      default:
        return {
          title: 'Confirm Bulk Action',
          description: `Are you sure you want to perform this action on ${selectedCount} user${selectedCount !== 1 ? 's' : ''}?`,
          icon: <AlertTriangle className="w-8 h-8 text-blue-500" />,
          color: 'blue',
          placeholder: 'Enter reason...'
        }
    }
  }

  const actionDetails = getActionDetails()

  const handleConfirm = () => {
    onConfirm(reason)
    setReason('')
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {actionDetails.icon}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
              {actionDetails.title}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
            {actionDetails.description}
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={actionDetails.placeholder}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`${
              actionDetails.color === 'red' 
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : actionDetails.color === 'green'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : actionDetails.color === 'yellow'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
