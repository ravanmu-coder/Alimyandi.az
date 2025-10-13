import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Plus, 
  Search, 
  Car, 
  DollarSign, 
  CheckCircle, 
  RefreshCw, 
  AlertTriangle,
  Settings,
  Calculator,
  Zap,
  Trash2,
  Edit3,
  Save,
  Loader2
} from 'lucide-react';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: string;
  onSuccess: () => void;
}

interface AvailableCar {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  estimatedRetailValue?: number;
  estimatedRetail?: number;
  estimatedRetailPrice?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  photos?: any[];
  mileage?: number;
  condition?: string;
  location?: string;
}

interface SelectedCar {
  carId: string;
  lotNumber: string;
  startingPrice: number;
  reservePrice: number;
  minPreBid: number;
  estimatedRetailValue?: number;
  carDetailLoading: boolean;
  startingPriceEditable: boolean;
  errors?: {
    lotNumber?: string;
    startingPrice?: string;
    reservePrice?: string;
    minPreBid?: string;
  };
}

interface BulkSettings {
  startingPriceMultiplier: number;
  reservePriceMultiplier: number;
  lotPrefix: string;
  startingPriceDelta: number;
  reservePriceDelta: number;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  auctionId,
  onSuccess
}) => {
  const [availableCars, setAvailableCars] = useState<AvailableCar[]>([]);
  const [selectedCars, setSelectedCars] = useState<Map<string, SelectedCar>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkSettings, setShowBulkSettings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usedLotNumbers, setUsedLotNumbers] = useState<Set<string>>(new Set());
  const [assignedCarIds, setAssignedCarIds] = useState<Set<string>>(new Set());
  const [thumbnailCache, setThumbnailCache] = useState<Map<string, string>>(new Map());
  const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(new Set());

  // Bulk operations settings
  const [bulkSettings, setBulkSettings] = useState<BulkSettings>({
    startingPriceMultiplier: 0.80, // 80% of estimated retail value
    reservePriceMultiplier: 0.90, // 90% of estimated retail value
    lotPrefix: 'LOT',
    startingPriceDelta: 0,
    reservePriceDelta: 0
  });

  // Load assigned car IDs to filter out already assigned vehicles
  const loadAssignedCarIds = async () => {
    try {
      console.log('Loading assigned car IDs from all auctions...');
      const { apiClient } = await import('../admin/services/apiClient');
      const allAuctionCars = await apiClient.getAuctionCars({ limit: 1000 });
      
      const assignedIds = new Set<string>();
      if (Array.isArray(allAuctionCars)) {
        allAuctionCars.forEach(auctionCar => {
          if (auctionCar.carId) {
            assignedIds.add(auctionCar.carId);
          }
        });
      } else if (allAuctionCars?.items && Array.isArray(allAuctionCars.items)) {
        allAuctionCars.items.forEach(auctionCar => {
          if (auctionCar.carId) {
            assignedIds.add(auctionCar.carId);
          }
        });
      }
      setAssignedCarIds(assignedIds);
      console.log(`Found ${assignedIds.size} assigned car IDs`);
    } catch (err) {
      console.error('Error loading assigned car IDs:', err);
      setAssignedCarIds(new Set());
    }
  };

  // Load available cars
  const loadAvailableCars = async () => {
    setLoading(true);
    try {
      const { apiClient } = await import('../lib/api');
      let cars = await apiClient.getCars().catch(() => []);
      
      if (!cars || cars.length === 0) {
        // Fallback to admin API
        const { apiClient: adminApiClient } = await import('../admin/services/apiClient');
        const allCars = await adminApiClient.getVehicles({ pageSize: 100 });
        cars = allCars.items || [];
      }
      
      // Filter out cars that are already assigned to any auction
      const availableCars = cars.filter(car => !assignedCarIds.has(car.id));
      
      console.log(`Filtered cars: ${cars.length} total → ${availableCars.length} available`);
      setAvailableCars(availableCars);
      
      // Load thumbnails for visible cars
      loadThumbnailsBatch(availableCars.slice(0, 20));
      
    } catch (err: any) {
      console.error('Error loading available cars:', err);
      setError(err.message || 'Failed to load available cars');
    } finally {
      setLoading(false);
    }
  };

  // Load car thumbnails
  const loadThumbnailsBatch = async (cars: AvailableCar[]) => {
    const batchSize = 6;
    for (let i = 0; i < cars.length; i += batchSize) {
      const batch = cars.slice(i, i + batchSize);
      await Promise.all(batch.map(car => loadCarThumbnail(car)));
    }
  };

  const loadCarThumbnail = async (car: AvailableCar) => {
    if (thumbnailCache.has(car.id) || loadingThumbnails.has(car.id)) {
      return;
    }

    setLoadingThumbnails(prev => new Set([...prev, car.id]));

    try {
      const { apiClient } = await import('../lib/api');
      const carData = await apiClient.getCar(car.id);
      
      let thumbnailUrl = '';
      
      // Extract thumbnail from various possible fields
      if (carData.photos && carData.photos.length > 0) {
        thumbnailUrl = carData.photos[0].thumbnailUrl || carData.photos[0].url;
      } else if (carData.thumbnailUrl) {
        thumbnailUrl = carData.thumbnailUrl;
      } else if (carData.photoUrls) {
        const photoUrls = Array.isArray(carData.photoUrls) 
          ? carData.photoUrls 
          : carData.photoUrls.split(';').filter((url: string) => url.trim() !== '');
        if (photoUrls.length > 0) {
          thumbnailUrl = photoUrls[0].trim();
        }
      }

      if (thumbnailUrl) {
        // Convert to full URL if needed
        if (!thumbnailUrl.startsWith('http')) {
          thumbnailUrl = `https://localhost:7249/${thumbnailUrl.replace(/^\//, '')}`;
        }
        setThumbnailCache(prev => new Map([...prev, [car.id, thumbnailUrl]]));
      }
    } catch (error) {
      console.error(`Failed to load thumbnail for car ${car.id}:`, error);
    } finally {
      setLoadingThumbnails(prev => {
        const newSet = new Set(prev);
        newSet.delete(car.id);
        return newSet;
      });
    }
  };

  // Generate unique lot number
  const generateUniqueLotNumber = (): string => {
    let lotNumber: string;
    let attempts = 0;
    const maxAttempts = 1000;
    
    do {
      const nextLotNumber = usedLotNumbers.size + 1;
      lotNumber = `${bulkSettings.lotPrefix}${nextLotNumber.toString().padStart(3, '0')}`;
      attempts++;
    } while (usedLotNumbers.has(lotNumber) && attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      const timestamp = Date.now().toString();
      lotNumber = `${bulkSettings.lotPrefix}${timestamp.slice(-6)}`;
    }
    
    setUsedLotNumbers(prev => new Set([...prev, lotNumber]));
    return lotNumber;
  };

  // Calculate prices based on estimated retail value
  const calculatePrices = (car: AvailableCar) => {
    const estimatedValue = car.estimatedRetailValue || car.estimatedRetail || car.estimatedRetailPrice || 0;
    
    if (estimatedValue > 0) {
      return {
        startingPrice: Math.round(estimatedValue * bulkSettings.startingPriceMultiplier + bulkSettings.startingPriceDelta),
        reservePrice: Math.round(estimatedValue * bulkSettings.reservePriceMultiplier + bulkSettings.reservePriceDelta)
      };
    }
    
    return {
      startingPrice: 1000 + bulkSettings.startingPriceDelta,
      reservePrice: 2000 + bulkSettings.reservePriceDelta
    };
  };

  // Add car to selection
  const handleCarSelect = (car: AvailableCar) => {
    const lotNumber = generateUniqueLotNumber();
    const prices = calculatePrices(car);
    
    const selectedCar: SelectedCar = {
      carId: car.id,
      lotNumber,
      startingPrice: prices.startingPrice,
      reservePrice: prices.reservePrice,
      minPreBid: Math.round(prices.startingPrice * 0.5),
      estimatedRetailValue: car.estimatedRetailValue || car.estimatedRetail || car.estimatedRetailPrice,
      carDetailLoading: false,
      startingPriceEditable: true
    };
    
    setSelectedCars(prev => new Map([...prev, [car.id, selectedCar]]));
  };

  // Remove car from selection
  const handleCarRemove = (carId: string) => {
    const selectedCar = selectedCars.get(carId);
    if (selectedCar) {
      setUsedLotNumbers(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedCar.lotNumber);
        return newSet;
      });
    }
    setSelectedCars(prev => {
      const newMap = new Map(prev);
      newMap.delete(carId);
      return newMap;
    });
  };

  // Update selected car data
  const handleCarDataChange = (carId: string, field: keyof SelectedCar, value: any) => {
    setSelectedCars(prev => {
      const newMap = new Map(prev);
      const car = newMap.get(carId);
      if (car) {
        newMap.set(carId, { ...car, [field]: value });
      }
      return newMap;
    });
  };

  // Apply bulk settings to all selected cars
  const applyBulkSettings = () => {
    setSelectedCars(prev => {
      const newMap = new Map();
      prev.forEach((car, carId) => {
        const availableCar = availableCars.find(c => c.id === carId);
        if (availableCar) {
          const prices = calculatePrices(availableCar);
          newMap.set(carId, {
            ...car,
            startingPrice: prices.startingPrice,
            reservePrice: prices.reservePrice,
            minPreBid: Math.round(prices.startingPrice * 0.5)
          });
        } else {
          newMap.set(carId, car);
        }
      });
      return newMap;
    });
  };

  // Submit selected cars
  const handleSubmit = async () => {
    if (selectedCars.size === 0) {
      setError('Please select at least one vehicle');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { apiClient } = await import('../admin/services/apiClient');
      
      const promises = Array.from(selectedCars.values()).map(async (car) => {
        const auctionCarData = {
          auctionId,
          carId: car.carId,
          lotNumber: car.lotNumber,
          startingPrice: car.startingPrice,
          reservePrice: car.reservePrice,
          minPreBid: car.minPreBid
        };
        
        return apiClient.createAuctionCar(auctionCarData);
      });

      await Promise.all(promises);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error adding vehicles:', err);
      setError(err.message || 'Failed to add vehicles to auction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter cars based on search term
  const filteredCars = availableCars.filter(car =>
    car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.year.toString().includes(searchTerm)
  );

  // Initialize data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAssignedCarIds().then(() => {
        loadAvailableCars();
      });
    } else {
      setSelectedCars(new Map());
      setThumbnailCache(new Map());
      setLoadingThumbnails(new Set());
      setUsedLotNumbers(new Set());
      setAssignedCarIds(new Set());
      setError('');
      setSearchTerm('');
    }
  }, [isOpen]);

  // Load available cars when assigned car IDs are loaded
  useEffect(() => {
    if (isOpen && assignedCarIds.size >= 0) {
      loadAvailableCars();
    }
  }, [isOpen, assignedCarIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Vehicles to Auction</h2>
            <p className="text-gray-600">Select vehicles and configure pricing</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBulkSettings(!showBulkSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Bulk Settings
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Bulk Settings Panel */}
        {showBulkSettings && (
          <div className="p-6 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Operations Settings</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pricing Multipliers */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Pricing Multipliers</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starting Price (% of retail value)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={bulkSettings.startingPriceMultiplier}
                    onChange={(e) => setBulkSettings(prev => ({
                      ...prev,
                      startingPriceMultiplier: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reserve Price (% of retail value)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={bulkSettings.reservePriceMultiplier}
                    onChange={(e) => setBulkSettings(prev => ({
                      ...prev,
                      reservePriceMultiplier: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Price Deltas */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Price Adjustments</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starting Price Delta ($)
                  </label>
                  <input
                    type="number"
                    value={bulkSettings.startingPriceDelta}
                    onChange={(e) => setBulkSettings(prev => ({
                      ...prev,
                      startingPriceDelta: parseInt(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reserve Price Delta ($)
                  </label>
                  <input
                    type="number"
                    value={bulkSettings.reservePriceDelta}
                    onChange={(e) => setBulkSettings(prev => ({
                      ...prev,
                      reservePriceDelta: parseInt(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Lot Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Lot Settings</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lot Prefix
                  </label>
                  <input
                    type="text"
                    value={bulkSettings.lotPrefix}
                    onChange={(e) => setBulkSettings(prev => ({
                      ...prev,
                      lotPrefix: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={applyBulkSettings}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  Apply to Selected ({selectedCars.size})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex h-[60vh]">
          {/* Available Cars */}
          <div className="flex-1 p-6 border-r">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={loadAvailableCars}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredCars.map((car) => {
                  const isSelected = selectedCars.has(car.id);
                  const thumbnailUrl = thumbnailCache.get(car.id);
                  const isLoadingThumbnail = loadingThumbnails.has(car.id);

                  return (
                    <div
                      key={car.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {isLoadingThumbnail ? (
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          ) : thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={`${car.make} ${car.model}`}
                              className="w-full h-full object-cover rounded-lg"
                              onError={() => {
                                setThumbnailCache(prev => {
                                  const newMap = new Map(prev);
                                  newMap.delete(car.id);
                                  return newMap;
                                });
                              }}
                            />
                          ) : (
                            <Car className="h-6 w-6 text-gray-400" />
                          )}
                        </div>

                        {/* Car Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {car.year} {car.make} {car.model}
                          </h3>
                          <p className="text-sm text-gray-600">VIN: {car.vin}</p>
                          {car.estimatedRetailValue && (
                            <p className="text-sm text-green-600">
                              Est. Value: ${car.estimatedRetailValue.toLocaleString()}
                            </p>
                          )}
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => isSelected ? handleCarRemove(car.id) : handleCarSelect(car)}
                          className={`p-2 rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {isSelected ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Cars */}
          <div className="w-96 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Selected Vehicles ({selectedCars.size})
            </h3>

            {selectedCars.size === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Car className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No vehicles selected</p>
                <p className="text-sm">Choose vehicles from the left panel</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Array.from(selectedCars.entries()).map(([carId, car]) => {
                  const availableCar = availableCars.find(c => c.id === carId);
                  return (
                    <div key={carId} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">
                          {availableCar ? `${availableCar.year} ${availableCar.make} ${availableCar.model}` : 'Unknown Vehicle'}
                        </h4>
                        <button
                          onClick={() => handleCarRemove(carId)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lot Number
                          </label>
                          <input
                            type="text"
                            value={car.lotNumber}
                            onChange={(e) => handleCarDataChange(carId, 'lotNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Starting Price
                          </label>
                          <input
                            type="number"
                            value={car.startingPrice}
                            onChange={(e) => handleCarDataChange(carId, 'startingPrice', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reserve Price
                          </label>
                          <input
                            type="number"
                            value={car.reservePrice}
                            onChange={(e) => handleCarDataChange(carId, 'reservePrice', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Pre-Bid
                          </label>
                          <input
                            type="number"
                            value={car.minPreBid}
                            onChange={(e) => handleCarDataChange(carId, 'minPreBid', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {assignedCarIds.size > 0 && (
              <span>{assignedCarIds.size} vehicles already assigned to other auctions</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedCars.size === 0 || isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add {selectedCars.size} Vehicle{selectedCars.size !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
