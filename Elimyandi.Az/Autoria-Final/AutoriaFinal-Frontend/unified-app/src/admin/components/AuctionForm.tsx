import { useState, useEffect } from 'react'
import { 
  Save, 
  Trash2, 
  Car, 
  Loader2, 
  AlertCircle,
  Calendar,
  MapPin,
  Settings,
  Clock,
  DollarSign
} from 'lucide-react'
import { Button } from './common/Button'
import { apiClient } from '../services/apiClient'
import { useToast } from './common/Toast'
import { AddVehicleModal } from './AddVehicleModal'
import { DeleteAuctionModal } from './DeleteAuctionModal'

interface Auction {
  id: string
  name: string
  description: string
  startTimeUtc: string
  endTimeUtc: string
  status: string
  locationId: string
  locationName?: string
  vehicleCount: number
  totalRevenue?: number
}

interface Location {
  id: string
  name: string
  address: string
}

interface AuctionFormProps {
  selectedAuctionId: string | null
  onAuctionSaved: () => void
  onAuctionDeleted: () => void
}

export function AuctionForm({ selectedAuctionId, onAuctionSaved, onAuctionDeleted }: AuctionFormProps) {
  const [auction, setAuction] = useState<Auction | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { success, error: showError } = useToast()

  const [formData, setFormData] = useState({
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

  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditMode = selectedAuctionId && selectedAuctionId !== ''

  useEffect(() => {
    loadLocations()
  }, [])

  useEffect(() => {
    if (isEditMode) {
      loadAuction()
    } else {
      resetForm()
    }
  }, [selectedAuctionId])

  const loadLocations = async () => {
    try {
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
      showError('Failed to load locations')
      setLocations([])
    }
  }

  const loadAuction = async () => {
    if (!selectedAuctionId) return

    try {
      setLoading(true)
      setError(null)
      
      const auctionData = await apiClient.getAuction(selectedAuctionId)
      setAuction(auctionData)
      
      // Populate form with auction data
      setFormData({
        name: auctionData.name || '',
        description: auctionData.description || '',
        startTimeUtc: auctionData.startTimeUtc ? new Date(auctionData.startTimeUtc).toISOString().slice(0, 16) : '',
        endTimeUtc: auctionData.endTimeUtc ? new Date(auctionData.endTimeUtc).toISOString().slice(0, 16) : '',
        locationId: auctionData.locationId || '',
        timezone: auctionData.timezone || 'UTC',
        timerSeconds: auctionData.timerSeconds || 30,
        minBidIncrement: auctionData.minBidIncrement || 100,
        maxCarDuration: auctionData.maxCarDuration || 300,
        allowBidIncrement: auctionData.allowBidIncrement !== false,
        allowReservePrice: auctionData.allowReservePrice !== false,
        allowBuyNow: auctionData.allowBuyNow || false,
        allowProxyBidding: auctionData.allowProxyBidding !== false
      })
    } catch (err) {
      console.error('Failed to load auction:', err)
      setError('Failed to load auction details')
      showError('Failed to load auction details')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAuction(null)
    setError(null)
    setErrors({})
    setFormData({
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
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

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

  const handleSave = async () => {
    if (!validateForm()) {
      showError('Please fix the errors before saving')
      return
    }

    try {
      setSaving(true)

      const auctionData = {
        ...formData,
        startTimeUtc: new Date(formData.startTimeUtc).toISOString(),
        endTimeUtc: new Date(formData.endTimeUtc).toISOString()
      }

      if (isEditMode) {
        await apiClient.updateAuction(selectedAuctionId!, auctionData)
        success('Auction updated successfully')
      } else {
        await apiClient.createAuction(auctionData)
        success('Auction created successfully')
      }

      onAuctionSaved()
    } catch (err) {
      console.error('Failed to save auction:', err)
      // Show the actual API error message if available
      const errorMessage = err instanceof Error ? err.message : 'Failed to save auction'
      showError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false)
    onAuctionDeleted()
  }

  const handleAddVehicleSuccess = () => {
    setShowAddVehicleModal(false)
    onAuctionSaved()
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin mx-auto mb-4" />
          <p className="text-body-md text-dark-text-secondary">Loading auction details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-accent-error mx-auto mb-4" />
          <h3 className="text-h3 font-heading text-dark-text-primary mb-2">Error Loading Auction</h3>
          <p className="text-body-md text-dark-text-secondary mb-6">{error}</p>
          <Button onClick={loadAuction} icon={Loader2}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-dark-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-h2 font-heading text-dark-text-primary">
              {isEditMode ? 'Edit Auction' : 'Create New Auction'}
            </h2>
            {isEditMode && auction && (
              <p className="text-body-sm text-dark-text-secondary mt-1">{auction.name}</p>
            )}
          </div>
          
          {isEditMode && (
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                icon={Car}
                onClick={() => setShowAddVehicleModal(true)}
              >
                Manage Vehicles
              </Button>
              <Button
                variant="secondary"
                icon={Trash2}
                onClick={() => setShowDeleteModal(true)}
                className="text-accent-error hover:bg-accent-error/10"
              >
                Delete
              </Button>
            </div>
          )}
        </div>
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
        </div>

        {/* Location & Settings Row */}
        <div className="space-y-3">
          <h3 className="text-h3 font-heading text-dark-text-primary mb-2">Location & Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-body-sm font-medium text-dark-text-primary mb-1">
                Location *
              </label>
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
        <Button 
          icon={Save} 
          onClick={handleSave}
          loading={saving}
          className="w-full"
        >
          {isEditMode ? 'Save Changes' : 'Create Auction'}
        </Button>
      </div>

      {/* Modals */}
      {showAddVehicleModal && selectedAuctionId && (
        <AddVehicleModal
          auctionId={selectedAuctionId}
          onClose={() => setShowAddVehicleModal(false)}
          onSuccess={handleAddVehicleSuccess}
        />
      )}

      {showDeleteModal && selectedAuctionId && (
        <DeleteAuctionModal
          auctionId={selectedAuctionId}
          auctionName={auction?.name || ''}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  )
}
