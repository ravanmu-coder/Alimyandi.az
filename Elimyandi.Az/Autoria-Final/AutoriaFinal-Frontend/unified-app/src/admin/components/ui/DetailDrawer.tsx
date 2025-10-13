import { X, Calendar, MapPin, Car } from 'lucide-react'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'

interface DetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function DetailDrawer({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  actions, 
  className = '' 
}: DetailDrawerProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            icon={X}
            onClick={onClose}
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        
        {/* Actions */}
        {actions && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {actions}
          </div>
        )}
      </div>
    </>
  )
}

// Pre-built drawer components for specific use cases
export function VehicleDetailDrawer({ 
  isOpen, 
  onClose, 
  vehicle 
}: { 
  isOpen: boolean
  onClose: () => void
  vehicle?: any 
}) {
  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Vehicle Details"
      actions={
        <div className="flex space-x-3">
          <Button variant="secondary" disabled>
            Edit Vehicle
          </Button>
          <Button variant="primary" disabled>
            View Auction
          </Button>
        </div>
      }
    >
      {vehicle ? (
        <div className="space-y-6">
          {/* Image */}
          <div className="w-full h-48 bg-gray-200 rounded-xl flex items-center justify-center">
            <div className="text-gray-400">Vehicle Image</div>
          </div>
          
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {vehicle.title}
              </h3>
              <div className="flex items-center space-x-2 mb-3">
                <Badge variant="success">{vehicle.status}</Badge>
                <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-mono">
                  {vehicle.vin}
                </span>
              </div>
            </div>
            
            {/* Price */}
            <div className="text-2xl font-bold text-blue-600">
              ${vehicle.price?.toLocaleString() || 'N/A'}
            </div>
          </div>
          
          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>{vehicle.location}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>{vehicle.date}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600">
              <Car className="w-5 h-5" />
              <span>{vehicle.make} {vehicle.model} ({vehicle.year})</span>
            </div>
          </div>
          
          {/* Description */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Description</h4>
            <p className="text-gray-600 text-sm">
              {vehicle.description || 'No description available.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">No vehicle selected</div>
          <p className="text-sm text-gray-500">
            Select a vehicle to view its details
          </p>
        </div>
      )}
    </DetailDrawer>
  )
}
