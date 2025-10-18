import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';
import CarPhotos from '../components/CarPhotos';
import Alert from '../components/Alert';
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
  Eye,
  Heart,
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

const VehicleFinder: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [urlSearchParams] = useSearchParams();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'removed' } | null>(null);
  
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

  // Watchlist state
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

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
    const isMember = roles && roles.includes('Member');
    const isSeller = roles && roles.includes('Seller');
    
    if (!isMember && !isSeller) {
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Load vehicles and watchlist on component mount
  useEffect(() => {
    if (isAuthenticated && (user?.user?.roles?.includes('Member') || user?.user?.roles?.includes('Seller'))) {
      loadVehicles();
      loadWatchlist();
    }
  }, [isAuthenticated, user]);

  // Handle URL search parameters
  useEffect(() => {
    const searchQuery = urlSearchParams.get('search');
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [urlSearchParams]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading vehicles with optimized LiveAuction filter...');
      
      // Step 1: Load all vehicles from GET /api/Car
      console.log('Step 1: Loading all vehicles...');
      const allVehicles = await apiClient.getCars();
      console.log('All vehicles loaded:', allVehicles.length);
      
      if (allVehicles.length === 0) {
        console.log('No vehicles found, setting empty results');
        setVehicles([]);
        return;
      }
      
      // Step 2: Extract all car IDs
      console.log('Step 2: Extracting car IDs...');
      const allCarIds = allVehicles.map(vehicle => vehicle.id);
      console.log('Car IDs extracted:', allCarIds.length);
      
      // Step 3: Split IDs into batches of max 200
      console.log('Step 3: Creating batches...');
      const batchSize = 200;
      const batches: string[][] = [];
      for (let i = 0; i < allCarIds.length; i += batchSize) {
        batches.push(allCarIds.slice(i, i + batchSize));
      }
      console.log(`Created ${batches.length} batches`);
      
      // Step 4: Send parallel batch requests
      console.log('Step 4: Sending parallel batch requests...');
      const batchPromises = batches.map(async (batch, index) => {
        try {
          return await apiClient.getBatchAuctionStatus(batch);
        } catch (error) {
          console.error(`Batch ${index + 1} failed:`, error);
          // Return empty array for failed batch to continue processing
          return [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      console.log('Batch requests completed');
      
      // Step 5: Combine and filter results
      console.log('Step 5: Combining and filtering results...');
      const auctionStatusResults = batchResults.flat();
      console.log('Combined auction status results:', auctionStatusResults.length);
      
      // Check if we got any results from batch requests
      if (auctionStatusResults.length === 0) {
        console.warn('No auction status results received, falling back to showing all vehicles');
        // Fallback: show all vehicles if batch endpoint fails
        const processedVehicles = await Promise.all(
          allVehicles.map(async (vehicle) => {
            try {
              let locationName = vehicle.locationName;
              if (vehicle.locationId && !locationName) {
                try {
                  const location = await apiClient.getLocation(vehicle.locationId);
                  locationName = location.name || location.city;
                } catch (locationError) {
                  console.warn(`Could not fetch location for ${vehicle.locationId}`);
                }
              }
              
              return {
                id: vehicle.id,
                make: vehicle.make || 'Unknown',
                model: vehicle.model || 'Unknown',
                year: vehicle.year || 0,
                vin: vehicle.vin || '',
                color: vehicle.color,
                bodyStyle: vehicle.bodyStyle,
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
                price: vehicle.price,
                currency: vehicle.currency || 'USD',
                estimatedRetailValue: vehicle.estimatedRetailValue,
                locationId: vehicle.locationId,
                locationName: locationName,
                locationAddress: vehicle.locationAddress,
                locationCity: vehicle.locationCity,
                createdAt: vehicle.createdAt,
                updatedAtUtc: vehicle.updatedAtUtc,
                ownerId: vehicle.ownerId,
                ownerUsername: vehicle.ownerUsername,
                photoUrls: vehicle.photoUrls || [],
                videoUrls: vehicle.videoUrls || [],
                imagePath: vehicle.imagePath,
                image: vehicle.image,
                imageUrl: vehicle.imageUrl
              };
            } catch (error) {
              console.error(`Error processing vehicle ${vehicle.id}:`, error);
              return null;
            }
          })
        );
        
        const validVehicles = processedVehicles.filter(vehicle => vehicle !== null) as Vehicle[];
        console.log('Fallback processed vehicles:', validVehicles.length);
        setVehicles(validVehicles);
        return;
      }
      
      // Filter for LiveAuction status (enum value 2)
      const liveAuctionStatuses = auctionStatusResults.filter(status => 
        status.auctionCarCondition === 2
      );
      console.log('Live auction statuses:', liveAuctionStatuses.length);
      
      // Step 6: Extract live car IDs
      console.log('Step 6: Extracting live car IDs...');
      const liveCarIds = new Set(liveAuctionStatuses.map(status => status.carId));
      console.log('Live car IDs:', liveCarIds.size);
      
      // Step 7: Filter all vehicles to only include live auction vehicles
      console.log('Step 7: Filtering vehicles...');
      const liveAuctionVehicles = allVehicles.filter(vehicle => 
        liveCarIds.has(vehicle.id)
      );
      console.log('Live auction vehicles:', liveAuctionVehicles.length);
      
      // Step 8: Process vehicles with location data
      console.log('Step 8: Processing vehicles...');
      const processedVehicles = await Promise.all(
        liveAuctionVehicles.map(async (vehicle) => {
          try {
            // Get location data if available
            let locationName = vehicle.locationName;
            if (vehicle.locationId && !locationName) {
              try {
                const location = await apiClient.getLocation(vehicle.locationId);
                locationName = location.name || location.city;
              } catch (locationError) {
                console.warn(`Could not fetch location for ${vehicle.locationId}`);
              }
            }
            
            return {
              id: vehicle.id,
              make: vehicle.make || 'Unknown',
              model: vehicle.model || 'Unknown',
              year: vehicle.year || 0,
              vin: vehicle.vin || '',
              color: vehicle.color,
              bodyStyle: vehicle.bodyStyle,
              
              // Backend DTO field mapping
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
              locationName: locationName,
              locationAddress: vehicle.locationAddress,
              locationCity: vehicle.locationCity,
              
              // Metadata
              createdAt: vehicle.createdAt,
              updatedAtUtc: vehicle.updatedAtUtc,
              ownerId: vehicle.ownerId,
              ownerUsername: vehicle.ownerUsername,
              
              // Media
              photoUrls: vehicle.photoUrls || [],
              videoUrls: vehicle.videoUrls || [],
              
              // Legacy fields
              imagePath: vehicle.imagePath,
              image: vehicle.image,
              imageUrl: vehicle.imageUrl
            };
          } catch (error) {
            console.error(`Error processing vehicle ${vehicle.id}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null results
      const validVehicles = processedVehicles.filter(vehicle => vehicle !== null) as Vehicle[];
      
      console.log('Final processed vehicles:', validVehicles.length);
      setVehicles(validVehicles);
      
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setError('Failed to load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadWatchlist = () => {
    try {
      console.log('Loading watchlist from localStorage...');
      const savedWatchlist = localStorage.getItem('vehicleWatchlist');
      if (savedWatchlist) {
        const watchlistArray: string[] = JSON.parse(savedWatchlist);
        const watchlistIds = new Set<string>(watchlistArray);
        console.log('Watchlist loaded from localStorage:', watchlistIds);
        setWatchlist(watchlistIds);
      } else {
        console.log('No watchlist found in localStorage, starting with empty watchlist');
        setWatchlist(new Set<string>());
      }
    } catch (error) {
      console.error('Error loading watchlist from localStorage:', error);
      setWatchlist(new Set<string>());
    }
  };

  const showAlert = (message: string, type: 'success' | 'error' | 'info' | 'removed') => {
    setAlert({ message, type });
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

  const handleWatchlistToggle = (vehicle: Vehicle) => {
    console.log('🔔 Watchlist toggle clicked for vehicle:', vehicle.id, vehicle.make, vehicle.model);
    const newWatchlist = new Set(watchlist);
    if (watchlist.has(vehicle.id)) {
      // Remove from watchlist
      console.log('❌ Removing from watchlist:', vehicle.id);
      newWatchlist.delete(vehicle.id);
      setWatchlist(newWatchlist);
      
      // Remove from localStorage IDs
      localStorage.setItem('watchlist', JSON.stringify(Array.from(newWatchlist)));
      
      // Remove from localStorage detailed data
      const savedWatchlistData = localStorage.getItem('vehicleWatchlistData');
      if (savedWatchlistData) {
        const watchlistData: any[] = JSON.parse(savedWatchlistData);
        const filteredData = watchlistData.filter(item => item.id !== vehicle.id);
        localStorage.setItem('vehicleWatchlistData', JSON.stringify(filteredData));
      }
      
      // Also remove from vehicleWatchlist (for compatibility)
      const savedVehicleWatchlist = localStorage.getItem('vehicleWatchlist');
      if (savedVehicleWatchlist) {
        const vehicleWatchlistArray: string[] = JSON.parse(savedVehicleWatchlist);
        const filteredIds = vehicleWatchlistArray.filter(id => id !== vehicle.id);
        localStorage.setItem('vehicleWatchlist', JSON.stringify(filteredIds));
      }
      
      console.log('✅ Vehicle removed from all localStorage keys');
      showAlert('Removed from Watchlist', 'removed');
    } else {
      // Add to watchlist
      console.log('✅ Adding to watchlist:', vehicle.id);
      newWatchlist.add(vehicle.id);
      setWatchlist(newWatchlist);
      
      // Save IDs to localStorage
      localStorage.setItem('watchlist', JSON.stringify(Array.from(newWatchlist)));
      
      // Save detailed vehicle data to localStorage
      const savedWatchlistData = localStorage.getItem('vehicleWatchlistData');
      const watchlistData: any[] = savedWatchlistData ? JSON.parse(savedWatchlistData) : [];
      
      const detailedVehicleData = {
        id: vehicle.id,
        auctionCarId: vehicle.id,
        carId: vehicle.id,
        auctionId: 'unknown',
        lotNumber: `LOT-${vehicle.id.slice(-4)}`,
        year: vehicle.year || 2020,
        make: vehicle.make || 'Unknown',
        model: vehicle.model || 'Unknown',
        image: vehicle.photoUrls?.[0] || '/placeholder-car.jpg',
        odometer: vehicle.mileage || 0,
        damage: 'None',
        estimatedRetailValue: vehicle.estimatedRetailValue || 0,
        currentBid: vehicle.estimatedRetailValue || 0,
        bidCount: 0,
        reservePrice: vehicle.estimatedRetailValue || 0,
        isReserveMet: false,
        auctionStartTime: new Date().toISOString(),
        auctionEndTime: new Date().toISOString(),
        isLive: false,
        location: {
          city: vehicle.locationCity || 'Unknown',
          region: 'North America',
          address: vehicle.locationAddress || 'Unknown',
          phone: '+1-555-0123',
          email: 'auction@example.com',
          username: 'AuctionHouse',
          auctionJoinDate: new Date().toISOString()
        },
        condition: {
          titleType: 'Clean',
          keysStatus: 'Available' as const
        },
        addedToWatchlistAt: new Date().toISOString()
      };
      
      // Check if vehicle already exists in detailed data
      const existingIndex = watchlistData.findIndex(item => item.id === vehicle.id);
      if (existingIndex === -1) {
        watchlistData.push(detailedVehicleData);
        localStorage.setItem('vehicleWatchlistData', JSON.stringify(watchlistData));
        console.log('💾 Saved to vehicleWatchlistData. Total vehicles in watchlist:', watchlistData.length);
        console.log('📦 Detailed vehicle data:', detailedVehicleData);
      } else {
        console.log('⚠️ Vehicle already exists in watchlist data');
      }
      
      // Also save to vehicleWatchlist (for compatibility)
      const savedVehicleWatchlist = localStorage.getItem('vehicleWatchlist');
      const vehicleWatchlistArray: string[] = savedVehicleWatchlist ? JSON.parse(savedVehicleWatchlist) : [];
      if (!vehicleWatchlistArray.includes(vehicle.id)) {
        vehicleWatchlistArray.push(vehicle.id);
        localStorage.setItem('vehicleWatchlist', JSON.stringify(vehicleWatchlistArray));
        console.log('💾 Also saved to vehicleWatchlist (compatibility)');
      }
      
      console.log('🎉 Vehicle successfully added to watchlist! Check Dashboard to see it.');
      showAlert('Added to Watchlist', 'success');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-900 text-lg">Loading live auction vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #1e1f3b, #2b2f77)',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Toast Notifications */}
      {alert && (
        <Alert 
          message={alert.message} 
          type={alert.type} 
          onClose={() => setAlert(null)} 
        />
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Vehicle Finder</h1>
            <p className="text-blue-200 text-lg">Search and filter vehicles from live auctions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadVehicles}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 font-semibold"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Active Filters Indicator */}
        {(searchTerm || Object.values(filters).some(f => 
          typeof f === 'string' ? f !== '' : 
          typeof f === 'object' ? Object.values(f).some(v => v !== '') : false
        )) && (
          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-blue-400" />
              <span className="text-blue-200 font-semibold">Active Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="px-3 py-1 bg-blue-600/30 text-blue-200 rounded-full text-sm border border-blue-500/30">
                  Search: "{searchTerm}"
                </span>
              )}
              {filters.fuelType && (
                <span className="px-3 py-1 bg-blue-600/30 text-blue-200 rounded-full text-sm border border-blue-500/30">
                  Fuel: {getEnumLabel('FuelType', Number(filters.fuelType))}
                </span>
              )}
              {filters.carCondition && (
                <span className="px-3 py-1 bg-green-600/30 text-green-200 rounded-full text-sm border border-green-500/30">
                  Condition: {getEnumLabel('CarCondition', Number(filters.carCondition))}
                </span>
              )}
              {filters.damageType && (
                <span className="px-3 py-1 bg-red-600/30 text-red-200 rounded-full text-sm border border-red-500/30">
                  Damage: {getEnumLabel('DamageType', Number(filters.damageType))}
                </span>
              )}
              {filters.hasKeys !== '' && (
                <span className="px-3 py-1 bg-yellow-600/30 text-yellow-200 rounded-full text-sm border border-yellow-500/30">
                  Keys: {filters.hasKeys === 'true' ? 'Has Keys' : 'No Keys'}
                </span>
              )}
              {(filters.priceRange.min || filters.priceRange.max) && (
                <span className="px-3 py-1 bg-green-600/30 text-green-200 rounded-full text-sm border border-green-500/30">
                  Price: {filters.priceRange.min || '0'} - {filters.priceRange.max || '∞'}
                </span>
              )}
              {(filters.yearRange.min || filters.yearRange.max) && (
                <span className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-sm border border-purple-500/30">
                  Year: {filters.yearRange.min || '1900'} - {filters.yearRange.max || '2024'}
                </span>
              )}
              {(filters.mileageRange.min || filters.mileageRange.max) && (
                <span className="px-3 py-1 bg-orange-600/30 text-orange-200 rounded-full text-sm border border-orange-500/30">
                  Mileage: {filters.mileageRange.min || '0'} - {filters.mileageRange.max || '∞'} km
                </span>
              )}
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                <input
                  type="text"
                  placeholder="Search by make, model, year, VIN, or color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 bg-slate-900/80 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                    searchTerm ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'
                  }`}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            {/* Filter Toggle */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl transition-all duration-300 font-semibold ${
                  showFilters 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-slate-700/80 text-white hover:bg-slate-600/80 border border-slate-600'
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
                  className="flex items-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-red-500/25"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* Fuel Type Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-blue-400" />
                  Fuel Type
                </label>
                <select
                  value={filters.fuelType}
                  onChange={(e) => setFilters(prev => ({ ...prev, fuelType: e.target.value }))}
                  className={`w-full px-4 py-3 bg-slate-800/80 border-2 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                    filters.fuelType ? 'border-blue-500 bg-blue-500/20' : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <option value="" className="bg-slate-800 text-white">All Fuel Types</option>
                  <option value="1" className="bg-slate-800 text-white">Benzin</option>
                  <option value="2" className="bg-slate-800 text-white">Dizel</option>
                  <option value="3" className="bg-slate-800 text-white">Hibrid</option>
                  <option value="4" className="bg-slate-800 text-white">Elektrik</option>
                  <option value="5" className="bg-slate-800 text-white">LPG</option>
                  <option value="6" className="bg-slate-800 text-white">CNG</option>
                  <option value="7" className="bg-slate-800 text-white">Digər</option>
                </select>
              </div>

              {/* Condition Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Car className="h-4 w-4 text-green-400" />
                  Condition
                </label>
                <select
                  value={filters.carCondition}
                  onChange={(e) => setFilters(prev => ({ ...prev, carCondition: e.target.value }))}
                  className={`w-full px-4 py-3 bg-slate-800/80 border-2 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${
                    filters.carCondition ? 'border-green-500 bg-green-500/20' : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <option value="" className="bg-slate-800 text-white">All Conditions</option>
                  <option value="1" className="bg-slate-800 text-white">İşləyir və Sürülür</option>
                  <option value="2" className="bg-slate-800 text-white">Mühərrik Başlatma Proqramı</option>
                  <option value="3" className="bg-slate-800 text-white">Təkmilləşdirilmiş</option>
                  <option value="4" className="bg-slate-800 text-white">Stasionar</option>
                </select>
              </div>

              {/* Damage Type Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-red-400" />
                  Damage Type
                </label>
                <select
                  value={filters.damageType}
                  onChange={(e) => setFilters(prev => ({ ...prev, damageType: e.target.value }))}
                  className={`w-full px-4 py-3 bg-slate-800/80 border-2 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 ${
                    filters.damageType ? 'border-red-500 bg-red-500/20' : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <option value="" className="bg-slate-800 text-white">All Damage Types</option>
                  <option value="1" className="bg-slate-800 text-white">Ön Hissə</option>
                  <option value="2" className="bg-slate-800 text-white">Arxa Hissə</option>
                  <option value="3" className="bg-slate-800 text-white">Yan Tərəf</option>
                  <option value="4" className="bg-slate-800 text-white">Kiçik Batıq/Cızıqlar</option>
                  <option value="5" className="bg-slate-800 text-white">Normal Aşınma</option>
                  <option value="6" className="bg-slate-800 text-white">Hər Tərəfli</option>
                  <option value="7" className="bg-slate-800 text-white">Dolu</option>
                  <option value="8" className="bg-slate-800 text-white">Vandalizm</option>
                  <option value="9" className="bg-slate-800 text-white">Su/Sel</option>
                  <option value="10" className="bg-slate-800 text-white">Yanma</option>
                  <option value="11" className="bg-slate-800 text-white">Mexaniki</option>
                  <option value="12" className="bg-slate-800 text-white">Dam</option>
                  <option value="13" className="bg-slate-800 text-white">Alt Hissə</option>
                </select>
              </div>

              {/* Has Keys Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-yellow-400" />
                  Has Keys
                </label>
                <select
                  value={filters.hasKeys}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasKeys: e.target.value }))}
                  className={`w-full px-4 py-3 bg-slate-800/80 border-2 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300 ${
                    filters.hasKeys ? 'border-yellow-500 bg-yellow-500/20' : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <option value="" className="bg-slate-800 text-white">All</option>
                  <option value="true" className="bg-slate-800 text-white">Has Keys</option>
                  <option value="false" className="bg-slate-800 text-white">No Keys</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-green-400" />
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange.min}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      priceRange: { ...prev.priceRange, min: e.target.value }
                    }))}
                    className={`flex-1 px-4 py-3 bg-slate-800/80 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${
                      filters.priceRange.min ? 'border-green-500 bg-green-500/20' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange.max}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      priceRange: { ...prev.priceRange, max: e.target.value }
                    }))}
                    className={`flex-1 px-4 py-3 bg-slate-800/80 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${
                      filters.priceRange.max ? 'border-green-500 bg-green-500/20' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  />
                </div>
              </div>

              {/* Year Range */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  Year Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min Year"
                    value={filters.yearRange.min}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      yearRange: { ...prev.yearRange, min: e.target.value }
                    }))}
                    className={`flex-1 px-4 py-3 bg-slate-800/80 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 ${
                      filters.yearRange.min ? 'border-purple-500 bg-purple-500/20' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  />
                  <input
                    type="number"
                    placeholder="Max Year"
                    value={filters.yearRange.max}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      yearRange: { ...prev.yearRange, max: e.target.value }
                    }))}
                    className={`flex-1 px-4 py-3 bg-slate-800/80 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 ${
                      filters.yearRange.max ? 'border-purple-500 bg-purple-500/20' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  />
                </div>
              </div>

              {/* Mileage Range */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-orange-400" />
                  Mileage Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min Mileage"
                    value={filters.mileageRange.min}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      mileageRange: { ...prev.mileageRange, min: e.target.value }
                    }))}
                    className={`flex-1 px-4 py-3 bg-slate-800/80 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 ${
                      filters.mileageRange.min ? 'border-orange-500 bg-orange-500/20' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  />
                  <input
                    type="number"
                    placeholder="Max Mileage"
                    value={filters.mileageRange.max}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      mileageRange: { ...prev.mileageRange, max: e.target.value }
                    }))}
                    className={`flex-1 px-4 py-3 bg-slate-800/80 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 ${
                      filters.mileageRange.max ? 'border-orange-500 bg-orange-500/20' : 'border-slate-600 hover:border-slate-500'
                    }`}
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

        {/* Results Summary */}
        {vehicles.length > 0 && (
          <div className="mb-4 text-center">
            <p className="text-blue-200 text-sm">
              Showing {filteredVehicles.length} of {vehicles.length} live auction vehicle{vehicles.length !== 1 ? 's' : ''}
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
                <h3 className="text-xl font-semibold text-white mb-2">No Live Auction Vehicles Found</h3>
                <p className="text-blue-200 mb-6">There are currently no vehicles in live auctions.</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-white mb-2">No Matching Vehicles</h3>
                <p className="text-blue-200 mb-6">
                  No vehicles match your current search and filter criteria.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
                >
                  Clear Filters
                </button>
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
                              <div className="text-xs text-green-400 font-medium">
                                Live Auction
                              </div>
                              {vehicle.hasKeys !== undefined && (
                                <div className={`text-xs ${vehicle.hasKeys ? 'text-green-400' : 'text-red-400'}`}>
                                  {vehicle.hasKeys ? '✓ Keys' : '✗ No Keys'}
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
                                onClick={() => handleWatchlistToggle(vehicle)}
                                className={`text-${watchlist.has(vehicle.id) ? 'green' : 'blue'}-400 hover:text-${watchlist.has(vehicle.id) ? 'green' : 'blue'}-300 hover:bg-${watchlist.has(vehicle.id) ? 'green' : 'blue'}-400/10 rounded-full p-2 transition-all duration-200`}
                                title={watchlist.has(vehicle.id) ? "Remove from Watchlist" : "Add to Watchlist"}
                              >
                                <Heart className={`h-4 w-4 ${watchlist.has(vehicle.id) ? 'fill-current' : ''}`} />
                              </button>
                              <Link 
                                to={`/car/${vehicle.id}`}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-full p-2 transition-all duration-200"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
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
                                    <Eye className="h-4 w-4" />
                                    Additional Actions
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={() => handleWatchlistToggle(vehicle)}
                                      className={`flex items-center gap-2 px-3 py-2 text-white text-xs rounded-lg transition-colors duration-200 ${
                                        watchlist.has(vehicle.id) 
                                          ? 'bg-green-600 hover:bg-green-700' 
                                          : 'bg-blue-600 hover:bg-blue-700'
                                      }`}
                                    >
                                      <Heart className={`h-3 w-3 ${watchlist.has(vehicle.id) ? 'fill-current' : ''}`} />
                                      {watchlist.has(vehicle.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                                    </button>
                                    <Link 
                                      to={`/car/${vehicle.id}`}
                                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors duration-200"
                                    >
                                      <Eye className="h-3 w-3" />
                                      View Details
                                    </Link>
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
              Showing {filteredVehicles.length} live auction vehicle{filteredVehicles.length !== 1 ? 's' : ''}
              {filteredVehicles.length !== vehicles.length && (
                <span className="text-yellow-400"> (filtered from {vehicles.length} total)</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleFinder;