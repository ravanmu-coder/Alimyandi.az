import { useState, useEffect } from 'react'
import { Search, Filter, Loader2, AlertCircle, Plus, Calendar, MapPin, TrendingUp, RefreshCw } from 'lucide-react'
import { AuctionListItem } from './AuctionListItem'
import { Pagination } from './common/Pagination'
import { Button } from './common/Button'
import { apiClient } from '../services/apiClient'
import { useToast } from './common/Toast'
import { useEnums } from '../../services/enumService'

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

interface AuctionListProps {
  onViewDetails: (auctionId: string) => void
  onEditAuction: (auctionId: string) => void
  onNewAuction: () => void
  onRefresh: () => void
  onDeleteAuction: (auctionId: string, auctionName: string) => void
  onAddVehicles: (auctionId: string) => void
  refreshTrigger?: number
}

export function AuctionList({ onViewDetails, onEditAuction, onNewAuction, onRefresh, onDeleteAuction, onAddVehicles, refreshTrigger }: AuctionListProps) {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const { success, error: showError } = useToast()
  const { enums } = useEnums()

  const pageSize = 8

  const loadAuctions = async (page: number = currentPage, search: string = searchTerm, status: string = statusFilter) => {
    try {
      setLoading(true)
      setError(null)

      const params: any = {
        page,
        limit: pageSize
      }

      if (search.trim()) {
        params.search = search.trim()
      }

      if (status) {
        params.status = status
      }

      const response = await apiClient.getAuctions(params)
      
      // Handle different response formats
      let auctionsData: Auction[] = []
      let totalCount = 0

      if (Array.isArray(response)) {
        auctionsData = response
        totalCount = response.length
      } else if (response && Array.isArray(response.items)) {
        auctionsData = response.items
        totalCount = response.totalItems || response.totalCount || response.items.length
      } else if (response && Array.isArray(response.data)) {
        auctionsData = response.data
        totalCount = response.totalItems || response.totalCount || response.data.length
      }

      setAuctions(auctionsData)
      setTotalPages(Math.ceil(totalCount / pageSize))
      setTotalItems(totalCount)
    } catch (err) {
      console.error('Failed to load auctions:', err)
      setError('Failed to load auctions')
      showError('Failed to load auctions')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
    loadAuctions(1, value, statusFilter)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
    loadAuctions(1, searchTerm, status)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadAuctions(page, searchTerm, statusFilter)
  }

  const handleRefresh = () => {
    loadAuctions(currentPage, searchTerm, statusFilter)
    onRefresh()
  }

  useEffect(() => {
    loadAuctions()
  }, [])

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadAuctions(currentPage, searchTerm, statusFilter)
    }
  }, [refreshTrigger])

  const statusOptions = [
    { value: '', label: 'All Statuses', count: totalItems },
    { value: 'Draft', label: 'Draft', count: auctions.filter(a => a.status === 'Draft').length },
    { value: 'Scheduled', label: 'Scheduled', count: auctions.filter(a => a.status === 'Scheduled').length },
    { value: 'Ready', label: 'Ready', count: auctions.filter(a => a.status === 'Ready').length },
    { value: 'Running', label: 'Running', count: auctions.filter(a => a.status === 'Running').length },
    { value: 'Ended', label: 'Ended', count: auctions.filter(a => a.status === 'Ended').length },
    { value: 'Cancelled', label: 'Cancelled', count: auctions.filter(a => a.status === 'Cancelled').length }
  ]

  const getQuickStats = () => {
    const liveCount = auctions.filter(a => a.isLive || a.status === 'Running').length
    const upcomingCount = auctions.filter(a => new Date(a.startTimeUtc) > new Date()).length
    const totalRevenue = auctions.reduce((sum, a) => sum + (a.totalRevenue || 0), 0)
    
    return { liveCount, upcomingCount, totalRevenue }
  }

  const stats = getQuickStats()

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-dark-bg-primary">
      {/* Header */}
      <div className="bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">Auctions</h1>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">Manage your auction lifecycle</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="secondary" 
                icon={RefreshCw} 
                onClick={handleRefresh}
                className="text-gray-600 hover:text-gray-900 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
              >
                Refresh
              </Button>
              <Button 
                icon={Plus}
                onClick={onNewAuction}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                New Auction
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Auctions</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Live Now</p>
                  <p className="text-2xl font-bold">{stats.liveCount}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Upcoming</p>
                  <p className="text-2xl font-bold">{stats.upcomingCount}</p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search auctions by name or ID..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-4 py-3 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 min-w-[160px]"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
              
              <Button
                variant="secondary"
                icon={Filter}
                onClick={() => setShowFilters(!showFilters)}
                className={`${showFilters ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}`}
              >
                More Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-dark-bg-tertiary rounded-xl border border-gray-200 dark:border-dark-border p-6 animate-pulse">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 dark:bg-dark-bg-quaternary rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-dark-bg-quaternary rounded w-1/2"></div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-dark-bg-quaternary rounded-full w-20"></div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-dark-bg-quaternary rounded w-full"></div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-dark-bg-quaternary rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 dark:bg-dark-bg-quaternary rounded w-3/4 mb-1"></div>
                          <div className="h-4 bg-gray-200 dark:bg-dark-bg-quaternary rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-2">Error Loading Auctions</h3>
              <p className="text-gray-600 dark:text-dark-text-secondary mb-6 max-w-md">{error}</p>
              <Button onClick={handleRefresh} icon={RefreshCw} className="bg-red-600 hover:bg-red-700 text-white">
                Try Again
              </Button>
            </div>
          </div>
        ) : auctions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {auctions.map((auction) => (
              <AuctionListItem
                key={auction.id}
                auction={auction}
                onViewDetails={() => onViewDetails(auction.id)}
                onEditAuction={() => onEditAuction(auction.id)}
                onDeleteAuction={() => onDeleteAuction(auction.id, auction.name)}
                onAddVehicles={() => onAddVehicles(auction.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-dark-bg-quaternary rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-gray-400 dark:text-dark-text-muted" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-2">No Auctions Found</h3>
              <p className="text-gray-600 dark:text-dark-text-secondary mb-6 max-w-md">
                {searchTerm || statusFilter 
                  ? 'Try adjusting your search or filter criteria to find auctions'
                  : 'No auctions have been created yet. Create your first auction to get started.'
                }
              </p>
              {!searchTerm && !statusFilter && (
                <Button 
                  onClick={onNewAuction} 
                  icon={Plus}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create First Auction
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && auctions.length > 0 && (
        <div className="bg-white dark:bg-dark-bg-secondary border-t border-gray-200 dark:border-dark-border px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-dark-text-muted">
              Showing {auctions.length} of {totalItems} auctions
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={loading}
            />
          </div>
        </div>
      )}
    </div>
  )
}
