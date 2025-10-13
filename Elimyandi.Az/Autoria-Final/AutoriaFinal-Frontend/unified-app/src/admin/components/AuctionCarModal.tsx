import { useState, useEffect } from 'react'
import { 
  X, 
  Car, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Play, 
  Square, 
  XCircle, 
  CheckCircle,
  Gavel,
  AlertCircle,
  Settings
} from 'lucide-react'
import { apiClient } from '../services/apiClient'

interface AuctionCarModalProps {
  isOpen: boolean
  onClose: () => void
  auctionCarId: string | null
  onCarUpdated: (car: any) => void
}

interface AuctionCar {
  id: string
  lotNumber: string
  vin: string
  make: string
  model: string
  year: number
  currentPrice: number
  reservePrice?: number
  startingPrice: number
  status: string
  imageUrl?: string
  auctionId: string
  carId: string
  timerSeconds?: number
  minBidIncrement?: number
  maxCarDurationMinutes?: number
  description?: string
  isPublic?: boolean
  isPrivate?: boolean
  requireRegistration?: boolean
  autoAdvance?: boolean
  timer?: {
    remainingTime: number
    isActive: boolean
  }
  stats?: {
    totalBids: number
    highestBid: number
    averageBid: number
    bidderCount: number
  }
  preBids?: any[]
  highestBid?: any
}

export function AuctionCarModal({ isOpen, onClose, auctionCarId, onCarUpdated }: AuctionCarModalProps) {
  const [auctionCar, setAuctionCar] = useState<AuctionCar | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'bids' | 'actions' | 'settings'>('overview')
  
  // Action states
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [showHammerModal, setShowHammerModal] = useState(false)
  const [showUnsoldModal, setShowUnsoldModal] = useState(false)
  const [newPrice, setNewPrice] = useState(0)
  const [hammerPrice, setHammerPrice] = useState(0)
  const [unsoldReason, setUnsoldReason] = useState('')
  
  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    timerSeconds: 10,
    minBidIncrement: 100,
    maxCarDurationMinutes: 30,
    description: '',
    isPublic: true,
    isPrivate: false,
    requireRegistration: false,
    autoAdvance: false
  })

  useEffect(() => {
    if (isOpen && auctionCarId) {
      loadAuctionCarData()
    }
  }, [isOpen, auctionCarId])

  const loadAuctionCarData = async () => {
    if (!auctionCarId) return
    
    setLoading(true)
    try {
      const [carData, timerData, statsData, preBidsData, highestBidData] = await Promise.all([
        apiClient.getAuctionCarById(auctionCarId),
        apiClient.getAuctionCarTimer(auctionCarId).catch(() => null),
        apiClient.getAuctionCarStats(auctionCarId).catch(() => null),
        apiClient.getAuctionCarPreBids(auctionCarId).catch(() => null),
        apiClient.getAuctionCarHighestBid(auctionCarId).catch(() => null)
      ])
      
      setAuctionCar({
        ...carData,
        timer: timerData,
        stats: statsData,
        preBids: preBidsData,
        highestBid: highestBidData
      })
      
      // Update settings form with car data
      setSettingsForm({
        timerSeconds: carData.timerSeconds || 10,
        minBidIncrement: carData.minBidIncrement || 100,
        maxCarDurationMinutes: carData.maxCarDurationMinutes || 30,
        description: carData.description || '',
        isPublic: carData.isPublic !== false,
        isPrivate: carData.isPrivate === true,
        requireRegistration: carData.requireRegistration === true,
        autoAdvance: carData.autoAdvance === true
      })
    } catch (err: any) {
      console.error('Error loading auction car:', err)
      setError(err.message || 'Failed to load auction car data')
    } finally {
      setLoading(false)
    }
  }

  const handleCarAction = async (action: string) => {
    if (!auctionCarId) return
    
    try {
      let result
      switch (action) {
        case 'prepare':
          result = await apiClient.prepareAuctionCar(auctionCarId)
          break
        case 'activate':
          result = await apiClient.activateAuctionCar(auctionCarId)
          break
        case 'end':
          result = await apiClient.endAuctionCar(auctionCarId)
          break
        case 'markUnsold':
          result = await apiClient.markAuctionCarUnsold(auctionCarId, unsoldReason)
          setShowUnsoldModal(false)
          setUnsoldReason('')
          break
        case 'updatePrice':
          result = await apiClient.updateAuctionCarPrice(auctionCarId, newPrice)
          setShowPriceModal(false)
          setNewPrice(0)
          break
        case 'setHammer':
          result = await apiClient.setHammerPrice(auctionCarId, hammerPrice)
          setShowHammerModal(false)
          setHammerPrice(0)
          break
      }
      
      // Reload car data
      await loadAuctionCarData()
      onCarUpdated(result)
    } catch (err: any) {
      console.error(`Error performing ${action}:`, err)
      setError(err.message || `Failed to ${action} car`)
    }
  }

  const handleSettingsChange = (field: string, value: any) => {
    setSettingsForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveSettings = async () => {
    if (!auctionCarId) return
    
    try {
      const updatedCar = await apiClient.updateAuctionCar(auctionCarId, settingsForm)
      await loadAuctionCarData() // Reload data
      onCarUpdated(updatedCar)
    } catch (err: any) {
      console.error('Error updating car settings:', err)
      setError(err.message || 'Failed to update car settings')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Prepared': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'Active': { bg: 'bg-green-100', text: 'text-green-800' },
      'Ended': { bg: 'bg-gray-100', text: 'text-gray-800' },
      'Sold': { bg: 'bg-green-100', text: 'text-green-800' },
      'Unsold': { bg: 'bg-red-100', text: 'text-red-800' },
      'Cancelled': { bg: 'bg-orange-100', text: 'text-orange-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Prepared']
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status}
      </span>
    )
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {auctionCar ? `${auctionCar.year} ${auctionCar.make} ${auctionCar.model}` : 'Auction Car Details'}
              </h2>
              <p className="text-sm text-gray-600">
                Lot #{auctionCar?.lotNumber || 'Loading...'}
              </p>
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
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading car details...</p>
          </div>
        ) : (
          <>
            {/* Error State */}
            {error && (
              <div className="p-4 bg-red-50 border-b border-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Overview', icon: Car },
                  { id: 'bids', label: 'Bids', icon: TrendingUp },
                  { id: 'actions', label: 'Actions', icon: Settings },
                  { id: 'settings', label: 'Settings', icon: Settings }
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {activeTab === 'overview' && auctionCar && (
                <div className="space-y-6">
                  {/* Car Image and Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      {auctionCar.imageUrl ? (
                        <img 
                          src={auctionCar.imageUrl} 
                          alt={`${auctionCar.year} ${auctionCar.make} ${auctionCar.model}`}
                          className="w-full h-48 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Car className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Vehicle Information</h3>
                        <div className="mt-2 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">VIN:</span>
                            <span className="font-mono text-gray-900">{auctionCar.vin}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Year:</span>
                            <span className="text-gray-900">{auctionCar.year}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Make:</span>
                            <span className="text-gray-900">{auctionCar.make}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Model:</span>
                            <span className="text-gray-900">{auctionCar.model}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            {getStatusBadge(auctionCar.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Timer */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Current Price</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            ${auctionCar.currentPrice?.toLocaleString() || '0'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Reserve Price</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {auctionCar.reservePrice ? `$${auctionCar.reservePrice.toLocaleString()}` : 'No Reserve'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {auctionCar.timer && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Time Remaining</p>
                            <p className="text-2xl font-mono text-gray-900">
                              {formatDuration(auctionCar.timer.remainingTime)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Statistics */}
                  {auctionCar.stats && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Bidding Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-semibold text-gray-900">{auctionCar.stats.totalBids}</p>
                          <p className="text-sm text-gray-600">Total Bids</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-semibold text-gray-900">${auctionCar.stats.highestBid?.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Highest Bid</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-semibold text-gray-900">${auctionCar.stats.averageBid?.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Average Bid</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-semibold text-gray-900">{auctionCar.stats.bidderCount}</p>
                          <p className="text-sm text-gray-600">Bidders</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bids' && auctionCar && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Pre-bids</h3>
                  
                  {auctionCar.preBids && auctionCar.preBids.length > 0 ? (
                    <div className="space-y-2">
                      {auctionCar.preBids.map((bid, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">${bid.amount?.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">Bidder: {bid.bidderName || 'Anonymous'}</p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(bid.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No pre-bids yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'actions' && auctionCar && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Car Actions</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Prepare Car */}
                    <button
                      onClick={() => handleCarAction('prepare')}
                      disabled={auctionCar.status === 'Active' || auctionCar.status === 'Ended'}
                      className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Play className="w-5 h-5 text-blue-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-blue-900">Prepare Car</p>
                          <p className="text-xs text-blue-700">Ready for auction</p>
                        </div>
                      </div>
                    </button>

                    {/* Activate Car */}
                    <button
                      onClick={() => handleCarAction('activate')}
                      disabled={auctionCar.status !== 'Prepared'}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-green-900">Activate Car</p>
                          <p className="text-xs text-green-700">Start bidding</p>
                        </div>
                      </div>
                    </button>

                    {/* End Car */}
                    <button
                      onClick={() => handleCarAction('end')}
                      disabled={auctionCar.status !== 'Active'}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Square className="w-5 h-5 text-red-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-red-900">End Car</p>
                          <p className="text-xs text-red-700">Stop bidding</p>
                        </div>
                      </div>
                    </button>

                    {/* Update Price */}
                    <button
                      onClick={() => setShowPriceModal(true)}
                      disabled={auctionCar.status !== 'Active'}
                      className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-yellow-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-yellow-900">Update Price</p>
                          <p className="text-xs text-yellow-700">Set new price</p>
                        </div>
                      </div>
                    </button>

                    {/* Set Hammer */}
                    <button
                      onClick={() => setShowHammerModal(true)}
                      disabled={auctionCar.status !== 'Active'}
                      className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Gavel className="w-5 h-5 text-purple-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-purple-900">Set Hammer</p>
                          <p className="text-xs text-purple-700">Mark as sold</p>
                        </div>
                      </div>
                    </button>

                    {/* Mark Unsold */}
                    <button
                      onClick={() => setShowUnsoldModal(true)}
                      disabled={auctionCar.status === 'Sold'}
                      className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-orange-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-orange-900">Mark Unsold</p>
                          <p className="text-xs text-orange-700">No sale</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && auctionCar && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Car Settings</h3>
                  
                  <div className="space-y-6">
                    {/* Timer Settings */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Timer Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Timer Seconds *
                          </label>
                          <input
                            type="number"
                            value={settingsForm.timerSeconds}
                            onChange={(e) => handleSettingsChange('timerSeconds', parseInt(e.target.value) || 10)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                            max="600"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Auction car countdown (seconds)</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Car Duration (Minutes) *
                          </label>
                          <input
                            type="number"
                            value={settingsForm.maxCarDurationMinutes}
                            onChange={(e) => handleSettingsChange('maxCarDurationMinutes', parseInt(e.target.value) || 30)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="5"
                            max="120"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Maximum allowed time per car in minutes</p>
                        </div>
                      </div>
                    </div>

                    {/* Bidding Settings */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Bidding Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Bid Increment *
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              value={settingsForm.minBidIncrement}
                              onChange={(e) => handleSettingsChange('minBidIncrement', parseInt(e.target.value) || 100)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="1"
                              max="10000"
                              required
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Minimum bid increment applied during live bidding</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Description</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Car Description (Optional)
                        </label>
                        <textarea
                          value={settingsForm.description}
                          onChange={(e) => handleSettingsChange('description', e.target.value)}
                          rows={3}
                          maxLength={2000}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter car description"
                        />
                        <p className="text-xs text-gray-500 mt-1">Maximum 2000 characters</p>
                      </div>
                    </div>

                    {/* Flags */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Auction Flags</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settingsForm.isPublic}
                              onChange={(e) => {
                                handleSettingsChange('isPublic', e.target.checked)
                                handleSettingsChange('isPrivate', !e.target.checked)
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Public Auction</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settingsForm.isPrivate}
                              onChange={(e) => {
                                handleSettingsChange('isPrivate', e.target.checked)
                                handleSettingsChange('isPublic', !e.target.checked)
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
                              checked={settingsForm.requireRegistration}
                              onChange={(e) => handleSettingsChange('requireRegistration', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Require Registration</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settingsForm.autoAdvance}
                              onChange={(e) => handleSettingsChange('autoAdvance', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Auto Advance</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveSettings}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Price Update Modal */}
        {showPriceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Update Price</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Price *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowPriceModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCarAction('updatePrice')}
                      disabled={!newPrice || newPrice <= 0}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update Price
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hammer Price Modal */}
        {showHammerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Set Hammer Price</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hammer Price *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={hammerPrice}
                        onChange={(e) => setHammerPrice(parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowHammerModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCarAction('setHammer')}
                      disabled={!hammerPrice || hammerPrice <= 0}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set Hammer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mark Unsold Modal */}
        {showUnsoldModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Mark as Unsold</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason *
                    </label>
                    <textarea
                      value={unsoldReason}
                      onChange={(e) => setUnsoldReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter reason for marking as unsold"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowUnsoldModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCarAction('markUnsold')}
                      disabled={!unsoldReason.trim()}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark Unsold
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
