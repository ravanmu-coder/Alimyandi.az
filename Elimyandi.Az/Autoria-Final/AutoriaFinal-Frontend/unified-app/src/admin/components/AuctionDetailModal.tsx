import { useState, useEffect } from 'react'
import { 
  X, 
  Clock, 
  MapPin, 
  Car, 
  DollarSign, 
  Play, 
  Square, 
  XCircle, 
  Plus, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { Button } from './common/Button'
import { Badge } from './common/Badge'
import { apiClient } from '../services/apiClient'
import { useToast } from './common/Toast'
import { AddVehicleModal } from './AddVehicleModal'

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

interface AuctionStatistics {
  totalVehicles: number
  totalRevenue: number
  averageBid: number
  highestBid: number
  totalBids: number
}

interface AuctionCar {
  id: string
  carId: string
  lotNumber: number
  startingBid: number
  reservePrice?: number
  currentBid?: number
  status: string
  car?: {
    id: string
    make: string
    model: string
    year: number
    vin: string
  }
}

interface EnrichedVehicle {
  auctionCarData: AuctionCar
  carData?: {
    id: string
    make: string
    model: string
    year: number
    vin: string
    estimatedRetailValue?: number
    mileage?: number
    color?: string
    condition?: string
  }
  isLoading: boolean
  error?: string
}

interface AuctionDetailModalProps {
  auctionId: string
  onClose: () => void
}

type TabType = 'overview' | 'vehicles' | 'controls'

export function AuctionDetailModal({ auctionId, onClose }: AuctionDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [auction, setAuction] = useState<Auction | null>(null)
  const [statistics, setStatistics] = useState<AuctionStatistics | null>(null)
  const [vehicles, setVehicles] = useState<AuctionCar[]>([])
  const [enrichedVehicles, setEnrichedVehicles] = useState<EnrichedVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [vehiclesLoading, setVehiclesLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)
  const [refreshingVehicles, setRefreshingVehicles] = useState(false)
  const { success, error } = useToast()

  useEffect(() => {
    loadAuctionData()
  }, [auctionId])

  const loadAuctionData = async () => {
    try {
      setLoading(true)
      const [auctionData, statsData] = await Promise.all([
        apiClient.getAuction(auctionId),
        apiClient.getAuctionStatistics(auctionId)
      ])
      setAuction(auctionData)
      setStatistics(statsData)
    } catch (err) {
      console.error('Failed to load auction data:', err)
      error('Failed to load auction data')
    } finally {
      setLoading(false)
    }
  }

  const loadVehicles = async () => {
    try {
      setVehiclesLoading(true)
      const vehiclesData = await apiClient.getAuctionCarsByAuction(auctionId)
      setVehicles(vehiclesData)
      
      // Create enriched vehicles with loading state
      const enrichedData: EnrichedVehicle[] = vehiclesData.map(auctionCar => ({
        auctionCarData: auctionCar,
        isLoading: true,
        error: undefined
      }))
      setEnrichedVehicles(enrichedData)
      
      // Load detailed car information for each vehicle in parallel
      const carDetailPromises = vehiclesData.map(async (auctionCar, index) => {
        try {
          const carData = await apiClient.getVehicleById(auctionCar.carId)
          return { index, carData, error: undefined }
        } catch (err) {
          console.error(`Failed to load car details for carId ${auctionCar.carId}:`, err)
          return { index, carData: undefined, error: 'Failed to load car details' }
        }
      })
      
      const carDetailsResults = await Promise.allSettled(carDetailPromises)
      
      // Update enriched vehicles with loaded car data
      setEnrichedVehicles(prev => 
        prev.map((enrichedVehicle, index) => {
          const result = carDetailsResults[index]
          if (result.status === 'fulfilled') {
            const { carData, error } = result.value
            return {
              ...enrichedVehicle,
              carData,
              isLoading: false,
              error
            }
          } else {
            return {
              ...enrichedVehicle,
              isLoading: false,
              error: 'Failed to load car details'
            }
          }
        })
      )
    } catch (err) {
      console.error('Failed to load vehicles:', err)
      error('Failed to load vehicles')
    } finally {
      setVehiclesLoading(false)
    }
  }

  const handleStartAuction = async () => {
    try {
      setActionLoading(true)
      await apiClient.startAuction(auctionId)
      success('Auction started successfully')
      loadAuctionData()
    } catch (err) {
      console.error('Failed to start auction:', err)
      error('Failed to start auction')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEndAuction = async () => {
    try {
      setActionLoading(true)
      await apiClient.endAuction(auctionId)
      success('Auction ended successfully')
      loadAuctionData()
    } catch (err) {
      console.error('Failed to end auction:', err)
      error('Failed to end auction')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelAuction = async () => {
    try {
      setActionLoading(true)
      await apiClient.cancelAuction(auctionId)
      success('Auction cancelled successfully')
      loadAuctionData()
    } catch (err) {
      console.error('Failed to cancel auction:', err)
      error('Failed to cancel auction')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddVehicleSuccess = async () => {
    setShowAddVehicleModal(false)
    setActiveTab('vehicles') // Switch to vehicles tab to show the newly added vehicles
    setRefreshingVehicles(true)
    
    // Add a small delay to ensure the backend has processed the new vehicles
    setTimeout(async () => {
      await loadVehicles()
      await loadAuctionData()
      setRefreshingVehicles(false)
      success('Vehicles successfully added to auction!')
    }, 500)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Draft': return 'neutral'
      case 'Scheduled': return 'warning'
      case 'Ready': return 'info'
      case 'Running': return 'success'
      case 'Ended': return 'neutral'
      case 'Cancelled': return 'error'
      default: return 'neutral'
    }
  }

  const getTimeRemaining = () => {
    if (!auction) return 'N/A'
    
    const now = new Date()
    const startTime = new Date(auction.startTimeUtc)
    const endTime = new Date(auction.endTimeUtc)
    
    if (now < startTime) {
      const diff = startTime.getTime() - now.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      return `${days}d ${hours}h until start`
    } else if (now < endTime) {
      const diff = endTime.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}h ${minutes}m remaining`
      } else {
      return 'Ended'
    }
  }

  const canStartAuction = auction?.status === 'Ready'
  const canEndAuction = auction?.status === 'Running'
  const canCancelAuction = ['Draft', 'Scheduled', 'Ready'].includes(auction?.status || '')

  if (loading) {
      return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-dark-bg-tertiary rounded-lg border border-dark-border w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-dark-bg-tertiary rounded-lg border border-dark-border w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center p-12">
            <AlertTriangle className="w-12 h-12 text-accent-error mx-auto mb-4" />
            <h3 className="text-h3 font-heading text-dark-text-primary mb-2">Auction Not Found</h3>
            <p className="text-body-md text-dark-text-secondary mb-6">The requested auction could not be found.</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-bg-tertiary rounded-lg border border-dark-border w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
            <div>
            <h2 className="text-h2 font-heading text-dark-text-primary">{auction.name}</h2>
            <p className="text-body-sm text-dark-text-secondary mt-1">Auction ID: {auction.id}</p>
                  </div>
          <Button variant="ghost" icon={X} onClick={onClose} />
        </div>

            {/* Tabs */}
        <div className="flex border-b border-dark-border">
          {[
            { id: 'overview', label: 'Overview', icon: Settings },
            { id: 'vehicles', label: 'Vehicles', icon: Car },
            { id: 'controls', label: 'Controls', icon: Play }
          ].map((tab) => (
                    <button
                      key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabType)
                if (tab.id === 'vehicles' && enrichedVehicles.length === 0) {
                  loadVehicles()
                }
              }}
              className={`flex items-center space-x-2 px-6 py-4 text-body-sm font-medium transition-colors duration-200 ${
                        activeTab === tab.id
                  ? 'text-accent-primary border-b-2 border-accent-primary'
                  : 'text-dark-text-secondary hover:text-dark-text-primary'
                      }`}
                    >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
                    </button>
          ))}
            </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
                <div className="space-y-6">
              {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-dark-bg-quaternary rounded-lg border border-dark-border p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-accent-primary/10 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-accent-primary" />
                    </div>
                        <div>
                      <p className="text-body-sm text-dark-text-muted">Status</p>
                      <Badge variant={getStatusBadgeVariant(auction.status)} size="sm">
                        {auction.status}
                      </Badge>
                          </div>
                      </div>
                    </div>

                <div className="bg-dark-bg-quaternary rounded-lg border border-dark-border p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-accent-warning/10 rounded-lg">
                      <Clock className="w-5 h-5 text-accent-warning" />
                    </div>
                          <div>
                      <p className="text-body-sm text-dark-text-muted">Time Remaining</p>
                      <p className="text-body-md font-medium text-dark-text-primary">{getTimeRemaining()}</p>
                                </div>
                      </div>
                    </div>

                <div className="bg-dark-bg-quaternary rounded-lg border border-dark-border p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-accent-info/10 rounded-lg">
                      <MapPin className="w-5 h-5 text-accent-info" />
                    </div>
                        <div>
                      <p className="text-body-sm text-dark-text-muted">Location</p>
                      <p className="text-body-md font-medium text-dark-text-primary">
                        {auction.locationName || 'Loading location...'}
                          </p>
                        </div>
                      </div>
                    </div>

                <div className="bg-dark-bg-quaternary rounded-lg border border-dark-border p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-accent-success/10 rounded-lg">
                      <Car className="w-5 h-5 text-accent-success" />
                    </div>
                        <div>
                      <p className="text-body-sm text-dark-text-muted">Total Vehicles</p>
                      <p className="text-body-md font-medium text-dark-text-primary">{auction.vehicleCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>

              {/* Auction Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-dark-bg-quaternary rounded-lg border border-dark-border p-6">
                  <h3 className="text-h3 font-heading text-dark-text-primary mb-4">Auction Information</h3>
                      <div className="space-y-3">
                        <div>
                      <p className="text-body-sm text-dark-text-muted">Description</p>
                      <p className="text-body-md text-dark-text-primary">{auction.description}</p>
                        </div>
                        <div>
                      <p className="text-body-sm text-dark-text-muted">Start Time</p>
                      <p className="text-body-md text-dark-text-primary">
                        {new Date(auction.startTimeUtc).toLocaleString()}
                          </p>
                        </div>
                        <div>
                      <p className="text-body-sm text-dark-text-muted">End Time</p>
                      <p className="text-body-md text-dark-text-primary">
                        {new Date(auction.endTimeUtc).toLocaleString()}
                      </p>
                              </div>
                      </div>
                    </div>

                <div className="bg-dark-bg-quaternary rounded-lg border border-dark-border p-6">
                  <h3 className="text-h3 font-heading text-dark-text-primary mb-4">Statistics</h3>
                  {statistics ? (
                      <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-body-sm text-dark-text-muted">Total Revenue</span>
                        <span className="text-body-md font-medium text-accent-success">
                          ${statistics.totalRevenue?.toLocaleString() || '0'}
                          </span>
                        </div>
                      <div className="flex justify-between">
                        <span className="text-body-sm text-dark-text-muted">Average Bid</span>
                        <span className="text-body-md font-medium text-dark-text-primary">
                          ${statistics.averageBid?.toLocaleString() || '0'}
                          </span>
                        </div>
                      <div className="flex justify-between">
                        <span className="text-body-sm text-dark-text-muted">Highest Bid</span>
                        <span className="text-body-md font-medium text-dark-text-primary">
                          ${statistics.highestBid?.toLocaleString() || '0'}
                          </span>
                        </div>
                      <div className="flex justify-between">
                        <span className="text-body-sm text-dark-text-muted">Total Bids</span>
                        <span className="text-body-md font-medium text-dark-text-primary">
                          {statistics.totalBids}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-body-sm text-dark-text-muted">No statistics available</p>
                  )}
                    </div>
                  </div>
                </div>
              )}

          {activeTab === 'vehicles' && (
            <div className="space-y-6">
                  <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="text-h3 font-heading text-dark-text-primary">Vehicles</h3>
                  {refreshingVehicles && (
                    <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />
                  )}
                </div>
                <Button icon={Plus} onClick={() => setShowAddVehicleModal(true)}>
                      Add Vehicle
                </Button>
                  </div>

              {vehiclesLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-accent-primary animate-spin mx-auto mb-4" />
                  <p className="text-body-md text-dark-text-secondary">Loading vehicles...</p>
                    </div>
              ) : enrichedVehicles && enrichedVehicles.length > 0 ? (
                <div className="space-y-3">
                  {enrichedVehicles.map((enrichedVehicle) => (
                    <div key={enrichedVehicle.auctionCarData.id} className="bg-dark-bg-quaternary rounded-lg border border-dark-border p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-accent-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-body-md font-bold text-accent-primary">
                              {enrichedVehicle.auctionCarData.lotNumber || 'N/A'}
                            </span>
                          </div>
                          <div>
                            {enrichedVehicle.isLoading ? (
                              <div className="space-y-2">
                                <div className="h-4 bg-dark-bg-tertiary rounded animate-pulse w-48"></div>
                                <div className="h-3 bg-dark-bg-tertiary rounded animate-pulse w-32"></div>
                              </div>
                            ) : enrichedVehicle.error ? (
                              <div>
                                <h4 className="text-body-md font-medium text-accent-error">
                                  Error loading vehicle details
                                </h4>
                                <p className="text-body-sm text-dark-text-muted">
                                  {enrichedVehicle.error}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <h4 className="text-body-md font-medium text-dark-text-primary">
                                  {enrichedVehicle.carData?.year || 'N/A'} {enrichedVehicle.carData?.make || 'Unknown'} {enrichedVehicle.carData?.model || 'Vehicle'}
                                </h4>
                                <p className="text-body-sm text-dark-text-muted">
                                  VIN: {enrichedVehicle.carData?.vin || 'N/A'}
                                </p>
                                {enrichedVehicle.carData?.estimatedRetailValue && (
                                  <p className="text-body-xs text-accent-success">
                                    Est. Value: ${enrichedVehicle.carData.estimatedRetailValue.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-body-md font-medium text-dark-text-primary">
                            ${enrichedVehicle.auctionCarData.currentBid || enrichedVehicle.auctionCarData.startingBid || '0'}
                          </p>
                          <p className="text-body-sm text-dark-text-muted">
                            Reserve: ${enrichedVehicle.auctionCarData.reservePrice || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Car className="w-12 h-12 text-dark-text-muted mx-auto mb-4" />
                  <h3 className="text-h3 font-heading text-dark-text-primary mb-2">No vehicles assigned</h3>
                  <p className="text-body-md text-dark-text-secondary mb-6">
                    Add vehicles to this auction to get started.
                  </p>
                  <Button icon={Plus} onClick={() => setShowAddVehicleModal(true)}>
                    Add Vehicle
                  </Button>
                    </div>
                  )}
                </div>
              )}

          {activeTab === 'controls' && (
                <div className="space-y-6">
              <h3 className="text-h3 font-heading text-dark-text-primary">Auction Controls</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="primary"
                  icon={Play}
                  onClick={handleStartAuction}
                  disabled={!canStartAuction || actionLoading}
                  loading={actionLoading}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <Play className="w-6 h-6" />
                  <span>Start Auction</span>
                </Button>

                <Button
                  variant="secondary"
                  icon={Square}
                  onClick={handleEndAuction}
                  disabled={!canEndAuction || actionLoading}
                  loading={actionLoading}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <Square className="w-6 h-6" />
                  <span>End Auction</span>
                </Button>

                <Button
                  variant="secondary"
                  icon={XCircle}
                  onClick={handleCancelAuction}
                  disabled={!canCancelAuction || actionLoading}
                  loading={actionLoading}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <XCircle className="w-6 h-6" />
                  <span>Cancel Auction</span>
                </Button>
                        </div>

              <div className="bg-dark-bg-quaternary rounded-lg border border-dark-border p-4">
                <h4 className="text-body-md font-medium text-dark-text-primary mb-3">Status Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-body-sm text-dark-text-muted">Current Status</span>
                    <Badge variant={getStatusBadgeVariant(auction.status)} size="sm">
                      {auction.status}
                    </Badge>
                        </div>
                  <div className="flex justify-between">
                    <span className="text-body-sm text-dark-text-muted">Can Start</span>
                    <span className={`text-body-sm ${canStartAuction ? 'text-accent-success' : 'text-dark-text-muted'}`}>
                      {canStartAuction ? 'Yes' : 'No'}
                    </span>
                      </div>
                  <div className="flex justify-between">
                    <span className="text-body-sm text-dark-text-muted">Can End</span>
                    <span className={`text-body-sm ${canEndAuction ? 'text-accent-success' : 'text-dark-text-muted'}`}>
                      {canEndAuction ? 'Yes' : 'No'}
                    </span>
                        </div>
                  <div className="flex justify-between">
                    <span className="text-body-sm text-dark-text-muted">Can Cancel</span>
                    <span className={`text-body-sm ${canCancelAuction ? 'text-accent-success' : 'text-dark-text-muted'}`}>
                      {canCancelAuction ? 'Yes' : 'No'}
                    </span>
                      </div>
                        </div>
                  </div>
                </div>
              )}
            </div>
                  </div>

        {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <AddVehicleModal
          auctionId={auctionId}
          onClose={() => setShowAddVehicleModal(false)}
          onSuccess={handleAddVehicleSuccess}
        />
      )}
    </div>
  )
}