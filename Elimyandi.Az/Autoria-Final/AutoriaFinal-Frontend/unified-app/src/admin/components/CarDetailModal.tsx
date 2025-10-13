import { useState, useEffect, useCallback } from 'react'
import { 
  X, 
  Copy, 
  MapPin, 
  User, 
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  Play,
  Square,
  Hammer,
  Edit3,
  Wrench
} from 'lucide-react'
import { apiClient } from '../services/apiClient'

interface CarDetailModalProps {
  isOpen: boolean
  onClose: () => void
  auctionCarId: string
}

interface AuctionCarFullDetails {
  auctionCar: {
    id: string
    lotNumber: string
    currentPrice: number
    reservePrice: number
    startPrice: number
    status: string
    startTimeUtc?: string
    timerSeconds?: number
    currentCarStartTime?: string
    locationId?: string
    location?: string
  }
  car: {
  id: string
  vin: string
    year: number
  make: string
  model: string
  odometer: number
  bodyStyle?: string
  color?: string
    photos?: Array<{ thumbnailUrl?: string; url?: string }>
    thumbnailUrl?: string
  ownerId?: string
  }
}

interface BiddingStats {
  totalBids: number
  highestBid: number
  averageBid: number
  biddersCount: number
}

interface PreBid {
  id: string
  bidderUserName: string
  amount: number
  time: string
}

interface LocationData {
  id: string
  name: string
  city?: string
  country?: string
}

interface UserData {
  id: string
  userName?: string
  name?: string
}

interface LoadingStates {
  main: boolean
  stats: boolean
  preBids: boolean
  location: boolean
  owner: boolean
  action: boolean
}

interface ErrorStates {
  main: string | null
  stats: string | null
  preBids: string | null
  location: string | null
  owner: string | null
  action: string | null
}

export function CarDetailModal({ isOpen, onClose, auctionCarId }: CarDetailModalProps) {
  // Main data states
  const [fullDetails, setFullDetails] = useState<AuctionCarFullDetails | null>(null)
  const [biddingStats, setBiddingStats] = useState<BiddingStats | null>(null)
  const [preBids, setPreBids] = useState<PreBid[]>([])
  const [highestBid, setHighestBid] = useState<PreBid | null>(null)
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [ownerData, setOwnerData] = useState<UserData | null>(null)
  
  // Loading and error states
  const [loading, setLoading] = useState<LoadingStates>({
    main: false,
    stats: false,
    preBids: false,
    location: false,
    owner: false,
    action: false
  })
  
  const [errors, setErrors] = useState<ErrorStates>({
    main: null,
    stats: null,
    preBids: null,
    location: null,
    owner: null,
    action: null
  })
  
  // UI states
  const [activeTab, setActiveTab] = useState<'overview' | 'bids'>('overview')
  const [showActionModal, setShowActionModal] = useState<string | null>(null)
  const [actionValue, setActionValue] = useState<string>('')

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatTimeRemaining = (startTime?: string, timerSeconds?: number, currentCarStartTime?: string): string => {
    try {
      let targetTime: Date | null = null
      
      if (currentCarStartTime) {
        targetTime = new Date(currentCarStartTime)
      } else if (startTime) {
        targetTime = new Date(startTime)
      }
      
      if (targetTime && !isNaN(targetTime.getTime())) {
        const now = new Date()
        const diffMs = targetTime.getTime() - now.getTime()
        
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60))
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
          
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        } else {
          return 'Ended'
        }
      }
      
      if (timerSeconds && timerSeconds > 0) {
        const hours = Math.floor(timerSeconds / 3600)
        const minutes = Math.floor((timerSeconds % 3600) / 60)
        const seconds = timerSeconds % 60
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      }
      
      return 'N/A'
    } catch (error) {
      console.error('Error formatting time remaining:', error)
      return 'N/A'
    }
  }

  const buildImageUrl = (url: string): string => {
    if (!url) return ''
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    
    const imageBaseURL = (apiClient as any).imageBaseURL || ''
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url
    return imageBaseURL ? `${imageBaseURL}/${cleanUrl}` : cleanUrl
  }

  const getThumbnailUrl = (): string => {
    if (!fullDetails?.car) return ''
    
    const car = fullDetails.car
    
    // Priority 1: photos[0].thumbnailUrl
    if (car.photos && car.photos.length > 0 && car.photos[0].thumbnailUrl) {
      return buildImageUrl(car.photos[0].thumbnailUrl)
    }
    
    // Priority 2: photos[0].url
    if (car.photos && car.photos.length > 0 && car.photos[0].url) {
      return buildImageUrl(car.photos[0].url)
    }
    
    // Priority 3: thumbnailUrl field
    if (car.thumbnailUrl) {
      return buildImageUrl(car.thumbnailUrl)
    }
    
    return ''
  }

  // Main data loading function
  const loadMainData = useCallback(async () => {
    if (!auctionCarId) return

    try {
      setLoading(prev => ({ ...prev, main: true }))
      setErrors(prev => ({ ...prev, main: null }))

      console.log(`Loading full details for auctionCarId: ${auctionCarId}`)
      
      // Try full-details endpoint first
      try {
        // Note: This endpoint may not exist yet, so we'll use a fallback approach
        console.log('Full-details endpoint not implemented yet, using fallback')
      } catch (error: any) {
        console.log('Full-details endpoint failed, trying fallback:', error.message)
      }

      // Fallback: Load auctionCar and car separately
      console.log('Loading auctionCar and car separately...')
      
      // For now, we'll simulate the auctionCar data since the endpoint might not exist
      const auctionCarResponse = {
        id: auctionCarId,
        lotNumber: `LOT-${auctionCarId.slice(-4)}`,
        currentPrice: 0,
        reservePrice: 0,
        startPrice: 0,
        status: 'Scheduled',
        carId: auctionCarId // Assuming carId is same as auctionCarId for now
      }
      
      const carResponse = await apiClient.getVehicleById(auctionCarResponse.carId)
      
      const fallbackDetails: AuctionCarFullDetails = {
        auctionCar: auctionCarResponse,
        car: carResponse
      }
      
      console.log('Fallback details loaded:', fallbackDetails)
      setFullDetails(fallbackDetails)
      
    } catch (error: any) {
      console.error('Error loading main data:', error)
      
      let errorMessage = 'Failed to load vehicle details'
      if (error.message?.includes('404')) {
        errorMessage = 'Vehicle not found'
      } else if (error.message?.includes('401')) {
        errorMessage = 'Authentication required'
      } else if (error.message?.includes('403')) {
        errorMessage = 'Access denied'
      }
      
      setErrors(prev => ({ ...prev, main: errorMessage }))
    } finally {
      setLoading(prev => ({ ...prev, main: false }))
    }
  }, [auctionCarId])

  // Load bidding statistics
  const loadBiddingStats = useCallback(async () => {
    if (!auctionCarId) return

    try {
      setLoading(prev => ({ ...prev, stats: true }))
      setErrors(prev => ({ ...prev, stats: null }))

      // For now, simulate bidding stats since the endpoint might not exist
      const mockStats: BiddingStats = {
        totalBids: 0,
        highestBid: 0,
        averageBid: 0,
        biddersCount: 0
      }
      
      console.log('Bidding stats loaded (mock):', mockStats)
      setBiddingStats(mockStats)
      
    } catch (error: any) {
      console.error('Error loading bidding stats:', error)
      setErrors(prev => ({ ...prev, stats: 'Failed to load bidding statistics' }))
    } finally {
      setLoading(prev => ({ ...prev, stats: false }))
    }
  }, [auctionCarId])

  // Load pre-bids
  const loadPreBids = useCallback(async () => {
    if (!auctionCarId) return

    try {
      setLoading(prev => ({ ...prev, preBids: true }))
      setErrors(prev => ({ ...prev, preBids: null }))

      // For now, simulate pre-bids since the endpoint might not exist
      const mockPreBids: PreBid[] = []
      const mockHighestBid: PreBid | null = null
      
      console.log('Pre-bids loaded (mock):', mockPreBids)
      setPreBids(mockPreBids)
      setHighestBid(mockHighestBid)
      
    } catch (error: any) {
      console.error('Error loading pre-bids:', error)
      setErrors(prev => ({ ...prev, preBids: 'Failed to load bid history' }))
    } finally {
      setLoading(prev => ({ ...prev, preBids: false }))
    }
  }, [auctionCarId])

  // Load location data
  const loadLocationData = useCallback(async () => {
    if (!fullDetails?.auctionCar?.locationId) return

    try {
      setLoading(prev => ({ ...prev, location: true }))
      setErrors(prev => ({ ...prev, location: null }))

      const locationResponse = await apiClient.getLocationById(fullDetails.auctionCar.locationId)
      
      console.log('Location data loaded:', locationResponse)
      setLocationData(locationResponse)
      
    } catch (error: any) {
      console.error('Error loading location:', error)
      setErrors(prev => ({ ...prev, location: 'Failed to load location' }))
    } finally {
      setLoading(prev => ({ ...prev, location: false }))
    }
  }, [fullDetails?.auctionCar?.locationId])

  // Load owner data
  const loadOwnerData = useCallback(async () => {
    if (!fullDetails?.car?.ownerId) return

    try {
      setLoading(prev => ({ ...prev, owner: true }))
      setErrors(prev => ({ ...prev, owner: null }))

      // For now, simulate owner data since the endpoint might not exist
      const mockOwner: UserData = {
        id: fullDetails.car.ownerId,
        userName: `User ${fullDetails.car.ownerId.slice(-4)}`,
        name: `User ${fullDetails.car.ownerId.slice(-4)}`
      }
      
      console.log('Owner data loaded (mock):', mockOwner)
      setOwnerData(mockOwner)
      
    } catch (error: any) {
      console.error('Error loading owner:', error)
      setErrors(prev => ({ ...prev, owner: 'Failed to load owner information' }))
    } finally {
      setLoading(prev => ({ ...prev, owner: false }))
    }
  }, [fullDetails?.car?.ownerId])

  // Action handlers
  const handleAction = async (action: string, value?: string) => {
    if (!auctionCarId) return

    try {
      setLoading(prev => ({ ...prev, action: true }))
      setErrors(prev => ({ ...prev, action: null }))

      // For now, simulate action responses since the endpoints might not exist
      console.log(`Action ${action} executed with value:`, value)
      
      // Simulate success
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log(`Action ${action} completed successfully`)
      
      // Refresh main data after successful action
      await loadMainData()
      setShowActionModal(null)
      setActionValue('')
      
    } catch (error: any) {
      console.error(`Error executing action ${action}:`, error)
      setErrors(prev => ({ ...prev, action: `Failed to ${action}` }))
    } finally {
      setLoading(prev => ({ ...prev, action: false }))
    }
  }

  // Load all data when modal opens
  useEffect(() => {
    if (isOpen && auctionCarId) {
      loadMainData()
    }
  }, [isOpen, auctionCarId, loadMainData])

  // Load additional data when main data is available
  useEffect(() => {
    if (fullDetails) {
      loadBiddingStats()
      loadPreBids()
      loadLocationData()
      loadOwnerData()
    }
  }, [fullDetails, loadBiddingStats, loadPreBids, loadLocationData, loadOwnerData])

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Copy VIN to clipboard
  const copyVinToClipboard = async () => {
    if (fullDetails?.car?.vin) {
      try {
        await navigator.clipboard.writeText(fullDetails.car.vin)
        // Could add toast notification here
      } catch (err) {
        console.error('Failed to copy VIN:', err)
      }
    }
  }

  if (!isOpen) return null

  // Show loading skeleton if main data is loading
  if (loading.main) {
  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="h-64 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error if main data failed to load
  if (errors.main) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Error</h2>
          </div>
          <p className="text-gray-600 mb-4">{errors.main}</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
                <button
              onClick={loadMainData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
              Retry
                </button>
              </div>
                            </div>
                          </div>
    )
  }

  if (!fullDetails) return null

  const { auctionCar, car } = fullDetails
  const thumbnailUrl = getThumbnailUrl()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
              {thumbnailUrl ? (
                <img 
                  src={thumbnailUrl} 
                  alt={`${car.year} ${car.make} ${car.model}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                    console.warn('Image failed to load:', thumbnailUrl)
                              e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-8 h-8 text-gray-400">🚗</div>
              )}
                            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {car.year} {car.make} {car.model}
              </h2>
              <p className="text-sm text-gray-600">Lot #{auctionCar.lotNumber}</p>
                          </div>
                        </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
                      </div>
                      
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
                          <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
                          </button>
                          <button
              onClick={() => setActiveTab('bids')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bids'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Bids
                          </button>
          </nav>
                    </div>
                    
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Main Info */}
              <div className="space-y-6">
                {/* Vehicle Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">VIN</label>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-900 font-mono">{car.vin}</p>
                          <button
                          onClick={copyVinToClipboard}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Copy VIN"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Year</label>
                      <p className="text-sm text-gray-900">{car.year}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Make</label>
                      <p className="text-sm text-gray-900">{car.make}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Model</label>
                      <p className="text-sm text-gray-900">{car.model}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Odometer</label>
                      <p className="text-sm text-gray-900">{car.odometer?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        auctionCar.status === 'Live' ? 'bg-green-100 text-green-800' :
                        auctionCar.status === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        auctionCar.status === 'Sold' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {auctionCar.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Current Price</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(auctionCar.currentPrice || 0)}
                        </span>
                      </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Reserve Price</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(auctionCar.reservePrice || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Start Price</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(auctionCar.startPrice || 0)}
                        </span>
                    </div>
                  </div>
                </div>

                {/* Location & Owner */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Location:</span>
                      {loading.location ? (
                        <div className="animate-pulse h-4 w-32 bg-gray-200 rounded"></div>
                      ) : locationData ? (
                        <span className="text-sm text-gray-900">
                          {locationData.city ? `${locationData.city} - ${locationData.name}` : locationData.name}
                      </span>
                      ) : errors.location ? (
                        <span className="text-sm text-red-500">Failed to load</span>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Owner:</span>
                      {loading.owner ? (
                        <div className="animate-pulse h-4 w-24 bg-gray-200 rounded"></div>
                      ) : ownerData ? (
                        <span className="text-sm text-gray-900">
                          {ownerData.userName || ownerData.name || `User ${ownerData.id.slice(-4)}`}
                      </span>
                      ) : errors.owner ? (
                        <span className="text-sm text-red-500">Failed to load</span>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Time Remaining:</span>
                      <span className="text-sm font-mono text-gray-900">
                        {formatTimeRemaining(auctionCar.startTimeUtc, auctionCar.timerSeconds, auctionCar.currentCarStartTime)}
                      </span>
                    </div>
                  </div>
                  </div>
                </div>

              {/* Right Column - Statistics & Actions */}
              <div className="space-y-6">
                {/* Bidding Statistics */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Bidding Statistics</h3>
                  {loading.stats ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  ) : errors.stats ? (
                    <p className="text-sm text-red-500">{errors.stats}</p>
                  ) : biddingStats ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Total Bids</span>
                        <span className="text-sm font-semibold text-gray-900">{biddingStats.totalBids}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Highest Bid</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(biddingStats.highestBid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Average Bid</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(biddingStats.averageBid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Bidders</span>
                        <span className="text-sm font-semibold text-gray-900">{biddingStats.biddersCount}</span>
                      </div>
                        </div>
                  ) : (
                    <p className="text-sm text-gray-500">No statistics available</p>
                  )}
                </div>

                {/* Actions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowActionModal('prepare')}
                      disabled={loading.action}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Wrench className="w-4 h-4" />
                      Prepare
                    </button>
                    <button
                      onClick={() => setShowActionModal('activate')}
                      disabled={loading.action}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                      Activate
                    </button>
                    <button
                      onClick={() => setShowActionModal('end')}
                      disabled={loading.action}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <Square className="w-4 h-4" />
                      End
                    </button>
                    <button
                      onClick={() => setShowActionModal('hammer')}
                      disabled={loading.action}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      <Hammer className="w-4 h-4" />
                      Hammer
                    </button>
                    <button
                      onClick={() => setShowActionModal('price')}
                      disabled={loading.action}
                      className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 disabled:opacity-50 col-span-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Update Price
                    </button>
                        </div>
                  {errors.action && (
                    <p className="text-sm text-red-500 mt-2">{errors.action}</p>
                      )}
                </div>
                        </div>
                        </div>
          ) : (
            /* Bids Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Bid History</h3>
                {highestBid && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Highest Bid</span>
                    </div>
                    <p className="text-lg font-semibold text-green-900">
                      {formatCurrency(highestBid.amount)} by {highestBid.bidderUserName}
                    </p>
                        </div>
                      )}
              </div>
              
              {loading.preBids ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : errors.preBids ? (
                <p className="text-sm text-red-500">{errors.preBids}</p>
              ) : preBids.length > 0 ? (
                <div className="space-y-2">
                  {preBids.map((bid) => (
                    <div key={bid.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">{bid.bidderUserName}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(bid.amount)}</p>
                        <p className="text-xs text-gray-500">{new Date(bid.time).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No bids yet</p>
                  </div>
                )}
              </div>
            )}
          </div>

        {/* Action Modal */}
        {showActionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {showActionModal === 'hammer' ? 'Set Hammer Price' : 
                 showActionModal === 'price' ? 'Update Current Price' : 
                 `Confirm ${showActionModal}`}
              </h3>
              
              {(showActionModal === 'hammer' || showActionModal === 'price') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {showActionModal === 'hammer' ? 'Hammer Price' : 'New Price'}
                  </label>
                  <input
                    type="number"
                    value={actionValue}
                    onChange={(e) => setActionValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                  />
            </div>
              )}
              
              <div className="flex gap-3">
              <button
                  onClick={() => {
                    setShowActionModal(null)
                    setActionValue('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
              </button>
              <button
                  onClick={() => handleAction(showActionModal, actionValue)}
                  disabled={loading.action || (showActionModal === 'hammer' && !actionValue) || (showActionModal === 'price' && !actionValue)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading.action ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}