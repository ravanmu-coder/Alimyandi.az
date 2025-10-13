import { useState, useEffect } from 'react'
import { 
  X, 
  Car, 
  Calendar,
  MapPin, 
  User, 
  Tag,
  DollarSign,
  Gauge,
  Palette,
  Wrench,
  AlertTriangle,
  Loader2,
  Eye,
  Settings,
  Zap,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from './common/Button'
import { Badge } from './common/Badge'
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

interface VehicleDetailModalProps {
  vehicleId: string
  onClose: () => void
}

export function VehicleDetailModal({ vehicleId, onClose }: VehicleDetailModalProps) {
  const { enums } = useEnums()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // CRITICAL: Only load data when vehicleId changes
  useEffect(() => {
    loadVehicleData()
  }, [vehicleId]) // Asılılıq massivində YALNIZ "vehicleId" olmalıdır

  const loadVehicleData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading vehicle details for ID:', vehicleId)
      const vehicleData = await apiClient.getVehicleById(vehicleId)
      console.log('Vehicle data received:', vehicleData)
      
      // Process image URLs
      const processedImageUrls = apiClient.processImageUrls(vehicleData)
      console.log('Processed image URLs:', processedImageUrls)
      
      // Transform API data to our Vehicle interface - KEEP ENUM VALUES AS NUMBERS!
      const transformedVehicle: Vehicle = {
        id: vehicleData.id,
        vin: vehicleData.vin || '',
        make: vehicleData.make || '',
        model: vehicleData.model || '',
        year: vehicleData.year || 0,
        mileage: vehicleData.odometer || vehicleData.mileage || 0, // Backend DTO field mapping
        mileageUnit: vehicleData.odometerUnit || vehicleData.mileageUnit || 'miles',
        price: vehicleData.price || 0,
        currency: vehicleData.currency || 'USD',
        bodyStyle: vehicleData.bodyStyle || vehicleData.type || '',
        color: vehicleData.color || '',
        hasKeys: vehicleData.hasKeys || false,
        titleState: vehicleData.titleState || '',
        estimatedRetailValue: vehicleData.estimatedRetailValue || 0,
        
        // ===== ENUM SAHƏLƏRİ - RƏQƏM OLARAQ SAXLA! =====
        fuelType: vehicleData.fuelType || 0,
        damageType: vehicleData.damageType || 0,
        transmission: vehicleData.transmission || 0,
        driveTrain: vehicleData.driveTrain || vehicleData.driveType || 0,
        carCondition: vehicleData.carCondition || vehicleData.condition || 0,
        titleType: vehicleData.titleType || 0,
        secondaryDamage: vehicleData.secondaryDamage || undefined,
        
        // Media
        imagePath: processedImageUrls.length > 0 ? processedImageUrls[0] : undefined,
        imageUrls: processedImageUrls,
        
        // Owner & Location
        ownerId: vehicleData.ownerId || '',
        ownerName: vehicleData.ownerName || 'Unknown Owner',
        locationId: vehicleData.locationId || '',
        locationName: vehicleData.locationName || vehicleData.location?.name || 'Unknown Location',
        
        // Status & Dates
        status: vehicleData.status || 'Available',
        createdAt: vehicleData.createdAt || new Date().toISOString(),
        updatedAtUtc: vehicleData.updatedAtUtc,
        
        // Auction related
        auctionId: vehicleData.auctionId,
        auctionName: vehicleData.auctionName,
        lotNumber: vehicleData.lotNumber,
        reservePrice: vehicleData.reservePrice,
        startPrice: vehicleData.startPrice
      }
      
      setVehicle(transformedVehicle)
    } catch (err) {
      console.error('Failed to load vehicle data:', err)
      setError('Failed to load vehicle details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (carCondition: number) => {
    switch (carCondition) {
      case 1: return 'success' // İşləyir və Sürülür
      case 2: return 'info'    // Mühərrik Başlatma Proqramı
      case 3: return 'info'    // Təkmilləşdirilmiş
      case 4: return 'error'   // Stasionar
      default: return 'neutral'
    }
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('Modal image failed to load:', vehicle?.imageUrls?.[currentImageIndex])
    e.currentTarget.style.display = 'none'
    const fallback = e.currentTarget.nextElementSibling as HTMLElement
    if (fallback) fallback.classList.remove('hidden')
  }

  const handleImageLoad = () => {
    console.log('Modal image loaded successfully:', vehicle?.imageUrls?.[currentImageIndex])
  }

  const nextImage = () => {
    if (vehicle?.imageUrls && vehicle.imageUrls.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % vehicle.imageUrls.length)
    }
  }

  const prevImage = () => {
    if (vehicle?.imageUrls && vehicle.imageUrls.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + vehicle.imageUrls.length) % vehicle.imageUrls.length)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg border border-gray-200 dark:border-dark-border w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg border border-gray-200 dark:border-dark-border w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="text-center p-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-2">Vehicle Not Found</h3>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-6">{error || 'The requested vehicle could not be found.'}</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg border border-gray-200 dark:border-dark-border w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-quaternary">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">VIN: {vehicle.vin}</p>
          </div>
          <Button variant="ghost" icon={X} onClick={onClose} />
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative bg-gray-100 dark:bg-dark-bg-quaternary rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
                <div className="aspect-video bg-gray-200 dark:bg-dark-bg-tertiary">
                  {vehicle.imageUrls && vehicle.imageUrls.length > 0 ? (
                    <img
                      src={vehicle.imageUrls[currentImageIndex]}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                    />
                  ) : null}
                  <div className={`absolute inset-0 bg-gray-200 dark:bg-dark-bg-tertiary flex items-center justify-center ${vehicle.imageUrls && vehicle.imageUrls.length > 0 ? 'hidden' : ''}`}>
                    <div className="text-center text-gray-400 dark:text-dark-text-muted">
                      <Car className="w-16 h-16 mx-auto mb-4" />
                      <div className="text-lg font-medium">No Images</div>
                      <div className="text-sm">Available</div>
                    </div>
                  </div>
                </div>

                {/* Image Navigation */}
                {vehicle.imageUrls && vehicle.imageUrls.length > 1 && (
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between p-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={prevImage}
                      className="bg-black/50 hover:bg-black/70 text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={nextImage}
                      className="bg-black/50 hover:bg-black/70 text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Image Counter */}
                {vehicle.imageUrls && vehicle.imageUrls.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {vehicle.imageUrls.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {vehicle.imageUrls && vehicle.imageUrls.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {vehicle.imageUrls.slice(0, 4).map((imageUrl, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-video bg-gray-100 dark:bg-dark-bg-quaternary rounded border overflow-hidden transition-all ${
                        currentImageIndex === index ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-text-muted'
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Vehicle Information */}
              <div className="bg-gray-50 dark:bg-dark-bg-quaternary rounded-lg border border-gray-200 dark:border-dark-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Vehicle Information</h3>
                  <Badge variant={getStatusBadgeVariant(vehicle.carCondition)} size="sm">
                    {getEnumLabel('CarCondition', vehicle.carCondition)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-dark-text-muted">Year</p>
                      <p className="text-base font-medium text-gray-900 dark:text-dark-text-primary">{vehicle.year}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Gauge className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-dark-text-muted">Mileage</p>
                      <p className="text-base font-medium text-gray-900 dark:text-dark-text-primary">
                        {vehicle.mileage?.toLocaleString()} {vehicle.mileageUnit}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-dark-text-muted">Color</p>
                      <p className="text-base font-medium text-gray-900 dark:text-dark-text-primary">{vehicle.color}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-dark-text-muted">Body Style</p>
                      <p className="text-base font-medium text-gray-900 dark:text-dark-text-primary">{vehicle.bodyStyle}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Owner */}
              <div className="bg-gray-50 dark:bg-dark-bg-quaternary rounded-lg border border-gray-200 dark:border-dark-border p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Location & Owner</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-dark-text-muted">Owner</p>
                      <p className="text-base font-medium text-gray-900 dark:text-dark-text-primary">{vehicle.ownerName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-dark-text-muted">Location</p>
                      <p className="text-base font-medium text-gray-900 dark:text-dark-text-primary">{vehicle.locationName}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="bg-gray-50 dark:bg-dark-bg-quaternary rounded-lg border border-gray-200 dark:border-dark-border p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Technical Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-dark-text-muted">Transmission</p>
                    <p className="text-base font-medium text-gray-900 dark:text-dark-text-primary">
                      {getEnumLabel('Transmission', vehicle.transmission)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-dark-text-muted">Fuel Type</p>
                    <p className="text-base font-medium text-gray-900 dark:text-dark-text-primary">
                      {getEnumLabel('FuelType', vehicle.fuelType)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-dark-text-muted">Drive Train</p>
                    <p className="text-base font-medium text-gray-900 dark:text-dark-text-primary">
                      {getEnumLabel('DriveTrain', vehicle.driveTrain)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-dark-text-muted">Condition</p>
                    <p className="text-base font-medium text-gray-900 dark:text-dark-text-primary">
                      {getEnumLabel('CarCondition', vehicle.carCondition)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Damage Information */}
              {vehicle.damageType && vehicle.damageType !== 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-6">
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-4">Damage Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">Primary Damage</p>
                        <p className="text-base font-medium text-yellow-800 dark:text-yellow-300">
                          {getEnumLabel('DamageType', vehicle.damageType)}
                        </p>
                      </div>
                    </div>
                    
                    {vehicle.secondaryDamage && vehicle.secondaryDamage !== 0 && (
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        <div>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">Secondary Damage</p>
                          <p className="text-base font-medium text-yellow-800 dark:text-yellow-300">
                            {getEnumLabel('DamageType', vehicle.secondaryDamage)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Legal Information */}
              <div className="bg-gray-50 dark:bg-dark-bg-quaternary rounded-lg border border-gray-200 dark:border-dark-border p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Legal Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-dark-text-muted">Title Type</p>
                    <p className="text-base font-medium text-gray-900 dark:text-dark-text-primary">
                      {getEnumLabel('TitleType', vehicle.titleType)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-dark-text-muted">Has Keys</p>
                    <p className="text-base font-medium text-gray-900 dark:text-dark-text-primary">
                      {vehicle.hasKeys ? 'Bəli' : 'Xeyr'}
                    </p>
                  </div>
                  
                  {vehicle.titleState && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-dark-text-muted">Title State</p>
                      <p className="text-base font-medium text-gray-900 dark:text-dark-text-primary">
                        {vehicle.titleState}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Auction Information */}
              {vehicle.auctionName && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">Auction Information</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Auction Name</p>
                      <p className="text-base font-medium text-blue-800 dark:text-blue-300">{vehicle.auctionName}</p>
                    </div>
                    
                    {vehicle.lotNumber && (
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Lot Number</p>
                        <p className="text-base font-medium text-blue-800 dark:text-blue-300">{vehicle.lotNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing Information */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4">Pricing</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600 dark:text-green-400">Current Price</span>
                    <span className="text-xl font-bold text-green-800 dark:text-green-300">
                      {vehicle.price.toLocaleString()} {vehicle.currency}
                    </span>
                  </div>
                  
                  {vehicle.estimatedRetailValue && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600 dark:text-green-400">Estimated Retail Value</span>
                      <span className="text-lg font-medium text-green-800 dark:text-green-300">
                        {vehicle.estimatedRetailValue.toLocaleString()} {vehicle.currency}
                      </span>
                    </div>
                  )}
                  
                  {vehicle.reservePrice && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600 dark:text-green-400">Reserve Price</span>
                      <span className="text-lg font-medium text-green-800 dark:text-green-300">
                        {vehicle.reservePrice.toLocaleString()} {vehicle.currency}
                      </span>
                    </div>
                  )}
                  
                  {vehicle.startPrice && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600 dark:text-green-400">Start Price</span>
                      <span className="text-lg font-medium text-green-800 dark:text-green-300">
                        {vehicle.startPrice.toLocaleString()} {vehicle.currency}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
