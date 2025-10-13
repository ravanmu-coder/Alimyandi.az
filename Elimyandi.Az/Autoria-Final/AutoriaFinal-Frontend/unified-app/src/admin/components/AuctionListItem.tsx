import { Calendar, MapPin, Car, Clock, Eye, Edit, Trash2, MoreVertical, Play, Pause, Square, Plus, Users, CheckCircle, AlertCircle, DollarSign } from 'lucide-react'
import { Badge } from './common/Badge'
import { Button } from './common/Button'
import { useEnums, getEnumBadgeClasses } from '../../services/enumService'
import { useState, useEffect, useRef } from 'react'

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
  isLive?: boolean
  currentCarLotNumber?: string
  totalBids?: number
  activeBidders?: number
}

interface AuctionListItemProps {
  auction: Auction
  onViewDetails: () => void
  onEditAuction: () => void
  onDeleteAuction: () => void
  onAddVehicles: () => void
}

export function AuctionListItem({ auction, onViewDetails, onEditAuction, onDeleteAuction, onAddVehicles }: AuctionListItemProps) {
  const { enums } = useEnums()
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false)
      }
    }

    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActionsMenu])

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return <AlertCircle className="w-4 h-4" />
      case 'scheduled': return <Clock className="w-4 h-4" />
      case 'ready': return <CheckCircle className="w-4 h-4" />
      case 'running': return <Play className="w-4 h-4" />
      case 'ended': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'text-gray-500 bg-gray-100'
      case 'scheduled': return 'text-yellow-700 bg-yellow-100'
      case 'ready': return 'text-blue-700 bg-blue-100'
      case 'running': return 'text-green-700 bg-green-100'
      case 'ended': return 'text-purple-700 bg-purple-100'
      case 'cancelled': return 'text-red-700 bg-red-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date()
    const end = new Date(endTime)
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Ended'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`
    } else {
      return `${minutes}m left`
    }
  }

  const getContextualActions = () => {
    const actions = []
    
    switch (auction.status.toLowerCase()) {
      case 'draft':
        actions.push(
          <Button
            key="edit"
            variant="secondary"
            icon={Edit}
            onClick={(e) => {
              e.stopPropagation()
              onEditAuction()
            }}
            size="sm"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            Edit
          </Button>
        )
        break
      case 'scheduled':
        actions.push(
          <Button
            key="edit"
            variant="secondary"
            icon={Edit}
            onClick={(e) => {
              e.stopPropagation()
              onEditAuction()
            }}
            size="sm"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            Edit
          </Button>,
          <Button
            key="start"
            variant="primary"
            icon={Play}
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Implement start auction functionality
            }}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Start
          </Button>
        )
        break
      case 'running':
        actions.push(
          <Button
            key="pause"
            variant="secondary"
            icon={Pause}
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Implement pause auction functionality
            }}
            size="sm"
            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
          >
            Pause
          </Button>,
          <Button
            key="end"
            variant="secondary"
            icon={Square}
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Implement end auction functionality
            }}
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            End
          </Button>
        )
        break
      case 'ended':
        actions.push(
          <Button
            key="view"
            variant="secondary"
            icon={Eye}
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails()
            }}
            size="sm"
            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
          >
            View Results
          </Button>
        )
        break
    }
    
    return actions
  }

  const isUpcoming = new Date(auction.startTimeUtc) > new Date()
  const isLive = auction.isLive || auction.status.toLowerCase() === 'running'
  const isEnded = new Date(auction.endTimeUtc) < new Date()

  return (
    <div
      className={`group bg-white dark:bg-dark-bg-tertiary rounded-xl border border-gray-200 dark:border-dark-border p-6 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-dark-lg hover:-translate-y-1 ${
        isLive ? 'ring-2 ring-green-500 border-green-500 bg-green-50 dark:bg-green-900/20' : ''
      }`}
    >
      <div className="space-y-4">
        {/* Header with name and status */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary truncate">
              {auction.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-1">
              ID: {auction.id.slice(0, 8)}...
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Status Badge with Icon */}
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(auction.status)}`}>
              {getStatusIcon(auction.status)}
              <span className="ml-1.5">{auction.status}</span>
            </div>
            
            {/* Live Indicator */}
            {isLive && (
              <div className="flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></div>
                LIVE
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {getContextualActions()}
              
              {/* More Actions Menu */}
              <div className="relative" ref={menuRef}>
                <Button
                  variant="ghost"
                  icon={MoreVertical}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowActionsMenu(!showActionsMenu)
                  }}
                  size="sm"
                  className="text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
                  title="More Actions"
                />
                
                {showActionsMenu && (
                  <div className="absolute right-0 top-8 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg z-10 min-w-[160px]">
                    <div className="py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewDetails()
                          setShowActionsMenu(false)
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditAuction()
                          setShowActionsMenu(false)
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Auction
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddVehicles()
                          setShowActionsMenu(false)
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Vehicles
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteAuction()
                          setShowActionsMenu(false)
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {auction.description && (
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary line-clamp-2">
            {auction.description}
          </p>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Start Time */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wide">Start Time</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary">
                {formatDateTime(auction.startTimeUtc)}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wide">Location</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary truncate">
                {auction.locationName || 'Loading...'}
              </p>
            </div>
          </div>

          {/* Vehicle Count */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wide">Vehicles</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary">
                {auction.vehicleCount}
              </p>
            </div>
          </div>

          {/* Duration/Time Left */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wide">
                {isEnded ? 'Duration' : isLive ? 'Time Left' : 'Duration'}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary">
                {isEnded 
                  ? `${Math.ceil((new Date(auction.endTimeUtc).getTime() - new Date(auction.startTimeUtc).getTime()) / (1000 * 60 * 60))}h`
                  : isLive 
                    ? formatTimeRemaining(auction.endTimeUtc)
                    : `${Math.ceil((new Date(auction.endTimeUtc).getTime() - new Date(auction.startTimeUtc).getTime()) / (1000 * 60 * 60))}h`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Live Auction Info */}
        {isLive && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {auction.currentCarLotNumber && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Current Lot:</span>
                    <span className="text-sm font-bold text-green-900 dark:text-green-100">{auction.currentCarLotNumber}</span>
                  </div>
                )}
                {auction.totalBids && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Total Bids:</span>
                    <span className="text-sm font-bold text-green-900 dark:text-green-100">{auction.totalBids}</span>
                  </div>
                )}
                {auction.activeBidders && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-bold text-green-900 dark:text-green-100">{auction.activeBidders}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Revenue Footer */}
        {auction.totalRevenue && auction.totalRevenue > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-dark-text-muted">Total Revenue</span>
              </div>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                ${auction.totalRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
