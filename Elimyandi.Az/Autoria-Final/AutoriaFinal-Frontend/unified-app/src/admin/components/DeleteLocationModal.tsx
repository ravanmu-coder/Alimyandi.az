import { useState } from 'react'
import { X, AlertTriangle, Trash2, Building } from 'lucide-react'
import { Button } from './common/Button'
import { apiClient } from '../services/apiClient'
import { useToast } from './common/Toast'

interface DeleteLocationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  locationId: string | null
  locationName: string
}

export function DeleteLocationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  locationId, 
  locationName 
}: DeleteLocationModalProps) {
  const [loading, setLoading] = useState(false)
  const { success, error: showError } = useToast()

  const handleDelete = async () => {
    if (!locationId) return

    setLoading(true)
    try {
      await apiClient.deleteLocation(locationId)
      success(`Location "${locationName}" has been deleted successfully!`)
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error deleting location:', err)
      showError(err.message || 'Failed to delete location')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">
                Delete Location
              </h2>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                This action cannot be undone
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={X}
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Icon and Message */}
          <div className="flex items-start space-x-4 mb-6">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary mb-2">
                Are you sure you want to delete this location?
              </h3>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                This will permanently delete the location <strong>"{locationName}"</strong> and all associated data. 
                This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Location Info */}
          <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                  {locationName}
                </p>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                  Location ID: {locationId}
                </p>
              </div>
            </div>
          </div>

          {/* Warning about consequences */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Important Considerations
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• Any active auctions at this location may be affected</li>
                  <li>• Historical auction data will be preserved</li>
                  <li>• Users with vehicles at this location will need to be notified</li>
                  <li>• This action cannot be reversed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
              className="text-gray-600 hover:text-gray-900 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Deleting...' : 'Yes, Delete Location'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
