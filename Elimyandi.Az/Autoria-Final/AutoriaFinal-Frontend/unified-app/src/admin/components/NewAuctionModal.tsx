import { useState, useEffect } from 'react'
import { X, MapPin, Clock, Settings, Save, Plus } from 'lucide-react'
import { Button } from './common/Button'
import { apiClient } from '../services/apiClient'
import { useToast } from './common/Toast'

interface Location {
  id: string
  name: string
  address: string
}

interface AuctionCreateDto {
  name: string
  description: string
  startTimeUtc: string
  endTimeUtc: string
  locationId: string
  timezone: string
  timerSeconds: number
  minBidIncrement: number
  maxCarDuration: number
  allowBidIncrement: boolean
  allowReservePrice: boolean
  allowBuyNow: boolean
  allowProxyBidding: boolean
}

interface NewAuctionModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function NewAuctionModal({ onClose, onSuccess }: NewAuctionModalProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [formData, setFormData] = useState<AuctionCreateDto>({
    name: '',
    description: '',
    startTimeUtc: '',
    endTimeUtc: '',
    locationId: '',
    timezone: 'UTC',
    timerSeconds: 30,
    minBidIncrement: 100,
    maxCarDuration: 300,
    allowBidIncrement: true,
    allowReservePrice: true,
    allowBuyNow: false,
    allowProxyBidding: true
  })
  const [errors, setErrors] = useState<Partial<AuctionCreateDto>>({})
  const { success, error } = useToast()

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      setLocationsLoading(true)
      const locationsData = await apiClient.getLocations()
      // Handle both array and paged response formats
      if (Array.isArray(locationsData)) {
        setLocations(locationsData)
      } else if (locationsData && locationsData.items && Array.isArray(locationsData.items)) {
        setLocations(locationsData.items)
      } else {
        setLocations([])
      }
    } catch (err) {
      console.error('Failed to load locations:', err)
      error('Failed to load locations')
      setLocations([])
    } finally {
      setLocationsLoading(false)
    }
  }

  const handleInputChange = (field: keyof AuctionCreateDto, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<AuctionCreateDto> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Auction name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.startTimeUtc) {
      newErrors.startTimeUtc = 'Start time is required'
    }

    if (!formData.endTimeUtc) {
      newErrors.endTimeUtc = 'End time is required'
    }

    if (!formData.locationId) {
      newErrors.locationId = 'Location is required'
    }

    if (formData.startTimeUtc && formData.endTimeUtc) {
      const startTime = new Date(formData.startTimeUtc)
      const endTime = new Date(formData.endTimeUtc)
      const now = new Date()
      const minStartTime = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes from now
      
      if (startTime < minStartTime) {
        newErrors.startTimeUtc = 'Start time must be at least 30 minutes from now'
      }
      
      if (endTime <= startTime) {
        newErrors.endTimeUtc = 'End time must be after start time'
      }
    }

    if (formData.timerSeconds < 10 || formData.timerSeconds > 300) {
      newErrors.timerSeconds = 'Timer must be between 10 and 300 seconds'
    }

    if (formData.minBidIncrement < 1) {
      newErrors.minBidIncrement = 'Minimum bid increment must be at least 1'
    }

    if (formData.maxCarDuration < 60 || formData.maxCarDuration > 1800) {
      newErrors.maxCarDuration = 'Max car duration must be between 60 and 1800 seconds'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveAsDraft = async () => {
    if (!validateForm()) {
      error('Please fix the errors before saving')
      return
    }

    try {
      setLoading(true)
      await apiClient.createAuction({
        ...formData,
        status: 'Draft'
      })
      success('Auction saved as draft successfully')
      onSuccess()
      onClose() // Close the modal after successful creation
    } catch (err) {
      console.error('Failed to create auction:', err)
      // Show the actual API error message if available
      const errorMessage = err instanceof Error ? err.message : 'Failed to create auction'
      error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAndAddVehicles = async () => {
    if (!validateForm()) {
      error('Please fix the errors before creating')
      return
    }

    try {
      setLoading(true)
      const auction = await apiClient.createAuction({
        ...formData,
        status: 'Draft'
      })
      success('Auction created successfully')
      onSuccess()
      onClose() // Close the modal after successful creation
      // TODO: Open AddVehicleModal with the new auction ID
    } catch (err) {
      console.error('Failed to create auction:', err)
      // Show the actual API error message if available
      const errorMessage = err instanceof Error ? err.message : 'Failed to create auction'
      error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-bg-tertiary rounded-lg border border-dark-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div>
            <h2 className="text-h2 font-heading text-dark-text-primary">New Auction</h2>
            <p className="text-body-sm text-dark-text-secondary mt-1">Create a new auction</p>
          </div>
          <Button variant="ghost" icon={X} onClick={onClose} />
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-h3 font-heading text-dark-text-primary mb-2">Basic Information</h3>
            
            <div>
              <label className="block text-body-sm font-medium text-dark-text-primary mb-1">
                Auction Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 bg-dark-bg-quaternary border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary ${
                  errors.name ? 'border-accent-error' : 'border-dark-border'
                }`}
                placeholder="Enter auction name"
              />
              {errors.name && (
                <p className="text-body-xs text-accent-error mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-body-sm font-medium text-dark-text-primary mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
                className={`w-full px-3 py-2 bg-dark-bg-quaternary border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary resize-none ${
                  errors.description ? 'border-accent-error' : 'border-dark-border'
                }`}
                placeholder="Enter auction description"
              />
              {errors.description && (
                <p className="text-body-xs text-accent-error mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <h3 className="text-h3 font-heading text-dark-text-primary mb-2">Schedule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-body-sm font-medium text-dark-text-primary mb-1">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTimeUtc}
                  onChange={(e) => handleInputChange('startTimeUtc', e.target.value)}
                  className={`w-full px-3 py-2 bg-dark-bg-quaternary border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary ${
                    errors.startTimeUtc ? 'border-accent-error' : 'border-dark-border'
                  }`}
                />
                {errors.startTimeUtc && (
                  <p className="text-body-xs text-accent-error mt-1">{errors.startTimeUtc}</p>
                )}
              </div>

              <div>
                <label className="block text-body-sm font-medium text-dark-text-primary mb-1">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTimeUtc}
                  onChange={(e) => handleInputChange('endTimeUtc', e.target.value)}
                  className={`w-full px-3 py-2 bg-dark-bg-quaternary border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary ${
                    errors.endTimeUtc ? 'border-accent-error' : 'border-dark-border'
                  }`}
                />
                {errors.endTimeUtc && (
                  <p className="text-body-xs text-accent-error mt-1">{errors.endTimeUtc}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-dark-text-primary mb-2">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-3 py-2 bg-dark-bg-quaternary border border-dark-border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>

          {/* Location & Settings */}
          <div className="space-y-3">
            <h3 className="text-h3 font-heading text-dark-text-primary mb-2">Location & Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-body-sm font-medium text-dark-text-primary mb-1">
                  Location *
                </label>
                {locationsLoading ? (
                  <div className="w-full px-3 py-2 bg-dark-bg-quaternary border border-dark-border rounded-lg text-dark-text-muted">
                    Loading locations...
                  </div>
                ) : (
                  <select
                    value={formData.locationId}
                    onChange={(e) => handleInputChange('locationId', e.target.value)}
                    className={`w-full px-3 py-2 bg-dark-bg-quaternary border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary ${
                      errors.locationId ? 'border-accent-error' : 'border-dark-border'
                    }`}
                  >
                    <option value="">Select location</option>
                    {Array.isArray(locations) && locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.locationId && (
                  <p className="text-body-xs text-accent-error mt-1">{errors.locationId}</p>
                )}
              </div>

              <div>
                <label className="block text-body-sm font-medium text-dark-text-primary mb-1">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-bg-quaternary border border-dark-border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern</option>
                  <option value="America/Chicago">Central</option>
                  <option value="America/Denver">Mountain</option>
                  <option value="America/Los_Angeles">Pacific</option>
                </select>
              </div>

              <div>
                <label className="block text-body-sm font-medium text-dark-text-primary mb-1">
                  Timer (sec)
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={formData.timerSeconds}
                  onChange={(e) => handleInputChange('timerSeconds', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 bg-dark-bg-quaternary border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary ${
                    errors.timerSeconds ? 'border-accent-error' : 'border-dark-border'
                  }`}
                />
                {errors.timerSeconds && (
                  <p className="text-body-xs text-accent-error mt-1">{errors.timerSeconds}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-body-sm font-medium text-dark-text-primary mb-1">
                  Min Bid Increment
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.minBidIncrement}
                  onChange={(e) => handleInputChange('minBidIncrement', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 bg-dark-bg-quaternary border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary ${
                    errors.minBidIncrement ? 'border-accent-error' : 'border-dark-border'
                  }`}
                />
                {errors.minBidIncrement && (
                  <p className="text-body-xs text-accent-error mt-1">{errors.minBidIncrement}</p>
                )}
              </div>

              <div>
                <label className="block text-body-sm font-medium text-dark-text-primary mb-1">
                  Max Car Duration (sec)
                </label>
                <input
                  type="number"
                  min="60"
                  max="1800"
                  value={formData.maxCarDuration}
                  onChange={(e) => handleInputChange('maxCarDuration', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 bg-dark-bg-quaternary border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary ${
                    errors.maxCarDuration ? 'border-accent-error' : 'border-dark-border'
                  }`}
                />
                {errors.maxCarDuration && (
                  <p className="text-body-xs text-accent-error mt-1">{errors.maxCarDuration}</p>
                )}
              </div>
            </div>
          </div>

          {/* Auction Features */}
          <div className="space-y-3">
            <h3 className="text-h3 font-heading text-dark-text-primary mb-2">Auction Features</h3>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.allowBidIncrement}
                  onChange={(e) => handleInputChange('allowBidIncrement', e.target.checked)}
                  className="w-4 h-4 text-accent-primary bg-dark-bg-quaternary border-dark-border rounded focus:ring-accent-primary/50"
                />
                <span className="text-body-sm text-dark-text-primary">Bid Increment</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.allowReservePrice}
                  onChange={(e) => handleInputChange('allowReservePrice', e.target.checked)}
                  className="w-4 h-4 text-accent-primary bg-dark-bg-quaternary border-dark-border rounded focus:ring-accent-primary/50"
                />
                <span className="text-body-sm text-dark-text-primary">Reserve Price</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.allowBuyNow}
                  onChange={(e) => handleInputChange('allowBuyNow', e.target.checked)}
                  className="w-4 h-4 text-accent-primary bg-dark-bg-quaternary border-dark-border rounded focus:ring-accent-primary/50"
                />
                <span className="text-body-sm text-dark-text-primary">Buy Now</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.allowProxyBidding}
                  onChange={(e) => handleInputChange('allowProxyBidding', e.target.checked)}
                  className="w-4 h-4 text-accent-primary bg-dark-bg-quaternary border-dark-border rounded focus:ring-accent-primary/50"
                />
                <span className="text-body-sm text-dark-text-primary">Proxy Bidding</span>
              </label>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-dark-bg-secondary border-t border-dark-border p-4">
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              variant="secondary" 
              icon={Save} 
              onClick={handleSaveAsDraft}
              loading={loading}
              className="flex-1"
            >
              Save as Draft
            </Button>
            <Button 
              icon={Plus} 
              onClick={handleCreateAndAddVehicles}
              loading={loading}
              className="flex-1"
            >
              Create & Add Vehicles
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}