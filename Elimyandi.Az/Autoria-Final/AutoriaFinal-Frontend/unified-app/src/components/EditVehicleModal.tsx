import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import toast from 'react-hot-toast';
import { 
  Save, 
  X, 
  Upload, 
  Trash2, 
  Eye, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Car,
  Wrench,
  DollarSign,
  MapPin,
  Image as ImageIcon,
  Plus,
  Edit3
} from 'lucide-react';
import { getEnumLabel, getEnumValues } from '../services/enumService';
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

interface EditVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onSave: (updatedVehicle: Vehicle) => void;
}

interface FormData {
  make: string;
  model: string;
  year: number;
  vin: string;
  color: string;
  bodyStyle: string;
  mileage: number;
  mileageUnit: string;
  fuelType: number;
  damageType: number;
  carCondition: number;
  transmission: number;
  driveTrain: number;
  titleType: number;
  secondaryDamage: number;
  hasKeys: boolean;
  titleState: string;
  price: number;
  currency: string;
  estimatedRetailValue: number;
  locationId: string;
}

interface FormErrors {
  [key: string]: string;
}

const EditVehicleModal: React.FC<EditVehicleModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onSave
}) => {
  const [formData, setFormData] = useState<FormData>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    color: '',
    bodyStyle: '',
    mileage: 0,
    mileageUnit: 'km',
    fuelType: 0,
    damageType: 0,
    carCondition: 0,
    transmission: 0,
    driveTrain: 0,
    titleType: 0,
    secondaryDamage: 0,
    hasKeys: false,
    titleState: '',
    price: 0,
    currency: 'USD',
    estimatedRetailValue: 0,
    locationId: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [locations, setLocations] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<FormData | null>(null);

  const steps = [
    { id: 'basic', label: 'Basic Info', icon: Car },
    { id: 'technical', label: 'Technical', icon: Wrench },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'media', label: 'Media', icon: ImageIcon }
  ];

  useEffect(() => {
    if (isOpen && vehicle) {
      loadVehicleData();
      loadLocations();
    }
  }, [isOpen, vehicle]);

  useEffect(() => {
    if (originalData) {
      const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(hasFormChanges);
    }
  }, [formData, originalData]);

  const loadVehicleData = () => {
    if (!vehicle) return;

    const data: FormData = {
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      vin: vehicle.vin || '',
      color: vehicle.color || '',
      bodyStyle: vehicle.bodyStyle || '',
      mileage: vehicle.mileage || 0,
      mileageUnit: vehicle.mileageUnit || 'km',
      fuelType: vehicle.fuelType || 0,
      damageType: vehicle.damageType || 0,
      carCondition: vehicle.carCondition || 0,
      transmission: vehicle.transmission || 0,
      driveTrain: vehicle.driveTrain || 0,
      titleType: vehicle.titleType || 0,
      secondaryDamage: vehicle.secondaryDamage || 0,
      hasKeys: vehicle.hasKeys || false,
      titleState: vehicle.titleState || '',
      price: vehicle.price || 0,
      currency: vehicle.currency || 'USD',
      estimatedRetailValue: vehicle.estimatedRetailValue || 0,
      locationId: vehicle.locationId || ''
    };

    setFormData(data);
    setOriginalData(data);
    setErrors({});
    setActiveStep(0);
    setHasChanges(false);
  };

  const loadLocations = async () => {
    try {
      const locationsData = await apiClient.getLocations();
      setLocations(locationsData || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Valid year is required';
    }
    if (!formData.vin.trim() || formData.vin.length < 17) {
      newErrors.vin = 'Valid VIN is required (17 characters)';
    }
    if (formData.mileage < 0) newErrors.mileage = 'Mileage cannot be negative';
    if (formData.price < 0) newErrors.price = 'Price cannot be negative';
    if (formData.estimatedRetailValue < 0) newErrors.estimatedRetailValue = 'Estimated value cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setErrors({});
      
      // Prepare update data
      const updateData = {
        ...formData,
        // Convert enum values to numbers
        fuelType: Number(formData.fuelType),
        damageType: Number(formData.damageType),
        carCondition: Number(formData.carCondition),
        transmission: Number(formData.transmission),
        driveTrain: Number(formData.driveTrain),
        titleType: Number(formData.titleType),
        secondaryDamage: Number(formData.secondaryDamage)
      };

      // Update vehicle via API
      await apiClient.updateCar(vehicle!.id, updateData);
      
      // Update local vehicle data
      const updatedVehicle: Vehicle = {
        ...vehicle!,
        ...updateData,
        locationName: locations.find(loc => loc.id === formData.locationId)?.name || vehicle!.locationName
      };

      onSave(updatedVehicle);
      onClose();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      const errorMessage = 'Failed to update vehicle. Please try again.';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const renderStepContent = () => {
    switch (steps[activeStep].id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Make *</label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.make ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Toyota, BMW, Ford"
                />
                {errors.make && <p className="text-red-500 text-sm mt-1">{errors.make}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.model ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Camry, X5, F-150"
                />
                {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                <select
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.year ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {Array.from({ length: 30 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>{year}</option>
                    );
                  })}
                </select>
                {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">VIN *</label>
                <input
                  type="text"
                  value={formData.vin}
                  onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                    errors.vin ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="17-character VIN"
                  maxLength={17}
                />
                {errors.vin && <p className="text-red-500 text-sm mt-1">{errors.vin}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Red, Blue, Silver"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body Style</label>
                <input
                  type="text"
                  value={formData.bodyStyle}
                  onChange={(e) => handleInputChange('bodyStyle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Sedan, SUV, Coupe"
                />
              </div>
            </div>
          </div>
        );

      case 'technical':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Technical Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => handleInputChange('fuelType', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getEnumValues('FuelType').map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transmission</label>
                <select
                  value={formData.transmission}
                  onChange={(e) => handleInputChange('transmission', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getEnumValues('Transmission').map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Drive Train</label>
                <select
                  value={formData.driveTrain}
                  onChange={(e) => handleInputChange('driveTrain', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getEnumValues('DriveTrain').map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                <select
                  value={formData.carCondition}
                  onChange={(e) => handleInputChange('carCondition', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getEnumValues('CarCondition').map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mileage</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => handleInputChange('mileage', Number(e.target.value))}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.mileage ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                    min="0"
                  />
                  <select
                    value={formData.mileageUnit}
                    onChange={(e) => handleInputChange('mileageUnit', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="km">km</option>
                    <option value="miles">miles</option>
                  </select>
                </div>
                {errors.mileage && <p className="text-red-500 text-sm mt-1">{errors.mileage}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Has Keys</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.hasKeys === true}
                      onChange={() => handleInputChange('hasKeys', true)}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.hasKeys === false}
                      onChange={() => handleInputChange('hasKeys', false)}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Damage</label>
                <select
                  value={formData.damageType}
                  onChange={(e) => handleInputChange('damageType', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getEnumValues('DamageType').map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Damage</label>
                <select
                  value={formData.secondaryDamage}
                  onChange={(e) => handleInputChange('secondaryDamage', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getEnumValues('DamageType').map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title Type</label>
                <select
                  value={formData.titleType}
                  onChange={(e) => handleInputChange('titleType', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getEnumValues('TitleType').map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title State</label>
                <input
                  type="text"
                  value={formData.titleState}
                  onChange={(e) => handleInputChange('titleState', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., CA, NY, TX"
                />
              </div>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Financial Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', Number(e.target.value))}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.price ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="AZN">AZN</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Retail Value</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.estimatedRetailValue}
                    onChange={(e) => handleInputChange('estimatedRetailValue', Number(e.target.value))}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.estimatedRetailValue ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                    {formData.currency}
                  </span>
                </div>
                {errors.estimatedRetailValue && <p className="text-red-500 text-sm mt-1">{errors.estimatedRetailValue}</p>}
              </div>
            </div>

            {formData.price > 0 && formData.estimatedRetailValue > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Price Analysis</h4>
                <div className="text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Listed Price:</span>
                    <span className="font-medium">{formData.currency} {formData.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Value:</span>
                    <span className="font-medium">{formData.currency} {formData.estimatedRetailValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-blue-200">
                    <span>Difference:</span>
                    <span className={`font-medium ${
                      formData.price <= formData.estimatedRetailValue ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formData.price <= formData.estimatedRetailValue ? 'Good Deal' : 'Above Market Value'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={formData.locationId}
                onChange={(e) => handleInputChange('locationId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a location</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name} - {location.city}, {location.country}
                  </option>
                ))}
              </select>
            </div>

            {formData.locationId && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Selected Location Details</h4>
                {(() => {
                  const selectedLocation = locations.find(loc => loc.id === formData.locationId);
                  return selectedLocation ? (
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Name:</strong> {selectedLocation.name}</div>
                      <div><strong>Address:</strong> {selectedLocation.address}</div>
                      <div><strong>City:</strong> {selectedLocation.city}</div>
                      <div><strong>Country:</strong> {selectedLocation.country}</div>
                      {selectedLocation.phone && <div><strong>Phone:</strong> {selectedLocation.phone}</div>}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Media Management</h3>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Image Management</h4>
                <p className="text-gray-600 mb-4">
                  Vehicle images are managed separately. Use the "View Details" modal to see current images.
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  onClick={() => {
                    // This would open image management modal in a real implementation
                    alert('Image management feature would be implemented here');
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Manage Images
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900">Note</h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    Image upload and management functionality will be implemented in a future update. 
                    For now, images can be managed through the vehicle details view.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!vehicle) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={`Edit Vehicle - ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      size="xl"
      className="bg-gray-50"
    >
      <div className="bg-white">
        {/* Progress Steps */}
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === activeStep;
                const isCompleted = index < activeStep;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(index)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : isCompleted 
                          ? 'bg-green-100 text-green-700' 
                          : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{step.label}</span>
                    {isCompleted && <CheckCircle className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
            
            {hasChanges && (
              <div className="flex items-center gap-2 text-orange-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                Unsaved changes
              </div>
            )}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading vehicle data...</span>
            </div>
          ) : (
            <>
              {renderStepContent()}
              
              {errors.general && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="text-red-700 mt-1">{errors.general}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Previous
            </button>
            
            {activeStep < steps.length - 1 && (
              <button
                onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Next
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditVehicleModal;
