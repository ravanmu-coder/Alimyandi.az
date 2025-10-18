import { useState, useEffect, useCallback } from 'react'
import { 
  Grid3X3, 
  List, 
  Eye,
  Car,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { Button } from '../components/common/Button'
import { Pagination } from '../components/common/Pagination'
import { VehicleCard } from '../components/VehicleCard'
import { VehicleTableRow } from '../components/VehicleTableRow'
import { VehicleDetailModal } from '../components/VehicleDetailModal'
import { InventoryFilterPanel } from '../components/InventoryFilterPanel'
import { apiClient } from '../services/apiClient'
import { useEnums, getEnumLabel, getEnumBadgeClasses } from '../../services/enumService'

interface Vehicle {
  id: string
  vin: string
  make: string
  model: string
  year: number
  mileage: number // DTO-da Odometer -> Mileage
  mileageUnit: string
  price: number
  currency: string
  bodyStyle?: string
  color?: string
  hasKeys: boolean
  titleState?: string
  estimatedRetailValue?: number

  // ===== ENUM SAHƏLƏRİ (Number olmalıdır!) =====
  fuelType: number           // C# enum FuelType
  damageType: number         // C# enum DamageType
  transmission: number       // C# enum Transmission
  driveTrain: number         // C# enum DriveTrain
  carCondition: number       // C# enum CarCondition
  titleType: number          // C# enum TitleType
  secondaryDamage?: number   // C# enum DamageType? (nullable)

  // Media
  imagePath?: string // DTO-dan gələn əsas şəkil
  imageUrls?: string[] // DTO-da Images -> imageUrls

  // Owner & Location
  ownerId: string
  ownerName: string
  locationId?: string
  locationName: string

  // Status & Dates
  status: string
  createdAt: string
  updatedAtUtc?: string

  // Auction related
  auctionId?: string
  auctionName?: string
  lotNumber?: number
  reservePrice?: number
  startPrice?: number
}

interface Filters {
  carCondition: string
  damageType: string
  fuelType: string
  transmission: string
  driveTrain: string
  titleType: string
  yearFrom: string
  yearTo: string
  mileageFrom: string
  mileageTo: string
  make: string
  model: string
  location: string
  seller: string
}

export function InventoryPage() {
  const { enums } = useEnums()
  
  // Core state management
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // View and UI state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  
  // Search and filter state (UI only - no automatic API calls)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Filters>({
    carCondition: '',
    damageType: '',
    fuelType: '',
    transmission: '',
    driveTrain: '',
    titleType: '',
    yearFrom: '',
    yearTo: '',
    mileageFrom: '',
    mileageTo: '',
    make: '',
    model: '',
    location: '',
    seller: ''
  })
  
  // CRITICAL: Manual refresh trigger to prevent infinite loops
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Modal state
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  const pageSize = 12

  // Data loading function - only triggered by refreshKey changes
  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading vehicles with params:', {
        page: currentPage,
        pageSize: pageSize,
        view: viewMode,
        search: searchTerm,
        filters
      })
      
      const response = await apiClient.getVehicles({
        page: currentPage,
        pageSize: pageSize,
        view: viewMode,
        search: searchTerm,
        yearFrom: filters.yearFrom ? parseInt(filters.yearFrom) : undefined,
        yearTo: filters.yearTo ? parseInt(filters.yearTo) : undefined,
        locationId: filters.location,
        sortBy: 'createdAt',
        sortDir: 'desc'
      })

      console.log('API response received:', response)

      // Transform API data to our Vehicle interface - KEEP ENUM VALUES AS NUMBERS!
      const transformedVehicles: Vehicle[] = response.items.map((car: any) => {
        const processedImageUrls = apiClient.processImageUrls(car)
        const primaryImageUrl = processedImageUrls.length > 0 ? processedImageUrls[0] : null
        
        return {
          id: car.id,
          vin: car.vin || '',
          make: car.make || '',
          model: car.model || '',
          year: car.year || 0,
          mileage: car.odometer || car.mileage || 0, // Backend DTO field mapping
          mileageUnit: car.odometerUnit || car.mileageUnit || 'miles',
          price: car.price || 0,
          currency: car.currency || 'USD',
          bodyStyle: car.bodyStyle || car.type || '',
          color: car.color || '',
          hasKeys: car.hasKeys || false,
          titleState: car.titleState || '',
          estimatedRetailValue: car.estimatedRetailValue || 0,
          
          // ===== ENUM SAHƏLƏRİ - RƏQƏM OLARAQ SAXLA! =====
          fuelType: car.fuelType || 0,
          damageType: car.damageType || 0,
          transmission: car.transmission || 0,
          driveTrain: car.driveTrain || car.driveType || 0,
          carCondition: car.carCondition || car.condition || 0,
          titleType: car.titleType || 0,
          secondaryDamage: car.secondaryDamage || undefined,
          
          // Media
          imagePath: primaryImageUrl,
          imageUrls: processedImageUrls,
          
          // Owner & Location
          ownerId: car.ownerId || '',
          ownerName: car.ownerName || 'Unknown Owner',
          locationId: car.locationId || '',
          locationName: car.locationName || car.location?.name || 'Unknown Location',
          
          // Status & Dates
          status: car.status || 'Available',
          createdAt: car.createdAt || new Date().toISOString(),
          updatedAtUtc: car.updatedAtUtc,
          
          // Auction related
          auctionId: car.auctionId,
          auctionName: car.auctionName,
          lotNumber: car.lotNumber,
          reservePrice: car.reservePrice,
          startPrice: car.startPrice
        }
      })
      
      setVehicles(transformedVehicles)
      setTotalPages(response.totalPages)
      setTotalItems(response.totalItems)
    } catch (error) {
      console.error('Error loading vehicles:', error)
      
      if (error instanceof Error && error.message.includes('Authentication failed')) {
        setError('Authentication failed. Please login first using the Login button.')
      } else {
        setError('Failed to load vehicles')
      }
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, viewMode, searchTerm, filters])

  // CRITICAL: Only trigger data loading when refreshKey changes
  useEffect(() => {
    loadVehicles()
  }, [refreshKey]) // DİQQƏT: Asılılıq massivində YALNIZ "refreshKey" olmalıdır!

  // Manual refresh trigger
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  // Search and filter handlers (UI only)
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Apply search and filters (manual trigger)
  const handleApplyFilters = () => {
    setCurrentPage(1)
    setRefreshKey(prev => prev + 1)
  }

  // Clear filters and refresh
  const handleClearFilters = () => {
    setFilters({
      carCondition: '',
      damageType: '',
      fuelType: '',
      transmission: '',
      driveTrain: '',
      titleType: '',
      yearFrom: '',
      yearTo: '',
      mileageFrom: '',
      mileageTo: '',
      make: '',
      model: '',
      location: '',
      seller: ''
    })
    setSearchTerm('')
    setCurrentPage(1)
    setRefreshKey(prev => prev + 1)
  }

  // Page change handler
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setRefreshKey(prev => prev + 1)
  }

  // View details handler
  const handleViewDetails = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId)
    setShowDetailModal(true)
  }


  const getStatusBadgeColor = (status: string) => {
    const badgeClasses = getEnumBadgeClasses('CarCondition', status)
    return badgeClasses
  }

  const LoadingSkeleton = () => (
    <>
      {Array.from({ length: pageSize }).map((_, index) => (
        <div key={index} className="bg-dark-bg-quaternary rounded-lg border border-dark-border overflow-hidden">
          <div className="h-48 bg-dark-bg-tertiary animate-pulse"></div>
          <div className="p-4">
            <div className="h-4 bg-dark-bg-tertiary rounded animate-pulse mb-2"></div>
            <div className="h-6 bg-dark-bg-tertiary rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-dark-bg-tertiary rounded animate-pulse mb-1"></div>
            <div className="h-4 bg-dark-bg-tertiary rounded animate-pulse mb-4"></div>
            <div className="h-10 bg-dark-bg-tertiary rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </>
  )

  const TableLoadingSkeleton = () => (
    <>
      {Array.from({ length: pageSize }).map((_, index) => (
        <tr key={index}>
          <td className="px-6 py-4">
            <div className="w-16 h-12 bg-dark-bg-tertiary rounded-md animate-pulse"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-dark-bg-tertiary rounded animate-pulse"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-dark-bg-tertiary rounded animate-pulse"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-dark-bg-tertiary rounded animate-pulse"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-dark-bg-tertiary rounded animate-pulse"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-dark-bg-tertiary rounded animate-pulse"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-dark-bg-tertiary rounded animate-pulse"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-6 bg-dark-bg-tertiary rounded-full animate-pulse"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-dark-bg-tertiary rounded animate-pulse"></div>
          </td>
        </tr>
      ))}
    </>
  )

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="text-dark-text-muted mb-4">
        <Car className="w-16 h-16 mx-auto" />
      </div>
      <h3 className="text-h3 font-heading text-dark-text-primary mb-2">No vehicles found</h3>
      <p className="text-body-md text-dark-text-secondary mb-6">Try adjusting your filters to see available vehicles.</p>
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-dark-bg-primary">
      {/* Header */}
      <div className="bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">Vehicle Inventory</h1>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
              Manage your vehicle inventory ({totalItems} vehicles)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              icon={RefreshCw} 
              onClick={handleRefresh}
                className="text-gray-600 hover:text-gray-900 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
            >
              Refresh
            </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Filter Panel - Collapsible */}
        <div className="p-6 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary">
          <InventoryFilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Controls */}
          <div className="bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
                  Showing {vehicles.length} of {totalItems} vehicles
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'secondary'}
                  icon={Grid3X3}
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 dark:text-dark-text-muted dark:hover:text-dark-text-primary'}
                />
                <Button
                  variant={viewMode === 'table' ? 'primary' : 'secondary'}
                  icon={List}
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 dark:text-dark-text-muted dark:hover:text-dark-text-primary'}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="space-y-6">
                {/* Loading Header */}
                <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-1/2"></div>
                  </div>
                </div>

                {/* Loading Content */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="bg-white dark:bg-dark-bg-tertiary rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden animate-pulse">
                        {/* Image skeleton */}
                        <div className="h-48 sm:h-56 md:h-64 bg-gray-200 dark:bg-dark-bg-quaternary"></div>
                        
                        {/* Content skeleton */}
                        <div className="p-5 space-y-4">
                          {/* Title */}
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-dark-bg-quaternary rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 dark:bg-dark-bg-quaternary rounded w-1/2"></div>
                          </div>
                          
                          {/* Details grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <div className="h-3 bg-gray-200 dark:bg-dark-bg-quaternary rounded w-1/2"></div>
                              <div className="h-4 bg-gray-200 dark:bg-dark-bg-quaternary rounded w-3/4"></div>
                            </div>
                            <div className="space-y-2">
                              <div className="h-3 bg-gray-200 dark:bg-dark-bg-quaternary rounded w-1/2"></div>
                              <div className="h-4 bg-gray-200 dark:bg-dark-bg-quaternary rounded w-3/4"></div>
                            </div>
                          </div>
                          
                          {/* Meta info */}
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 dark:bg-dark-bg-quaternary rounded w-2/3"></div>
                            <div className="h-3 bg-gray-200 dark:bg-dark-bg-quaternary rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-dark-bg-quaternary rounded w-3/4"></div>
                          </div>
                          
                          {/* Button */}
                          <div className="h-10 bg-gray-200 dark:bg-dark-bg-quaternary rounded-lg"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
                    <div className="animate-pulse">
                      {/* Table header */}
                      <div className="bg-gray-50 dark:bg-dark-bg-tertiary px-6 py-3">
                        <div className="grid grid-cols-9 gap-4">
                          {Array.from({ length: 9 }).map((_, index) => (
                            <div key={index} className="h-4 bg-gray-200 dark:bg-dark-bg-quaternary rounded"></div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Table rows */}
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="px-6 py-4 border-t border-gray-200 dark:border-dark-border">
                          <div className="grid grid-cols-9 gap-4">
                            <div className="h-12 bg-gray-200 dark:bg-dark-bg-quaternary rounded"></div>
                            <div className="h-4 bg-gray-200 dark:bg-dark-bg-quaternary rounded"></div>
                            <div className="h-4 bg-gray-200 dark:bg-dark-bg-quaternary rounded"></div>
                            <div className="h-4 bg-gray-200 dark:bg-dark-bg-quaternary rounded"></div>
                            <div className="h-4 bg-gray-200 dark:bg-dark-bg-quaternary rounded"></div>
                            <div className="h-4 bg-gray-200 dark:bg-dark-bg-quaternary rounded"></div>
                            <div className="h-4 bg-gray-200 dark:bg-dark-bg-quaternary rounded"></div>
                            <div className="h-6 bg-gray-200 dark:bg-dark-bg-quaternary rounded-full w-16"></div>
                            <div className="h-8 bg-gray-200 dark:bg-dark-bg-quaternary rounded w-20"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">Error loading vehicles</h3>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">{error}</p>
                <Button onClick={handleRefresh} icon={RefreshCw} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Try Again
                </Button>
              </div>
            ) : vehicles.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {vehicles.map((vehicle) => (
                      <VehicleCard 
                        key={vehicle.id} 
                        vehicle={vehicle} 
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-dark-bg-quaternary rounded-lg border border-dark-border overflow-hidden">
                    <table className="min-w-full divide-y divide-dark-border">
                      <thead className="bg-dark-bg-tertiary">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-muted uppercase tracking-wider">Image</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-muted uppercase tracking-wider">Sale Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-muted uppercase tracking-wider">Sale Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-muted uppercase tracking-wider">Region</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-muted uppercase tracking-wider">Highlights</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-muted uppercase tracking-wider">Current Sale</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-muted uppercase tracking-wider">Next Sale</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-muted uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-muted uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-dark-bg-quaternary divide-y divide-dark-border">
                        {vehicles.map((vehicle) => (
                          <VehicleTableRow 
                            key={vehicle.id} 
                            vehicle={vehicle} 
                            onViewDetails={handleViewDetails}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      isLoading={loading}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>


      {/* Vehicle Detail Modal */}
      {showDetailModal && selectedVehicleId && (
        <VehicleDetailModal
          vehicleId={selectedVehicleId}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedVehicleId(null)
          }}
        />
      )}
    </div>
  )
}