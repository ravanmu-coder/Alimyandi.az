import { useState, useEffect } from 'react'
import { X, Settings, Save, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { configManager } from '../config/apiConfig'

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onConfigUpdated: () => void
}

export function ConfigModal({ isOpen, onClose, onConfigUpdated }: ConfigModalProps) {
  const [config, setConfig] = useState({
    baseApiUrl: '',
    authToken: '',
    imageBaseUrl: ''
  })
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      const currentConfig = configManager.getConfig()
      setConfig({
        baseApiUrl: currentConfig.baseApiUrl,
        authToken: currentConfig.authToken,
        imageBaseUrl: currentConfig.imageBaseUrl || ''
      })
    }
  }, [isOpen])

  const handleInputChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(null)
  }

  const handleSave = async () => {
    if (!config.baseApiUrl.trim()) {
      setError('Base API URL is required')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Update configuration
      configManager.updateConfig({
        baseApiUrl: config.baseApiUrl.trim(),
        authToken: config.authToken.trim(),
        imageBaseUrl: config.imageBaseUrl.trim() || config.baseApiUrl.trim()
      })

      setSuccess('Configuration saved successfully!')
      
      // Test the connection
      await testConnection()
      
      onConfigUpdated()
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    try {
      const response = await fetch(`${config.baseApiUrl}/api/auction`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(config.authToken ? { 'Authorization': `Bearer ${config.authToken}` } : {})
        },
        mode: 'cors'
      })
      
      if (response.ok) {
        setSuccess('Configuration saved and connection test successful!')
      } else {
        setError(`Connection test failed: ${response.status} ${response.statusText}`)
      }
    } catch (err: any) {
      setError(`Connection test failed: ${err.message}`)
    }
  }

  const handleReset = () => {
    const defaultConfig = {
      baseApiUrl: 'https://localhost:7249',
      authToken: '',
      imageBaseUrl: 'https://localhost:7249'
    }
    setConfig(defaultConfig)
    setError(null)
    setSuccess(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">API Configuration</h2>
              <p className="text-sm text-gray-600">Configure backend API settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Base API URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base API URL *
            </label>
            <input
              type="url"
              value={config.baseApiUrl}
              onChange={(e) => handleInputChange('baseApiUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://api.example.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The base URL for all API endpoints (e.g., https://localhost:7249)
            </p>
          </div>

          {/* Auth Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Authorization Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={config.authToken}
                onChange={(e) => handleInputChange('authToken', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Bearer token for authentication"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              JWT token for API authentication (optional, can be set via login)
            </p>
          </div>

          {/* Image Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image Base URL
            </label>
            <input
              type="url"
              value={config.imageBaseUrl}
              onChange={(e) => handleInputChange('imageBaseUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://api.example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Base URL for serving images (defaults to API URL if empty)
            </p>
          </div>

          {/* Current Configuration Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Current Configuration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">API URL:</span>
                <span className="font-mono text-gray-900">{config.baseApiUrl || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Auth Token:</span>
                <span className="font-mono text-gray-900">
                  {config.authToken ? `${config.authToken.substring(0, 20)}...` : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Image URL:</span>
                <span className="font-mono text-gray-900">{config.imageBaseUrl || 'Not set'}</span>
              </div>
            </div>
          </div>

          {/* Endpoint Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Required Endpoints</h3>
            <div className="text-xs text-blue-800 space-y-1">
              <p>• GET /api/auction - List auctions</p>
              <p>• POST /api/auction - Create auction</p>
              <p>• PUT /api/auction/{id} - Update auction</p>
              <p>• DELETE /api/auction/{id} - Delete auction</p>
              <p>• GET /api/auctioncar - List auction cars</p>
              <p>• POST /api/auctioncar - Create auction car</p>
              <p>• GET /api/location - List locations</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !config.baseApiUrl.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}