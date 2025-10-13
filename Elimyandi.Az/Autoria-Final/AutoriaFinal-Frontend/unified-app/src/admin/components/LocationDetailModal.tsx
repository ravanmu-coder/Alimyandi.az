import { useState, useEffect } from 'react'
import { X, MapPin, Building, Globe, Loader, Calendar, Hash } from 'lucide-react'
import { Button } from './common/Button'
import { apiClient } from '../services/apiClient'
import { useToast } from './common/Toast'

interface LocationDetailModalProps {
  isOpen: boolean
  onClose: () => void
  locationId: string | null
}

interface LocationDetailData {
  id: string
  name: string
  addressLine1: string
  city: string
  region: string
  country: string
  postalCode: string
  createdAt?: string
  updatedAt?: string
}

export function LocationDetailModal({ isOpen, onClose, locationId }: LocationDetailModalProps) {
  const [locationData, setLocationData] = useState<LocationDetailData | null>(null)
  const [loading, setLoading] = useState(false)
  const { error: showError } = useToast()

  // Load location data when modal opens
  useEffect(() => {
    if (isOpen && locationId) {
      loadLocationData()
    }
  }, [isOpen, locationId])

  const loadLocationData = async () => {
    if (!locationId) return

    setLoading(true)
    try {
      const location = await apiClient.getLocationById(locationId)
      if (location) {
        setLocationData({
          id: location.id,
          name: location.name || '',
          addressLine1: location.addressLine1 || location.address || '',
          city: location.city || '',
          region: location.region || location.state || '',
          country: location.country || '',
          postalCode: location.postalCode || location.zipCode || '',
          createdAt: location.createdAt,
          updatedAt: location.updatedAt
        })
      }
    } catch (err: any) {
      console.error('Error loading location data:', err)
      showError(err.message || 'Failed to load location data')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      setLocationData(null)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">
                Location Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                View location information
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
        {loading ? (
          <div className="p-12 text-center">
            <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-dark-text-secondary">Loading location data...</p>
          </div>
        ) : locationData ? (
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                Basic Information
              </h3>
              
              <div className="space-y-4">
                {/* Location Name */}
                <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
                  <Building className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Location Name</p>
                    <p className="text-base text-gray-900 dark:text-dark-text-primary font-medium">
                      {locationData.name}
                    </p>
                  </div>
                </div>

                {/* Location ID */}
                <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
                  <Hash className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Location ID</p>
                    <p className="text-base text-gray-900 dark:text-dark-text-primary font-mono text-sm">
                      {locationData.id}
                    </p>
                  </div>
                </div>

                {/* Country */}
                <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
                  <Globe className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Country</p>
                    <p className="text-base text-gray-900 dark:text-dark-text-primary">
                      {locationData.country}
                    </p>
                  </div>
                </div>

                {/* Postal Code */}
                <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
                  <Hash className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Postal Code</p>
                    <p className="text-base text-gray-900 dark:text-dark-text-primary">
                      {locationData.postalCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                Location Details
              </h3>
              
              <div className="space-y-4">
                {/* City */}
                <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">City</p>
                    <p className="text-base text-gray-900 dark:text-dark-text-primary">
                      {locationData.city}
                    </p>
                  </div>
                </div>

                {/* Region */}
                <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Region</p>
                    <p className="text-base text-gray-900 dark:text-dark-text-primary">
                      {locationData.region}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
                  <MapPin className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Address</p>
                    <p className="text-base text-gray-900 dark:text-dark-text-primary">
                      {locationData.addressLine1}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                System Information
              </h3>
              
              <div className="space-y-4">
                {/* Created Date */}
                <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Created Date</p>
                    <p className="text-base text-gray-900 dark:text-dark-text-primary">
                      {formatDate(locationData.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Last Updated</p>
                    <p className="text-base text-gray-900 dark:text-dark-text-primary">
                      {formatDate(locationData.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-dark-border">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                className="text-gray-600 hover:text-gray-900 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary mb-2">No Data Available</h3>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
              Unable to load location information
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="text-gray-600 hover:text-gray-900 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
