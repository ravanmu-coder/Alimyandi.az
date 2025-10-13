import { useState, useEffect } from 'react'
import { X, Calendar, MapPin, DollarSign, Clock, Settings, Save } from 'lucide-react'
import { apiClient } from '../services/apiClient'

interface EditAuctionModalProps {
  isOpen: boolean
  onClose: () => void
  auctionId: string | null
  onSuccess: (auction: any) => void
}

interface Location {
  id: string
  name: string
  city: string
  address: string
}

export function EditAuctionModal({ isOpen, onClose, auctionId, onSuccess }: EditAuctionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTimeUtc: '',
    endTimeUtc: '',
    locationId: '',
    startPrice: '',
    currency: 'USD',
    timezone: 'UTC',
    isPublic: true,
    isPrivate: false,
    allowPreBids: false,
    autoStart: false,
    reserveRequired: false
  })
  
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingAuction, setLoadingAuction] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && auctionId) {
      loadAuctionData()
      loadLocations()
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        name: '',
        description: '',
        startTimeUtc: '',
        endTimeUtc: '',
        locationId: '',
        startPrice: '',
        currency: 'USD',
        timezone: 'UTC',
        isPublic: true,
        isPrivate: false,
        allowPreBids: false,
        autoStart: false,
        reserveRequired: false
      })
      setError(null)
      setFieldErrors({})
    }
  }, [isOpen, auctionId])

  const loadAuctionData = async () => {
    if (!auctionId) return
    
    setLoadingAuction(true)
    setError(null)
    
    try {
      console.log('Loading auction data for ID:', auctionId)
      const auction = await apiClient.getAuctionById(auctionId)
      console.log('Loaded auction data:', auction)
      
      // Convert UTC timestamps to local datetime-local format
      const formatDateTime = (utcString: string) => {
        if (!utcString) return ''
        const date = new Date(utcString)
        // Convert to local timezone for datetime-local input
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
        return localDate.toISOString().slice(0, 16)
      }
      
      setFormData({
        name: auction.name || '',
        description: auction.description || '',
        startTimeUtc: formatDateTime(auction.startTimeUtc),
        endTimeUtc: formatDateTime(auction.endTimeUtc),
        locationId: auction.locationId || '',
        startPrice: auction.startPrice?.toString() || auction.startingPrice?.toString() || '',
        currency: auction.currency || 'USD',
        timezone: auction.timezone || 'UTC',
        isPublic: auction.isPublic !== false,
        isPrivate: auction.isPrivate === true,
        allowPreBids: auction.allowPreBids === true,
        autoStart: auction.autoStart === true,
        reserveRequired: auction.reserveRequired === true
      })
      
      console.log('Form data set:', {
        name: auction.name || '',
        description: auction.description || '',
        startTimeUtc: formatDateTime(auction.startTimeUtc),
        endTimeUtc: formatDateTime(auction.endTimeUtc),
        locationId: auction.locationId || '',
        startPrice: auction.startPrice?.toString() || auction.startingPrice?.toString() || '',
        currency: auction.currency || 'USD',
        timezone: auction.timezone || 'UTC',
        isPublic: auction.isPublic !== false,
        isPrivate: auction.isPrivate === true,
        allowPreBids: auction.allowPreBids === true,
        autoStart: auction.autoStart === true,
        reserveRequired: auction.reserveRequired === true
      })
    } catch (err: any) {
      console.error('Error loading auction:', err)
      setError(err.message || 'Failed to load auction data')
    } finally {
      setLoadingAuction(false)
    }
  }

  const loadLocations = async () => {
    try {
      const data = await apiClient.getLocations()
      // Handle both array and paged response formats
      if (Array.isArray(data)) {
        setLocations(data)
      } else if (data && data.items && Array.isArray(data.items)) {
        setLocations(data.items)
      } else {
        setLocations([])
      }
    } catch (err) {
      console.error('Error loading locations:', err)
      setLocations([])
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Auction adı mütləqdir'
    } else if (formData.name.length < 3) {
      errors.name = 'Auction adı ən azı 3 simvol olmalıdır'
    } else if (formData.name.length > 200) {
      errors.name = 'Auction adı 200 simvoldan çox ola bilməz'
    }
    
    // Location validation
    if (!formData.locationId) {
      errors.locationId = 'Location mütləqdir'
    }
    
    // Time validation
    if (!formData.startTimeUtc) {
      errors.startTimeUtc = 'Başlama vaxtı mütləqdir'
    }
    
    if (!formData.endTimeUtc) {
      errors.endTimeUtc = 'Bitmə vaxtı mütləqdir'
    }
    
    if (formData.startTimeUtc && formData.endTimeUtc) {
      const startTime = new Date(formData.startTimeUtc)
      const endTime = new Date(formData.endTimeUtc)
      
      if (startTime >= endTime) {
        errors.endTimeUtc = 'Bitmə vaxtı başlama vaxtından sonra olmalıdır'
      }
    }
    
    // Description validation
    if (formData.description && formData.description.length > 2000) {
      errors.description = 'Təsvir 2000 simvoldan çox ola bilməz'
    }
    
    // Start price validation
    if (formData.startPrice && (isNaN(Number(formData.startPrice)) || Number(formData.startPrice) < 0)) {
      errors.startPrice = 'Başlama qiyməti müsbət rəqəm olmalıdır'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!auctionId) return
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const auctionData = {
        ...formData,
        startTimeUtc: new Date(formData.startTimeUtc).toISOString(),
        endTimeUtc: new Date(formData.endTimeUtc).toISOString()
      }

      const updatedAuction = await apiClient.updateAuction(auctionId, auctionData)
      
      onSuccess(updatedAuction)
      onClose()
    } catch (err: any) {
      console.error('Error updating auction:', err)
      
      // Handle field-specific errors from backend
      if (err.errors && typeof err.errors === 'object') {
        setFieldErrors(err.errors)
      } else {
        setError(err.message || 'Failed to update auction')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Save className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Auction</h2>
              <p className="text-sm text-gray-600">Update auction details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Loading State */}
        {loadingAuction ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading auction data...</p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auction Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.name ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Enter auction name"
                    required
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="AZN">AZN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.description ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Enter auction description"
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
                )}
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTimeUtc}
                    onChange={(e) => handleInputChange('startTimeUtc', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.startTimeUtc ? 'border-red-300' : 'border-gray-200'
                    }`}
                    required
                  />
                  {fieldErrors.startTimeUtc && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.startTimeUtc}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTimeUtc}
                    onChange={(e) => handleInputChange('endTimeUtc', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.endTimeUtc ? 'border-red-300' : 'border-gray-200'
                    }`}
                    required
                  />
                  {fieldErrors.endTimeUtc && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.endTimeUtc}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="Asia/Baku">Asia/Baku</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starting Price
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.startPrice}
                      onChange={(e) => handleInputChange('startPrice', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        fieldErrors.startPrice ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {fieldErrors.startPrice && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.startPrice}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auction Location *
                </label>
                <select
                  value={formData.locationId}
                  onChange={(e) => handleInputChange('locationId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.locationId ? 'border-red-300' : 'border-gray-200'
                  }`}
                  required
                >
                  <option value="">Select a location</option>
                  {Array.isArray(locations) && locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} - {location.city}
                    </option>
                  ))}
                </select>
                {fieldErrors.locationId && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.locationId}</p>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Auction Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => {
                        handleInputChange('isPublic', e.target.checked)
                        handleInputChange('isPrivate', !e.target.checked)
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Public Auction</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isPrivate}
                      onChange={(e) => {
                        handleInputChange('isPrivate', e.target.checked)
                        handleInputChange('isPublic', !e.target.checked)
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Private Auction</span>
                  </label>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.allowPreBids}
                      onChange={(e) => handleInputChange('allowPreBids', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow Pre-bids</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.autoStart}
                      onChange={(e) => handleInputChange('autoStart', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Auto-start</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.reserveRequired}
                      onChange={(e) => handleInputChange('reserveRequired', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Reserve Required</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Auction
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}