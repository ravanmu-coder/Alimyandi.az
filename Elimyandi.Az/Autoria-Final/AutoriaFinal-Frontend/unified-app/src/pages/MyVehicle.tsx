import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';
import CarPhotos from '../components/CarPhotos';
import ViewDetailsModal from '../components/ViewDetailsModal';
import EditVehicleModal from '../components/EditVehicleModal';
import DeleteVehicleModal from '../components/DeleteVehicleModal';
import { ModalProvider, useModalContext } from '../contexts/ModalContext';
import toast from 'react-hot-toast';
import { 
  Car, 
  Calendar, 
  Gauge, 
  Hash, 
  Palette, 
  Fuel, 
  Wrench, 
  MapPin,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getEnumLabel, getEnumBadgeClasses } from '../services/enumService';

// Updated Vehicle interface matching backend DTO structure exactly
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  color?: string;
  bodyStyle?: string;
  
  // Backend DTO fields (exact match)
  mileage?: number;
  mileageUnit?: string;
  fuelType?: number; // Enum value (numeric)
  damageType?: number; // Enum value (numeric)
  carCondition?: number; // Enum value (numeric)
  transmission?: number; // Enum value (numeric)
  driveTrain?: number; // Enum value (numeric)
  titleType?: number; // Enum value (numeric)
  secondaryDamage?: number; // Enum value (numeric)
  hasKeys?: boolean;
  titleState?: string;
  
  // Financial information
  price?: number;
  currency?: string;
  estimatedRetailValue?: number;
  
  // Location information
  locationId?: string;
  locationName?: string;
  locationAddress?: string;
  locationCity?: string;
  
  // Metadata
  createdAt?: string;
  updatedAtUtc?: string;
  ownerId?: string;
  ownerUsername?: string;
  
  // Media (backend returns these fields)
  photoUrls?: string[];
  videoUrls?: string[];
  
  // Legacy fields for backward compatibility (will be removed)
  imagePath?: string;
  image?: string;
  imageUrl?: string;
}


const MyVehicleContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { modalState, openViewDetailsModal, closeViewDetailsModal, openEditVehicleModal, closeEditVehicleModal, openDeleteVehicleModal, closeDeleteVehicleModal } = useModalContext();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [apiErrors, setApiErrors] = useState<Map<string, string>>(new Map());
  const [validationErrors, setValidationErrors] = useState<Map<string, string[]>>(new Map());
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Vehicle>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    fuelType: '',
    carCondition: '',
    damageType: '',
    titleType: '',
    hasKeys: '',
    priceRange: { min: '', max: '' },
    yearRange: { min: '', max: '' },
    mileageRange: { min: '', max: '' }
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Role-based access control
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const roles = user?.user?.roles;
    const isSeller = roles && roles.includes('Seller');
    
    if (!isSeller) {
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Load user's vehicles
  useEffect(() => {
    if (isAuthenticated && user?.user?.roles?.includes('Seller')) {
      loadMyVehicles();
    }
  }, [isAuthenticated, user]);

  // Cache for locations and user profiles to avoid repeated API calls
  const [locationsCache, setLocationsCache] = useState<any[]>([]);
  const [userProfilesCache, setUserProfilesCache] = useState<Map<string, string>>(new Map());

  // Data validation functions
  const validateVehicle = (vehicle: any): string[] => {
    const errors: string[] = [];
    
    if (!vehicle.id) errors.push('Missing vehicle ID');
    if (!vehicle.make) errors.push('Missing make');
    if (!vehicle.model) errors.push('Missing model');
    if (!vehicle.year || vehicle.year < 1900 || vehicle.year > new Date().getFullYear() + 1) {
      errors.push('Invalid year');
    }
    if (!vehicle.vin || vehicle.vin.length < 17) errors.push('Invalid VIN');
    
    return errors;
  };

  const validateEnumValue = (enumName: string, value: any): boolean => {
    if (value === undefined || value === null) return true; // Optional field
    if (typeof value !== 'number') return false;
    return value >= 0 && value <= 20; // Reasonable range for enum values
  };

  // Helper function to process photo URLs
  const processPhotoUrls = (photoUrls: any): string[] => {
    if (!photoUrls) return [];
    
    if (Array.isArray(photoUrls)) {
      return photoUrls.filter(url => url && url.trim() !== '');
    }
    
    if (typeof photoUrls === 'string') {
      return photoUrls.split(';').filter(url => url && url.trim() !== '');
    }
    
    return [];
  };

  // Debug function to log enum values
  const debugEnumValues = (vehicle: Vehicle) => {
    console.log(`Debug enum values for vehicle ${vehicle.id}:`, {
      fuelType: vehicle.fuelType,
      damageType: vehicle.damageType,
      carCondition: vehicle.carCondition,
      transmission: vehicle.transmission,
      driveTrain: vehicle.driveTrain,
      titleType: vehicle.titleType,
      secondaryDamage: vehicle.secondaryDamage
    });
  };

  const loadMyVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      setApiErrors(new Map());
      setValidationErrors(new Map());
      
      console.log('Loading vehicles from /api/Car...');
      
      // Try to use the optimized /api/Car/my endpoint first
      let userVehicles: any[] = [];
      try {
        console.log('Attempting to use /api/Car/my endpoint...');
        userVehicles = await apiClient.getMyCars();
        console.log('My cars response:', userVehicles);
      } catch (myCarsError) {
        console.log('My cars endpoint failed, falling back to /api/Car...', myCarsError);
        
        // Fallback to getting all cars and filtering
        const allVehicles = await apiClient.getCars();
      console.log('All vehicles response:', allVehicles);
      
      // Get current user ID for filtering
      const currentUserId = user?.user?.id;
      console.log('Current user ID:', currentUserId);
      
      // Filter vehicles to show only current user's vehicles
        userVehicles = (allVehicles || []).filter(vehicle => {
        return vehicle.ownerId === currentUserId;
      });
      }
      
      console.log('Filtered user vehicles:', userVehicles);
      
      if (userVehicles.length === 0) {
        setVehicles([]);
        return;
      }
      
      // Load locations from cache or API
      let locationsData = locationsCache;
      if (locationsCache.length === 0) {
        try {
          locationsData = await apiClient.getLocations();
          setLocationsCache(locationsData);
          console.log('Locations loaded and cached:', locationsData);
        } catch (locationError) {
          console.warn('Failed to load locations:', locationError);
          locationsData = [];
        }
      } else {
        console.log('Using cached locations:', locationsData);
      }
      
      // Process vehicles with optimized data fetching
      // Only fetch detailed data for vehicles that need it
      const processedVehicles = await Promise.all(
        userVehicles.map(async (vehicle) => {
          try {
            // Check if we already have complete data
            const hasCompleteData = vehicle.mileage !== undefined && 
                                  vehicle.fuelType !== undefined && 
                                  vehicle.photoUrls !== undefined;
            
            let completeVehicle = vehicle;
            
            // Only fetch detailed data if we don't have it
            if (!hasCompleteData) {
              console.log(`Fetching detailed data for vehicle ${vehicle.id}...`);
              completeVehicle = await apiClient.getCar(vehicle.id);
            console.log(`Complete data for vehicle ${vehicle.id}:`, completeVehicle);
            } else {
              console.log(`Using existing data for vehicle ${vehicle.id}`);
            }
            
            // Find location data
            const location = locationsData?.find(loc => loc.id === completeVehicle.locationId);
            
            // Get user profile for owner (with caching)
            let ownerUsername = '';
            if (completeVehicle.ownerId) {
              if (userProfilesCache.has(completeVehicle.ownerId)) {
                ownerUsername = userProfilesCache.get(completeVehicle.ownerId) || 'Unknown';
              } else {
              try {
                const userProfile = await apiClient.getUserProfile(completeVehicle.ownerId);
                ownerUsername = userProfile.username || userProfile.email || 'Unknown';
                  // Cache the result
                  setUserProfilesCache(prev => new Map(prev).set(completeVehicle.ownerId, ownerUsername));
              } catch (error) {
                console.error(`Error loading user profile for ${completeVehicle.ownerId}:`, error);
                ownerUsername = 'Unknown';
                }
              }
            }
            
            // Validate the vehicle data
            const validationErrors = validateVehicle(completeVehicle);
            if (validationErrors.length > 0) {
              console.warn(`Validation errors for vehicle ${vehicle.id}:`, validationErrors);
              setValidationErrors(prev => new Map(prev).set(vehicle.id, validationErrors));
            }
            
            return {
              id: completeVehicle.id || vehicle.id,
              make: completeVehicle.make || vehicle.make || 'Unknown',
              model: completeVehicle.model || vehicle.model || 'Unknown',
              year: completeVehicle.year || vehicle.year || 0,
              vin: completeVehicle.vin || vehicle.vin || '',
              color: completeVehicle.color || vehicle.color,
              bodyStyle: completeVehicle.bodyStyle || vehicle.bodyStyle,
              
              // Backend DTO field mapping (exact match)
              mileage: completeVehicle.mileage || vehicle.mileage,
              mileageUnit: completeVehicle.mileageUnit || vehicle.mileageUnit || 'km',
              fuelType: completeVehicle.fuelType || vehicle.fuelType,
              damageType: completeVehicle.damageType || vehicle.damageType,
              carCondition: completeVehicle.carCondition || vehicle.carCondition,
              transmission: completeVehicle.transmission || vehicle.transmission,
              driveTrain: completeVehicle.driveTrain || vehicle.driveTrain,
              titleType: completeVehicle.titleType || vehicle.titleType,
              secondaryDamage: completeVehicle.secondaryDamage || vehicle.secondaryDamage,
              hasKeys: completeVehicle.hasKeys || vehicle.hasKeys,
              titleState: completeVehicle.titleState || vehicle.titleState,
              
              // Financial information
              price: completeVehicle.price || vehicle.price,
              currency: completeVehicle.currency || vehicle.currency || 'USD',
              estimatedRetailValue: completeVehicle.estimatedRetailValue || vehicle.estimatedRetailValue,
              
              // Location information
              locationId: completeVehicle.locationId || vehicle.locationId,
              locationName: location?.name || completeVehicle.locationName,
              locationAddress: location?.addressLine1 || location?.address,
              locationCity: location?.city,
              
              // Metadata
              createdAt: completeVehicle.createdAt || vehicle.createdAt,
              updatedAtUtc: completeVehicle.updatedAtUtc || completeVehicle.updatedAt || vehicle.updatedAtUtc,
              ownerId: completeVehicle.ownerId || user?.user?.id,
              ownerUsername: ownerUsername || user?.user?.email || 'Unknown',
              
              // Media (process photoUrls properly)
              photoUrls: processPhotoUrls(completeVehicle.photoUrls || vehicle.photoUrls),
              videoUrls: completeVehicle.videoUrls || vehicle.videoUrls || [],
              
              // Legacy fields
              imagePath: completeVehicle.imagePath || vehicle.imagePath,
              image: completeVehicle.image || vehicle.image,
              imageUrl: completeVehicle.imageUrl || vehicle.imageUrl
            };
          } catch (carError) {
            console.error(`Error fetching complete data for vehicle ${vehicle.id}:`, carError);
            setApiErrors(prev => new Map(prev).set(vehicle.id, `Failed to load details: ${carError}`));
            
            // Return basic vehicle data if detailed fetch fails
            return {
              id: vehicle.id,
              make: vehicle.make || 'Unknown',
              model: vehicle.model || 'Unknown',
              year: vehicle.year || 0,
              vin: vehicle.vin || '',
              color: vehicle.color,
              bodyStyle: vehicle.bodyStyle,
              
              // Backend DTO field mapping (exact match)
              mileage: vehicle.mileage,
              mileageUnit: vehicle.mileageUnit || 'km',
              fuelType: vehicle.fuelType,
              damageType: vehicle.damageType,
              carCondition: vehicle.carCondition,
              transmission: vehicle.transmission,
              driveTrain: vehicle.driveTrain,
              titleType: vehicle.titleType,
              secondaryDamage: vehicle.secondaryDamage,
              hasKeys: vehicle.hasKeys,
              titleState: vehicle.titleState,
              
              // Financial information
              price: vehicle.price,
              currency: vehicle.currency || 'USD',
              estimatedRetailValue: vehicle.estimatedRetailValue,
              
              // Location information
              locationId: vehicle.locationId,
              locationName: vehicle.locationName || vehicle.location?.name,
              locationAddress: vehicle.locationAddress,
              locationCity: vehicle.locationCity,
              
              // Metadata
              createdAt: vehicle.createdAt,
              updatedAtUtc: vehicle.updatedAtUtc || vehicle.updatedAt,
              ownerId: vehicle.ownerId || user?.user?.id,
              ownerUsername: vehicle.ownerUsername || user?.user?.email || 'Unknown',
              
              // Media
              photoUrls: processPhotoUrls(vehicle.photoUrls),
              videoUrls: vehicle.videoUrls || [],
              
              // Legacy fields
              imagePath: vehicle.imagePath,
              image: vehicle.image,
              imageUrl: vehicle.imageUrl
            };
          }
        })
      );
      
      console.log('Processed vehicles:', processedVehicles);
      
      // Debug enum values for first vehicle
      if (processedVehicles.length > 0) {
        debugEnumValues(processedVehicles[0]);
      }
      
      setVehicles(processedVehicles);
    } catch (error) {
      console.error('Error loading user vehicles:', error);
      setError('Failed to load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = () => {
    navigate('/add-vehicle');
  };

  const handleViewVehicle = (vehicle: Vehicle) => {
    openViewDetailsModal(vehicle);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    openEditVehicleModal(vehicle);
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    openDeleteVehicleModal(vehicle);
  };

  const handleVehicleUpdated = (updatedVehicle: Vehicle) => {
    setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
    closeEditVehicleModal();
    toast.success('Vehicle updated successfully!');
  };

  const handleVehicleDeleted = (vehicleId: string) => {
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    closeDeleteVehicleModal();
    toast.success('Vehicle deleted successfully!');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (!price || price === 0) return 'N/A';
    const currencySymbol = currency === 'AZN' ? '₼' : currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '$';
    return `${currencySymbol}${price.toLocaleString()}`;
  };

  const formatMileage = (mileage?: number, unit?: string) => {
    if (!mileage || mileage === 0) return 'N/A';
    const unitText = unit === 'km' ? 'km' : unit === 'miles' ? 'mi' : unit || 'km';
    return `${mileage.toLocaleString()} ${unitText}`;
  };

  // Filtered and sorted vehicles
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    // Search filter (using debounced term)
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.make.toLowerCase().includes(term) ||
        vehicle.model.toLowerCase().includes(term) ||
        vehicle.year.toString().includes(term) ||
        vehicle.vin.toLowerCase().includes(term) ||
        vehicle.color?.toLowerCase().includes(term)
      );
    }

    // Enum filters
    if (filters.fuelType) {
      filtered = filtered.filter(vehicle => vehicle.fuelType === Number(filters.fuelType));
    }
    if (filters.carCondition) {
      filtered = filtered.filter(vehicle => vehicle.carCondition === Number(filters.carCondition));
    }
    if (filters.damageType) {
      filtered = filtered.filter(vehicle => vehicle.damageType === Number(filters.damageType));
    }
    if (filters.titleType) {
      filtered = filtered.filter(vehicle => vehicle.titleType === Number(filters.titleType));
    }
    if (filters.hasKeys !== '') {
      filtered = filtered.filter(vehicle => vehicle.hasKeys === (filters.hasKeys === 'true'));
    }

    // Range filters
    if (filters.priceRange.min) {
      filtered = filtered.filter(vehicle => (vehicle.price || 0) >= Number(filters.priceRange.min));
    }
    if (filters.priceRange.max) {
      filtered = filtered.filter(vehicle => (vehicle.price || 0) <= Number(filters.priceRange.max));
    }
    if (filters.yearRange.min) {
      filtered = filtered.filter(vehicle => vehicle.year >= Number(filters.yearRange.min));
    }
    if (filters.yearRange.max) {
      filtered = filtered.filter(vehicle => vehicle.year <= Number(filters.yearRange.max));
    }
    if (filters.mileageRange.min) {
      filtered = filtered.filter(vehicle => (vehicle.mileage || 0) >= Number(filters.mileageRange.min));
    }
    if (filters.mileageRange.max) {
      filtered = filtered.filter(vehicle => (vehicle.mileage || 0) <= Number(filters.mileageRange.max));
    }

    // Sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === undefined) return sortDirection === 'asc' ? -1 : 1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  }, [vehicles, debouncedSearchTerm, filters, sortField, sortDirection]);

  const handleSort = useCallback((field: keyof Vehicle) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const clearFilters = useCallback(() => {
    setFilters({
      fuelType: '',
      carCondition: '',
      damageType: '',
      titleType: '',
      hasKeys: '',
      priceRange: { min: '', max: '' },
      yearRange: { min: '', max: '' },
      mileageRange: { min: '', max: '' }
    });
    setSearchTerm('');
  }, []);

  const toggleRowExpansion = useCallback((vehicleId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId);
      } else {
        newSet.add(vehicleId);
      }
      return newSet;
    });
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-900 text-lg">Loading your vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #1e1f3b, #2b2f77)',
      backdropFilter: 'blur(10px)'
    }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Vehicles</h1>
            <p className="text-blue-200">Manage your vehicle listings</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadMyVehicles}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleAddVehicle}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
            >
              <Plus className="h-5 w-5" />
              Add Vehicle
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by make, model, year, VIN, or color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Filter Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors duration-300 ${
                  showFilters 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Filter className="h-5 w-5" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {(searchTerm || Object.values(filters).some(f => 
                typeof f === 'string' ? f !== '' : 
                typeof f === 'object' ? Object.values(f).some(v => v !== '') : false
              )) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Fuel Type Filter */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Fuel Type</label>
                <select
                  value={filters.fuelType}
                  onChange={(e) => setFilters(prev => ({ ...prev, fuelType: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Fuel Types</option>
                  <option value="1">Benzin</option>
                  <option value="2">Dizel</option>
                  <option value="3">Hibrid</option>
                  <option value="4">Elektrik</option>
                  <option value="5">LPG</option>
                  <option value="6">CNG</option>
                  <option value="7">Digər</option>
                </select>
              </div>

              {/* Condition Filter */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Condition</label>
                <select
                  value={filters.carCondition}
                  onChange={(e) => setFilters(prev => ({ ...prev, carCondition: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Conditions</option>
                  <option value="1">İşləyir və Sürülür</option>
                  <option value="2">Mühərrik Başlatma Proqramı</option>
                  <option value="3">Təkmilləşdirilmiş</option>
                  <option value="4">Stasionar</option>
                </select>
              </div>

              {/* Damage Type Filter */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Damage Type</label>
                <select
                  value={filters.damageType}
                  onChange={(e) => setFilters(prev => ({ ...prev, damageType: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Damage Types</option>
                  <option value="1">Ön Hissə</option>
                  <option value="2">Arxa Hissə</option>
                  <option value="3">Yan Tərəf</option>
                  <option value="4">Kiçik Batıq/Cızıqlar</option>
                  <option value="5">Normal Aşınma</option>
                  <option value="6">Hər Tərəfli</option>
                  <option value="7">Dolu</option>
                  <option value="8">Vandalizm</option>
                  <option value="9">Su/Sel</option>
                  <option value="10">Yanma</option>
                  <option value="11">Mexaniki</option>
                  <option value="12">Dam</option>
                  <option value="13">Alt Hissə</option>
                </select>
              </div>

              {/* Has Keys Filter */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Has Keys</label>
                <select
                  value={filters.hasKeys}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasKeys: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="true">Has Keys</option>
                  <option value="false">No Keys</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange.min}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      priceRange: { ...prev.priceRange, min: e.target.value }
                    }))}
                    className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange.max}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      priceRange: { ...prev.priceRange, max: e.target.value }
                    }))}
                    className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Year Range */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Year Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min Year"
                    value={filters.yearRange.min}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      yearRange: { ...prev.yearRange, min: e.target.value }
                    }))}
                    className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max Year"
                    value={filters.yearRange.max}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      yearRange: { ...prev.yearRange, max: e.target.value }
                    }))}
                    className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Mileage Range */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Mileage Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min Mileage"
                    value={filters.mileageRange.min}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      mileageRange: { ...prev.mileageRange, min: e.target.value }
                    }))}
                    className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max Mileage"
                    value={filters.mileageRange.max}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      mileageRange: { ...prev.mileageRange, max: e.target.value }
                    }))}
                    className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* API Errors */}
        {apiErrors.size > 0 && (
          <div className="mb-6 p-4 bg-orange-500/20 border border-orange-500/50 rounded-lg">
            <h4 className="text-orange-400 font-semibold mb-2">API Loading Issues</h4>
            {Array.from(apiErrors.entries()).map(([vehicleId, error]) => (
              <div key={vehicleId} className="text-orange-300 text-sm">
                <strong>Vehicle {vehicleId}:</strong> {error}
              </div>
            ))}
          </div>
        )}

        {/* Results Summary */}
        {vehicles.length > 0 && (
          <div className="mb-4 text-center">
            <p className="text-blue-200 text-sm">
              Showing {filteredVehicles.length} of {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
              {filteredVehicles.length !== vehicles.length && (
                <span className="text-yellow-400"> (filtered)</span>
              )}
            </p>
            {debouncedSearchTerm !== searchTerm && (
              <p className="text-gray-400 text-xs mt-1">
                <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                Searching...
              </p>
            )}
          </div>
        )}

        {/* Vehicles Table */}
        {filteredVehicles.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 text-center">
            <Car className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            {vehicles.length === 0 ? (
              <>
            <h3 className="text-xl font-semibold text-white mb-2">No Vehicles Found</h3>
            <p className="text-blue-200 mb-6">You haven't added any vehicles yet.</p>
            <button
              onClick={handleAddVehicle}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
            >
              Add Your First Vehicle
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-white mb-2">No Matching Vehicles</h3>
                <p className="text-blue-200 mb-6">
                  No vehicles match your current search and filter criteria.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={clearFilters}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={handleAddVehicle}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
                  >
                    Add New Vehicle
            </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/20">
                  <tr>
                    <th className="px-2 py-4 text-center text-xs font-medium text-gray-300 uppercase tracking-wider w-12">
                      <ChevronDown className="h-4 w-4 mx-auto opacity-50" />
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Image
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('make')}
                    >
                      <div className="flex items-center gap-1">
                      Vehicle Details
                        {sortField === 'make' && (
                          sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Specifications
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Location
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center gap-1">
                      Price
                        {sortField === 'price' && (
                          sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th 
                      className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-1">
                      Added
                        {sortField === 'createdAt' && (
                          sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredVehicles.map((vehicle) => {
                    const isExpanded = expandedRows.has(vehicle.id);
                    return (
                      <React.Fragment key={vehicle.id}>
                        <tr className="hover:bg-white/5 transition-all duration-200 group">
                          {/* Expand/Collapse Column */}
                          <td className="px-2 py-3 text-center">
                          <button
                            onClick={() => toggleRowExpansion(vehicle.id)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-full p-1 transition-all duration-200"
                            title={isExpanded ? "Collapse details" : "Expand details"}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          </td>
                          
                      {/* Image Column */}
                      <td className="px-3 py-3">
                        <CarPhotos 
                          carId={vehicle.id} 
                          showMultiple={false}
                          className="h-12 w-16"
                          enableGallery={true}
                          lazyLoad={true}
                        />
                      </td>

                      {/* Vehicle Details Column */}
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-white">
                            {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-blue-200 text-xs">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {vehicle.year}
                            </div>
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {vehicle.vin}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Specifications Column */}
                      <td className="px-4 py-4">
                        <div className="text-xs text-blue-200 space-y-1">
                          <div className="flex items-center gap-1">
                            <Palette className="h-3 w-3" />
                            {vehicle.color || 'N/A'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Wrench className="h-3 w-3" />
                            {vehicle.bodyStyle || 'N/A'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Fuel className="h-3 w-3" />
                            {vehicle.fuelType !== undefined ? getEnumLabel('FuelType', vehicle.fuelType) : 'N/A'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            {formatMileage(vehicle.mileage, vehicle.mileageUnit)}
                          </div>
                          {vehicle.transmission !== undefined && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">Trans:</span>
                              {getEnumLabel('Transmission', vehicle.transmission)}
                            </div>
                          )}
                          {vehicle.carCondition !== undefined && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">Cond:</span>
                              <span className={getEnumBadgeClasses('CarCondition', vehicle.carCondition)}>
                                {getEnumLabel('CarCondition', vehicle.carCondition)}
                              </span>
                            </div>
                          )}
                          {vehicle.damageType !== undefined && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">Damage:</span>
                              <span className={getEnumBadgeClasses('DamageType', vehicle.damageType)}>
                                {getEnumLabel('DamageType', vehicle.damageType)}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location Column */}
                      <td className="px-4 py-4">
                        <div className="text-xs text-blue-200">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {vehicle.locationName || 'N/A'}
                          </div>
                          {vehicle.locationAddress && vehicle.locationCity && (
                            <div className="text-xs text-gray-400 mt-1">
                              {vehicle.locationAddress} - {vehicle.locationCity}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Price Column */}
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          {vehicle.price && (
                            <div className="font-medium text-green-400">
                              {formatPrice(vehicle.price, vehicle.currency)}
                        </div>
                          )}
                        {vehicle.estimatedRetailValue && (
                            <div className={`text-xs ${vehicle.price ? 'text-gray-400' : 'text-green-400 font-medium'}`}>
                              Est: {formatPrice(vehicle.estimatedRetailValue, vehicle.currency)}
                          </div>
                        )}
                          {!vehicle.price && !vehicle.estimatedRetailValue && (
                            <div className="text-gray-400 text-xs">N/A</div>
                          )}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {vehicle.titleType !== undefined && (
                            <div className={getEnumBadgeClasses('TitleType', vehicle.titleType)}>
                              {getEnumLabel('TitleType', vehicle.titleType)}
                            </div>
                          )}
                          {vehicle.hasKeys !== undefined && (
                            <div className={`text-xs ${vehicle.hasKeys ? 'text-green-400' : 'text-red-400'}`}>
                              {vehicle.hasKeys ? '✓ Keys' : '✗ No Keys'}
                            </div>
                          )}
                          {vehicle.driveTrain !== undefined && (
                            <div className="text-xs text-blue-200">
                              {getEnumLabel('DriveTrain', vehicle.driveTrain)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Added Date Column */}
                      <td className="px-4 py-4">
                        <div className="text-xs text-blue-200">
                          <div className="font-medium">
                            {vehicle.ownerUsername || 'Unknown'}
                          </div>
                          <div className="text-gray-400">
                            {formatDate(vehicle.createdAt)}
                          </div>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewVehicle(vehicle)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-full p-2 transition-all duration-200"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditVehicle(vehicle)}
                            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 rounded-full p-2 transition-all duration-200"
                            title="Edit Vehicle"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(vehicle)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full p-2 transition-all duration-200"
                            title="Delete Vehicle"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row Content */}
                    {isExpanded && (
                      <tr className="bg-white/5">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Additional Technical Specifications */}
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <Wrench className="h-4 w-4" />
                                Technical Specifications
                              </h4>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                {vehicle.transmission !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-blue-200">Transmission:</span>
                                    <span className="text-white">{getEnumLabel('Transmission', vehicle.transmission)}</span>
                                  </div>
                                )}
                                {vehicle.driveTrain !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-blue-200">Drive Train:</span>
                                    <span className="text-white">{getEnumLabel('DriveTrain', vehicle.driveTrain)}</span>
                                  </div>
                                )}
                                {vehicle.titleType !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-blue-200">Title Type:</span>
                                    <span className={getEnumBadgeClasses('TitleType', vehicle.titleType)}>
                                      {getEnumLabel('TitleType', vehicle.titleType)}
                                    </span>
                                  </div>
                                )}
                                {vehicle.titleState && (
                                  <div className="flex justify-between">
                                    <span className="text-blue-200">Title State:</span>
                                    <span className="text-white">{vehicle.titleState}</span>
                                  </div>
                                )}
                                {vehicle.secondaryDamage !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-blue-200">Secondary Damage:</span>
                                    <span className="text-white">{getEnumLabel('DamageType', vehicle.secondaryDamage)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-blue-200">Has Keys:</span>
                                  <span className={`${vehicle.hasKeys ? 'text-green-400' : 'text-red-400'}`}>
                                    {vehicle.hasKeys ? '✓ Yes' : '✗ No'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Financial Information */}
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <Hash className="h-4 w-4" />
                                Financial Information
                              </h4>
                              <div className="space-y-2 text-xs">
                                {vehicle.price && (
                                  <div className="flex justify-between">
                                    <span className="text-blue-200">Listed Price:</span>
                                    <span className="text-green-400 font-medium">
                                      {formatPrice(vehicle.price, vehicle.currency)}
                                    </span>
                                  </div>
                                )}
                                {vehicle.estimatedRetailValue && (
                                  <div className="flex justify-between">
                                    <span className="text-blue-200">Estimated Value:</span>
                                    <span className="text-yellow-400">
                                      {formatPrice(vehicle.estimatedRetailValue, vehicle.currency)}
                                    </span>
                                  </div>
                                )}
                                {vehicle.price && vehicle.estimatedRetailValue && (
                                  <div className="flex justify-between">
                                    <span className="text-blue-200">Price vs Value:</span>
                                    <span className={`${
                                      vehicle.price <= vehicle.estimatedRetailValue 
                                        ? 'text-green-400' 
                                        : 'text-red-400'
                                    }`}>
                                      {vehicle.price <= vehicle.estimatedRetailValue ? 'Good Deal' : 'Above Value'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Media Gallery */}
                            <div className="lg:col-span-2">
                              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Media Gallery
                              </h4>
                              <CarPhotos 
                                carId={vehicle.id} 
                                showMultiple={true}
                                maxImages={6}
                                enableGallery={true}
                                lazyLoad={true}
                                className="w-full"
                              />
                            </div>

                            {/* Additional Actions */}
                            <div className="lg:col-span-2">
                              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Additional Actions
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleViewVehicle(vehicle)}
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors duration-200"
                                >
                                  <Eye className="h-3 w-3" />
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleEditVehicle(vehicle)}
                                  className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded-lg transition-colors duration-200"
                                >
                                  <Edit className="h-3 w-3" />
                                  Edit Vehicle
                                </button>
                                <button
                                  onClick={() => handleDeleteVehicle(vehicle)}
                                  className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors duration-200"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete Vehicle
                                </button>
                                <button
                                  onClick={() => navigator.clipboard.writeText(vehicle.vin)}
                                  className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors duration-200"
                                >
                                  <Hash className="h-3 w-3" />
                                  Copy VIN
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        {filteredVehicles.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-blue-200 text-sm">
              Showing {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''}
              {filteredVehicles.length !== vehicles.length && (
                <span className="text-yellow-400"> (filtered from {vehicles.length} total)</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Modal Components */}
      <ViewDetailsModal
        isOpen={modalState.viewDetailsModal.isOpen}
        onClose={closeViewDetailsModal}
        vehicle={modalState.viewDetailsModal.vehicle}
      />
      
      <EditVehicleModal
        isOpen={modalState.editVehicleModal.isOpen}
        onClose={closeEditVehicleModal}
        vehicle={modalState.editVehicleModal.vehicle}
        onSave={handleVehicleUpdated}
      />
      
      <DeleteVehicleModal
        isOpen={modalState.deleteVehicleModal.isOpen}
        onClose={closeDeleteVehicleModal}
        vehicle={modalState.deleteVehicleModal.vehicle}
        onDelete={handleVehicleDeleted}
      />
    </div>
  );
};

const MyVehicle: React.FC = () => {
  return (
    <ModalProvider>
      <MyVehicleContent />
    </ModalProvider>
  );
};

export default MyVehicle;
