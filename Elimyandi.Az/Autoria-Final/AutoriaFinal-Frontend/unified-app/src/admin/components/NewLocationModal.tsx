import { useState } from 'react'
import { X, MapPin, Building, Globe } from 'lucide-react'
import { Button } from './common/Button'
import { apiClient } from '../services/apiClient'
import { useToast } from './common/Toast'

interface NewLocationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface LocationFormData {
  name: string
  addressLine1?: string
  city?: string
  region?: string
  country?: string
  postalCode?: string
}

export function NewLocationModal({ isOpen, onClose, onSuccess }: NewLocationModalProps) {
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    addressLine1: '',
    city: '',
    region: '',
    country: 'Azerbaijan',
    postalCode: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<LocationFormData>>({})
  const { success, error: showError } = useToast()

  const handleInputChange = (field: keyof LocationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<LocationFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Location name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await apiClient.createLocation(formData)
      success('Location created successfully!')
      onSuccess()
      onClose()
      // Reset form
      setFormData({
        name: '',
        addressLine1: '',
        city: '',
        region: '',
        country: 'Azerbaijan',
        postalCode: ''
      })
      setErrors({})
    } catch (err: any) {
      console.error('Error creating location:', err)
      showError(err.message || 'Failed to create location')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      setErrors({})
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">
                Add New Location
              </h2>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                Create a new auction location
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary flex items-center">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              Basic Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Location Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'
                }`}
                placeholder="e.g., Downtown Auction Center"
                disabled={loading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  Country
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="Azerbaijan">Azerbaijan</option>
                  <option value="Turkey">Turkey</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Russia">Russia</option>
                  <option value="Iran">Iran</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  placeholder="e.g., AZ1000"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  placeholder="e.g., Baku"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  Region
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  placeholder="e.g., Baku"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-green-600" />
              Address Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Address Line 1
              </label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                placeholder="e.g., 123 Main Street"
                disabled={loading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-dark-border">
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
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Creating...' : 'Create Location'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
