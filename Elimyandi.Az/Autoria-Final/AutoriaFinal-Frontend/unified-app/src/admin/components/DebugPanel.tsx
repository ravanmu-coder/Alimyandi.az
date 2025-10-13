import { useState, useEffect } from 'react'
import { X, Activity, Copy, Trash2, Eye, EyeOff } from 'lucide-react'

interface ApiRequest {
  id: string
  url: string
  method: string
  status: number
  timestamp: Date
  duration: number
  requestBody?: any
  responseBody?: any
  error?: string
}

interface DebugPanelProps {
  isOpen: boolean
  onClose: () => void
  debugCalls?: ApiRequest[]
}

export function DebugPanel({ isOpen, onClose, debugCalls = [] }: DebugPanelProps) {
  const [requests, setRequests] = useState<ApiRequest[]>([])
  const [showRequestBody, setShowRequestBody] = useState(false)
  const [showResponseBody, setShowResponseBody] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ApiRequest | null>(null)

  // Use debugCalls from props if available, otherwise use local state
  const displayRequests = debugCalls.length > 0 ? debugCalls : requests

  useEffect(() => {
    if (isOpen) {
      // Listen for API requests from the console
      const originalLog = console.log
      const originalError = console.error
      
      console.log = (...args) => {
        originalLog(...args)
        if (args[0]?.includes('Admin API request to:')) {
          const url = args[0].replace('Admin API request to: ', '')
          addRequest({
            url,
            method: 'GET', // Default, will be updated when response comes
            status: 0,
            timestamp: new Date(),
            duration: 0
          })
        }
      }
      
      console.error = (...args) => {
        originalError(...args)
        if (args[0]?.includes('Admin API Error:')) {
          const errorText = args[0]
          updateLastRequest({ error: errorText })
        }
      }
      
      return () => {
        console.log = originalLog
        console.error = originalError
      }
    }
  }, [isOpen])

  const addRequest = (request: Partial<ApiRequest>) => {
    const newRequest: ApiRequest = {
      id: Date.now().toString(),
      url: request.url || '',
      method: request.method || 'GET',
      status: request.status || 0,
      timestamp: request.timestamp || new Date(),
      duration: request.duration || 0,
      ...request
    }
    
    setRequests(prev => [newRequest, ...prev.slice(0, 49)]) // Keep last 50 requests
  }

  const updateLastRequest = (updates: Partial<ApiRequest>) => {
    setRequests(prev => {
      if (prev.length === 0) return prev
      const updated = [...prev]
      updated[0] = { ...updated[0], ...updates }
      return updated
    })
  }

  const clearRequests = () => {
    setRequests([])
  }

  const copyRequestDetails = (request: ApiRequest) => {
    const details = {
      url: request.url,
      method: request.method,
      status: request.status,
      timestamp: request.timestamp.toISOString(),
      duration: request.duration,
      error: request.error
    }
    
    navigator.clipboard.writeText(JSON.stringify(details, null, 2))
  }

  const getStatusColor = (status: number) => {
    if (status === 0) return 'text-gray-500'
    if (status >= 200 && status < 300) return 'text-green-600'
    if (status >= 400 && status < 500) return 'text-yellow-600'
    if (status >= 500) return 'text-red-600'
    return 'text-gray-500'
  }

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-100 text-blue-800'
      case 'POST': return 'bg-green-100 text-green-800'
      case 'PUT': return 'bg-yellow-100 text-yellow-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">API Debug Panel</h2>
              <p className="text-sm text-gray-600">Monitor API requests and responses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearRequests}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear all requests"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRequestBody(!showRequestBody)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  showRequestBody 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showRequestBody ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Request Body
              </button>
              <button
                onClick={() => setShowResponseBody(!showResponseBody)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  showResponseBody 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showResponseBody ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Response Body
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {displayRequests.length} request{displayRequests.length !== 1 ? 's' : ''} logged
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {displayRequests.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No API requests logged yet</p>
              <p className="text-sm text-gray-400 mt-1">Make some API calls to see them here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {displayRequests.map((request) => (
                <div 
                  key={request.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedRequest?.id === request.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(request.method)}`}>
                        {request.method}
                      </span>
                      <span className={`text-sm font-medium ${getStatusColor(request.status)}`}>
                        {request.status || 'Pending'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {request.duration}ms
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {request.timestamp.toLocaleTimeString()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyRequestDetails(request)
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Copy request details"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-900 font-mono break-all">
                      {request.url}
                    </p>
                    {request.error && (
                      <p className="text-sm text-red-600 mt-1">
                        Error: {request.error}
                      </p>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {selectedRequest?.id === request.id && (
                    <div className="mt-4 space-y-3">
                      {showRequestBody && request.requestBody && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Request Body:</h4>
                          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                            {JSON.stringify(request.requestBody, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {showResponseBody && request.responseBody && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Response Body:</h4>
                          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                            {JSON.stringify(request.responseBody, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Debug panel shows the last 50 API requests
            </div>
            <div className="flex items-center gap-4">
              <span>Auto-refresh: ON</span>
              <button
                onClick={clearRequests}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
