import { useState } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from './common/Button'
import { apiClient } from '../services/apiClient'
import { useToast } from './common/Toast'

interface DeleteAuctionModalProps {
  auctionId: string
  auctionName: string
  onClose: () => void
  onSuccess: () => void
}

export function DeleteAuctionModal({ auctionId, auctionName, onClose, onSuccess }: DeleteAuctionModalProps) {
  const [deleting, setDeleting] = useState(false)
  const [reason, setReason] = useState('')
  const { success, error } = useToast()

  const handleDelete = async () => {
    if (!reason.trim()) {
      error('Please provide a reason for deletion')
      return
    }

    try {
      setDeleting(true)
      await apiClient.deleteAuction(auctionId)
      success('Auction deleted successfully')
      onSuccess()
      onClose() // Close the modal after successful deletion
    } catch (err) {
      console.error('Failed to delete auction:', err)
      error('Failed to delete auction')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-bg-tertiary rounded-lg border border-dark-border w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent-error/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-accent-error" />
            </div>
            <div>
              <h2 className="text-h2 font-heading text-dark-text-primary">Delete Auction</h2>
              <p className="text-body-sm text-dark-text-secondary">This action cannot be undone</p>
            </div>
          </div>
          <Button variant="ghost" icon={X} onClick={onClose} />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-accent-error/10 border border-accent-error/20 rounded-lg p-4">
            <p className="text-body-sm text-accent-error">
              Are you sure you want to delete the auction <strong>"{auctionName}"</strong>?
            </p>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-dark-text-primary mb-2">
              Reason for deletion *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-dark-bg-quaternary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary resize-none"
              placeholder="Please provide a reason for deleting this auction..."
            />
          </div>

          <div className="bg-dark-bg-quaternary rounded-lg p-4">
            <h4 className="text-body-sm font-medium text-dark-text-primary mb-2">What will be deleted:</h4>
            <ul className="text-body-sm text-dark-text-secondary space-y-1">
              <li>• Auction details and configuration</li>
              <li>• All associated vehicles and bids</li>
              <li>• Auction history and statistics</li>
              <li>• All related data and records</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-dark-border">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="secondary"
            onClick={handleDelete}
            loading={deleting}
            disabled={!reason.trim()}
            className="text-accent-error hover:bg-accent-error/10"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              'Delete Auction'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}