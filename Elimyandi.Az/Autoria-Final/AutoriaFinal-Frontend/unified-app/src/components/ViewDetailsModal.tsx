import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import CarPhotos from './CarPhotos';
import { 
  Calendar, 
  Gauge, 
  Hash, 
  Palette, 
  Fuel, 
  Wrench, 
  MapPin,
  Car,
  Key,
  DollarSign,
  Clock,
  User,
  Printer,
  Share2,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { getEnumLabel, getEnumBadgeClasses } from '../services/enumService';
import { apiClient } from '../lib/api';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  color?: string;
  bodyStyle?: string;
  mileage?: number;
  mileageUnit?: string;
  fuelType?: number;
  damageType?: number;
  carCondition?: number;
  transmission?: number;
  driveTrain?: number;
  titleType?: number;
  secondaryDamage?: number;
  hasKeys?: boolean;
  titleState?: string;
  price?: number;
  currency?: string;
  estimatedRetailValue?: number;
  locationId?: string;
  locationName?: string;
  locationAddress?: string;
  locationCity?: string;
  createdAt?: string;
  updatedAtUtc?: string;
  ownerId?: string;
  ownerUsername?: string;
  photoUrls?: string[];
  videoUrls?: string[];
}

interface ViewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({
  isOpen,
  onClose,
  vehicle
}) => {
  const [loading, setLoading] = useState(false);
  const [detailedVehicle, setDetailedVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'financial' | 'media' | 'history'>('overview');

  useEffect(() => {
    if (isOpen && vehicle) {
      loadDetailedVehicle();
    }
  }, [isOpen, vehicle]);

  const loadDetailedVehicle = async () => {
    if (!vehicle) return;

    try {
      setLoading(true);
      // Fetch detailed vehicle data
      const detailed = await apiClient.getCar(vehicle.id);
      
      // Merge with existing vehicle data
      const mergedVehicle: Vehicle = {
        ...vehicle,
        ...detailed,
        // Ensure photoUrls is properly processed
        photoUrls: detailed.photoUrls || vehicle.photoUrls || []
      };
      
      setDetailedVehicle(mergedVehicle);
    } catch (error) {
      console.error('Error loading detailed vehicle data:', error);
      setDetailedVehicle(vehicle);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share && detailedVehicle) {
      try {
        await navigator.share({
          title: `${detailedVehicle.year} ${detailedVehicle.make} ${detailedVehicle.model}`,
          text: `Check out this vehicle: ${detailedVehicle.year} ${detailedVehicle.make} ${detailedVehicle.model}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Car },
    { id: 'technical', label: 'Technical', icon: Wrench },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'media', label: 'Media', icon: Eye },
    { id: 'history', label: 'History', icon: Clock }
  ];

  if (!vehicle) return null;

  const displayVehicle = detailedVehicle || vehicle;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${displayVehicle.year} ${displayVehicle.make} ${displayVehicle.model}`}
      size="xl"
      className="bg-gray-50"
    >
      <div className="bg-white">
        {/* Header Actions */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-lg shadow-sm overflow-hidden">
              <CarPhotos 
                carId={displayVehicle.id} 
                showMultiple={false}
                className="w-full h-full object-cover"
                enableGallery={false}
                lazyLoad={false}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {displayVehicle.year} {displayVehicle.make} {displayVehicle.model}
              </h3>
              <p className="text-sm text-gray-600">VIN: {displayVehicle.vin}</p>
              {displayVehicle.price && (
                <p className="text-lg font-bold text-green-600 mt-1">
                  {formatPrice(displayVehicle.price, displayVehicle.currency)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors duration-200"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors duration-200"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading details...</span>
            </div>
          )}

          {!loading && (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Basic Information
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Make & Model:</span>
                        <span className="font-medium">{displayVehicle.make} {displayVehicle.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Year:</span>
                        <span className="font-medium">{displayVehicle.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">VIN:</span>
                        <span className="font-medium font-mono text-sm">{displayVehicle.vin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Color:</span>
                        <span className="font-medium">{displayVehicle.color || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Body Style:</span>
                        <span className="font-medium">{displayVehicle.bodyStyle || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{displayVehicle.locationName || 'N/A'}</span>
                      </div>
                      {displayVehicle.locationAddress && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium text-right">{displayVehicle.locationAddress}</span>
                        </div>
                      )}
                      {displayVehicle.locationCity && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">City:</span>
                          <span className="font-medium">{displayVehicle.locationCity}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Status
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {displayVehicle.carCondition !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Condition:</span>
                          <span className={getEnumBadgeClasses('CarCondition', displayVehicle.carCondition)}>
                            {getEnumLabel('CarCondition', displayVehicle.carCondition)}
                          </span>
                        </div>
                      )}
                      {displayVehicle.titleType !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Title Type:</span>
                          <span className={getEnumBadgeClasses('TitleType', displayVehicle.titleType)}>
                            {getEnumLabel('TitleType', displayVehicle.titleType)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Has Keys:</span>
                        <span className={`flex items-center gap-1 ${displayVehicle.hasKeys ? 'text-green-600' : 'text-red-600'}`}>
                          {displayVehicle.hasKeys ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          {displayVehicle.hasKeys ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Owner Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Owner
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Owner:</span>
                        <span className="font-medium">{displayVehicle.ownerUsername || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Added:</span>
                        <span className="font-medium">{formatDate(displayVehicle.createdAt)}</span>
                      </div>
                      {displayVehicle.updatedAtUtc && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Updated:</span>
                          <span className="font-medium">{formatDate(displayVehicle.updatedAtUtc)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Tab */}
              {activeTab === 'technical' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Engine & Performance */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Fuel className="h-5 w-5" />
                      Engine & Performance
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {displayVehicle.fuelType !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Fuel Type:</span>
                          <span className={getEnumBadgeClasses('FuelType', displayVehicle.fuelType)}>
                            {getEnumLabel('FuelType', displayVehicle.fuelType)}
                          </span>
                        </div>
                      )}
                      {displayVehicle.transmission !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Transmission:</span>
                          <span className={getEnumBadgeClasses('Transmission', displayVehicle.transmission)}>
                            {getEnumLabel('Transmission', displayVehicle.transmission)}
                          </span>
                        </div>
                      )}
                      {displayVehicle.driveTrain !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Drive Train:</span>
                          <span className={getEnumBadgeClasses('DriveTrain', displayVehicle.driveTrain)}>
                            {getEnumLabel('DriveTrain', displayVehicle.driveTrain)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mileage & Usage */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Gauge className="h-5 w-5" />
                      Mileage & Usage
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mileage:</span>
                        <span className="font-medium">{formatMileage(displayVehicle.mileage, displayVehicle.mileageUnit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unit:</span>
                        <span className="font-medium">{displayVehicle.mileageUnit || 'km'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Damage Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Damage Information
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {displayVehicle.damageType !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Primary Damage:</span>
                          <span className={getEnumBadgeClasses('DamageType', displayVehicle.damageType)}>
                            {getEnumLabel('DamageType', displayVehicle.damageType)}
                          </span>
                        </div>
                      )}
                      {displayVehicle.secondaryDamage !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Secondary Damage:</span>
                          <span className={getEnumBadgeClasses('DamageType', displayVehicle.secondaryDamage)}>
                            {getEnumLabel('DamageType', displayVehicle.secondaryDamage)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Title Information
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {displayVehicle.titleType !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Title Type:</span>
                          <span className={getEnumBadgeClasses('TitleType', displayVehicle.titleType)}>
                            {getEnumLabel('TitleType', displayVehicle.titleType)}
                          </span>
                        </div>
                      )}
                      {displayVehicle.titleState && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Title State:</span>
                          <span className="font-medium">{displayVehicle.titleState}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Tab */}
              {activeTab === 'financial' && (
                <div className="space-y-6">
                  {/* Pricing Information */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                      <DollarSign className="h-5 w-5" />
                      Pricing Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {displayVehicle.price && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-gray-600 mb-1">Listed Price</div>
                          <div className="text-2xl font-bold text-green-600">
                            {formatPrice(displayVehicle.price, displayVehicle.currency)}
                          </div>
                        </div>
                      )}
                      {displayVehicle.estimatedRetailValue && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-gray-600 mb-1">Estimated Retail Value</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {formatPrice(displayVehicle.estimatedRetailValue, displayVehicle.currency)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {displayVehicle.price && displayVehicle.estimatedRetailValue && (
                      <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Price vs Value:</span>
                          <span className={`font-semibold ${
                            displayVehicle.price <= displayVehicle.estimatedRetailValue 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {displayVehicle.price <= displayVehicle.estimatedRetailValue 
                              ? 'Good Deal' 
                              : 'Above Market Value'
                            }
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="text-xs text-gray-500">
                            Difference: {formatPrice(
                              Math.abs(displayVehicle.price - displayVehicle.estimatedRetailValue), 
                              displayVehicle.currency
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Currency Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-3">Currency Details</h5>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Currency:</span>
                      <span className="font-medium">{displayVehicle.currency || 'USD'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Media Gallery
                  </h4>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <CarPhotos 
                      carId={displayVehicle.id} 
                      showMultiple={true}
                      maxImages={12}
                      enableGallery={true}
                      lazyLoad={true}
                      className="w-full"
                    />
                  </div>

                  {displayVehicle.videoUrls && displayVehicle.videoUrls.length > 0 && (
                    <div className="space-y-4">
                      <h5 className="font-semibold text-gray-900">Videos</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayVehicle.videoUrls.map((videoUrl, index) => (
                          <div key={index} className="bg-gray-100 rounded-lg p-4">
                            <video 
                              controls 
                              className="w-full rounded-lg"
                              src={videoUrl}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Vehicle History
                  </h4>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-600">Vehicle Created</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatDate(displayVehicle.createdAt)}</div>
                          <div className="text-sm text-gray-500">by {displayVehicle.ownerUsername || 'Unknown'}</div>
                        </div>
                      </div>
                      
                      {displayVehicle.updatedAtUtc && displayVehicle.updatedAtUtc !== displayVehicle.createdAt && (
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-600">Last Updated</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatDate(displayVehicle.updatedAtUtc)}</div>
                            <div className="text-sm text-gray-500">Information modified</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional History Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-3">Additional Information</h5>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>Vehicle ID: {displayVehicle.id}</div>
                      <div>Owner ID: {displayVehicle.ownerId || 'N/A'}</div>
                      <div>Location ID: {displayVehicle.locationId || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ViewDetailsModal;
