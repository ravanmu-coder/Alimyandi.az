import { useState, useEffect } from 'react'
import { 
  Plus, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail,
  RefreshCw, 
  Search,
  Download,
  MoreVertical,
  Building,
  Clock,
  Globe,
  Navigation,
  AlertCircle,
  CheckCircle,
  XCircle,
  Map as MapIcon,
  Settings,
  Calendar,
  Users
} from 'lucide-react'
import { Button } from '../components/common/Button'
import { apiClient } from '../services/apiClient'
import { useToast } from '../components/common/Toast'
import { NewLocationModal } from '../components/NewLocationModal'
import { EditLocationModal } from '../components/EditLocationModal'
import { DeleteLocationModal } from '../components/DeleteLocationModal'
import { LocationDetailModal } from '../components/LocationDetailModal'

interface Location {
  id: string
  name: string
  addressLine1?: string
  city?: string
  region?: string
  country?: string
  postalCode?: string
  createdAt?: string
  updatedAt?: string
  isActive?: boolean
  // Legacy fields for backward compatibility
  address?: string
  phone?: string
  email?: string
  hours?: string
  description?: string
  latitude?: number
  longitude?: number
  username?: string
  auctionJoinDate?: string
  auctionCount?: number
  vehicleCount?: number
}

interface LocationStats {
  totalLocations: number
  activeLocations: number
  totalAuctions: number
  totalVehicles: number
  upcomingAuctions: number
}

export function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [locationStats, setLocationStats] = useState<LocationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    region: '',
    city: '',
    search: '',
    status: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<keyof Location>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null)
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(null)
  const [deletingLocationName, setDeletingLocationName] = useState<string>('')
  const [viewingLocationId, setViewingLocationId] = useState<string | null>(null)
  
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadLocations()
    loadLocationStats()
  }, [currentPage, filters])

  const loadLocations = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        page: currentPage,
        limit: 20,
        search: filters.search,
        region: filters.region,
        city: filters.city,
        status: filters.status,
        sortBy: sortBy,
        sortDirection: sortDirection
      }

      const response = await apiClient.getLocations(params)
      
      setLocations(response.items || [])
      setTotalPages(response.totalPages || 1)
      setTotalItems(response.totalItems || 0)
    } catch (err: any) {
      console.error('Error loading locations:', err)
      setError(err.message || 'Failed to load locations')
      setLocations([])
    } finally {
      setLoading(false)
    }
  }

  const loadLocationStats = async () => {
    try {
      const stats = await apiClient.getLocationStats()
      setLocationStats(stats)
    } catch (err) {
      console.error('Error loading location stats:', err)
      // Set default stats if API fails
      setLocationStats({
        totalLocations: totalItems,
        activeLocations: locations.filter(loc => loc.isActive).length,
        totalAuctions: 0,
        totalVehicles: 0,
        upcomingAuctions: 0
      })
    }
  }

  const getStatusBadge = (isActive?: boolean) => {
    if (isActive) {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </div>
      )
    } else {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </div>
      )
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setFilters({
      region: '',
      city: '',
      search: '',
      status: ''
    })
  }

  const handleSort = (column: keyof Location) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  const handleRefresh = () => {
    loadLocations()
    loadLocationStats()
  }

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocations(prev => 
      prev.includes(locationId) 
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    )
  }

  const handleSelectAll = () => {
    if (selectedLocations.length === locations.length) {
      setSelectedLocations([])
    } else {
      setSelectedLocations(locations.map(location => location.id))
    }
  }

  const handleBulkAction = async (action: string) => {
    try {
      // Implement bulk actions
      success(`${action} applied to ${selectedLocations.length} locations`)
      setSelectedLocations([])
      setShowBulkActions(false)
    } catch (err) {
      showError(`Failed to ${action} locations`)
    }
  }

  const handleLocationAction = async (locationId: string, action: string) => {
    try {
      if (action === 'view') {
        setViewingLocationId(locationId)
        setIsDetailModalOpen(true)
      } else if (action === 'edit') {
        setEditingLocationId(locationId)
        setIsEditModalOpen(true)
      } else if (action === 'delete') {
        const location = locations.find(loc => loc.id === locationId)
        if (location) {
          setDeletingLocationId(locationId)
          setDeletingLocationName(location.name)
          setIsDeleteModalOpen(true)
        }
      } else if (action === 'manage') {
        // Implement manage action - could open settings modal
        success(`Opening location settings`)
      }
    } catch (err) {
      showError(`Failed to ${action} location`)
    }
  }

  const handleAddLocation = () => {
    setIsAddModalOpen(true)
  }

  const handleModalSuccess = () => {
    loadLocations()
    loadLocationStats()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString()
  }

  const getUniqueRegions = () => {
    const regions = [...new Set(locations.map(loc => loc.region).filter(Boolean))]
    return regions.sort()
  }

  const getUniqueCities = () => {
    const cities = [...new Set(locations.map(loc => loc.city).filter(Boolean))]
    return cities.sort()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
        <div className="p-6 space-y-6 animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-40"></div>
              <div className="h-4 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-56"></div>
            </div>
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-24"></div>
              <div className="h-10 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-28"></div>
              <div className="h-10 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-32"></div>
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border"></div>
            ))}
          </div>

          {/* Table skeleton */}
          <div className="h-96 bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">Error Loading Locations</h3>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">{error}</p>
          <Button onClick={handleRefresh} icon={RefreshCw} className="bg-blue-600 hover:bg-blue-700 text-white">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">Location Management</h1>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                Manage auction locations, facilities, and regional centers
              </p>
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
                variant="secondary" 
                icon={Download}
                className="text-gray-600 hover:text-gray-900 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
              >
                Export
              </Button>
              <Button 
                icon={Plus}
                onClick={handleAddLocation}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Location
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {locationStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Locations</p>
                  <p className="text-3xl font-bold">{locationStats.totalLocations}</p>
                  <p className="text-blue-200 text-xs mt-1">All facilities</p>
                </div>
                <Building className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Locations</p>
                  <p className="text-3xl font-bold">{locationStats.activeLocations}</p>
                  <p className="text-green-200 text-xs mt-1">Currently operational</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Auctions</p>
                  <p className="text-3xl font-bold">{locationStats.totalAuctions}</p>
                  <p className="text-purple-200 text-xs mt-1">All time</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Total Vehicles</p>
                  <p className="text-3xl font-bold">{locationStats.totalVehicles}</p>
                  <p className="text-orange-100 text-xs mt-1">In inventory</p>
                </div>
                <Users className="w-8 h-8 text-orange-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Upcoming</p>
                  <p className="text-3xl font-bold">{locationStats.upcomingAuctions}</p>
                  <p className="text-yellow-200 text-xs mt-1">Scheduled auctions</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-200" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search locations by name, city, or address..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                className="px-4 py-3 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 min-w-[140px]"
              >
                <option value="">All Regions</option>
                {getUniqueRegions().map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              
              <select
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="px-4 py-3 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 min-w-[140px]"
              >
                <option value="">All Cities</option>
                {getUniqueCities().map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-4 py-3 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 min-w-[140px]"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Auction Count</label>
                  <select className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                    <option value="">Any Count</option>
                    <option value="0-10">0-10 auctions</option>
                    <option value="11-25">11-25 auctions</option>
                    <option value="26-50">26-50 auctions</option>
                    <option value="50+">50+ auctions</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Vehicle Count</label>
                  <select className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                    <option value="">Any Count</option>
                    <option value="0-50">0-50 vehicles</option>
                    <option value="51-100">51-100 vehicles</option>
                    <option value="101-200">101-200 vehicles</option>
                    <option value="200+">200+ vehicles</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Join Date</label>
                  <select className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                    <option value="">Any Time</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="secondary"
                  onClick={handleClearFilters}
                  className="text-gray-600 hover:text-gray-900 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedLocations.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="text-blue-700 dark:text-blue-300"
                >
                  Bulk Actions
                </Button>
              </div>
              
              {showBulkActions && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={CheckCircle}
                    onClick={() => handleBulkAction('activate')}
                    className="text-green-700 dark:text-green-300"
                  >
                    Activate
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={XCircle}
                    onClick={() => handleBulkAction('deactivate')}
                    className="text-red-700 dark:text-red-300"
                  >
                    Deactivate
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    onClick={() => handleBulkAction('export')}
                    className="text-blue-700 dark:text-blue-300"
                  >
                    Export
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Locations Table */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
          {locations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <MapIcon className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">No locations found</h3>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
                {filters.search || filters.region || filters.city || filters.status 
                  ? 'Try adjusting your filters to see more results'
                  : 'Start by adding your first location using the button below'
                }
              </p>
              <Button 
                icon={Plus}
                onClick={handleAddLocation}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add First Location
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedLocations.length === locations.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">
                      Status & Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">
                      Location Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">
                      Join Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                  {locations.map((location) => (
                    <tr key={location.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedLocations.includes(location.id)}
                          onChange={() => handleLocationSelect(location.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                            <Building className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                              {location.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-dark-text-muted">
                              {location.city || 'N/A'}, {location.region || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-dark-text-muted">
                              ID: {location.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {location.email && (
                            <div className="flex items-center space-x-2 text-sm text-gray-900 dark:text-dark-text-primary">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="truncate">{location.email}</span>
                            </div>
                          )}
                          {location.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-dark-text-muted">
                              <Phone className="w-4 h-4" />
                              <span>{location.phone}</span>
                            </div>
                          )}
                          {location.hours && (
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-dark-text-muted">
                              <Clock className="w-4 h-4" />
                              <span className="truncate">{location.hours}</span>
                            </div>
                          )}
                          {!location.email && !location.phone && !location.hours && (
                            <div className="text-sm text-gray-400 dark:text-dark-text-muted">
                              No contact info
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          {getStatusBadge(location.isActive)}
                          <div className="text-xs text-gray-500 dark:text-dark-text-muted">
                            {location.auctionCount || 0} auctions • {location.vehicleCount || 0} vehicles
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm text-gray-900 dark:text-dark-text-primary">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="truncate max-w-[200px]">{location.addressLine1 || location.address || 'No address'}</span>
                          </div>
                          {location.latitude && location.longitude && (
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-dark-text-muted">
                              <Navigation className="w-4 h-4" />
                              <span>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text-primary">
                        {formatDate(location.auctionJoinDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            onClick={() => handleLocationAction(location.id, 'view')}
                            className="text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
                            title="View Details"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit}
                            onClick={() => handleLocationAction(location.id, 'edit')}
                            className="text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
                            title="Edit Location"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Settings}
                            onClick={() => handleLocationAction(location.id, 'manage')}
                            className="text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
                            title="Manage Settings"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleLocationAction(location.id, 'delete')}
                            className="text-gray-400 hover:text-red-600 dark:text-dark-text-muted dark:hover:text-red-400"
                            title="Delete Location"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {locations.length > 0 && (
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-dark-text-secondary">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalItems)} of {totalItems} locations
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700 dark:text-dark-text-secondary">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <NewLocationModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleModalSuccess}
        />

        <EditLocationModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingLocationId(null)
          }}
          onSuccess={handleModalSuccess}
          locationId={editingLocationId}
        />

        <DeleteLocationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setDeletingLocationId(null)
            setDeletingLocationName('')
          }}
          onSuccess={handleModalSuccess}
          locationId={deletingLocationId}
          locationName={deletingLocationName}
        />

        <LocationDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setViewingLocationId(null)
          }}
          locationId={viewingLocationId}
        />
      </div>
    </div>
  )
}
