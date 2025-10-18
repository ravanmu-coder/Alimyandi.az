import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';
import { 
  Upload, 
  X, 
  Camera, 
  Video, 
  CheckCircle, 
  AlertCircle,
  Loader2,  
  Car,
  Calendar,
  Gauge,
  Hash,
  Palette,
  Fuel,
  Wrench,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Star,
  ChevronDown,
  Settings,
  Cog,
  FileText,
  Shield
} from 'lucide-react';
import { Combobox } from '@headlessui/react';
import { 
  colorOptions, 
  bodyStyleOptions, 
  currencyOptions, 
  mileageUnitOptions,
  fuelTypeOptions,
  damageTypeOptions,
  secondaryDamageOptions,
  carConditionOptions,
  transmissionOptions,
  driveTrainOptions,
  titleTypeOptions,
  titleStateOptions,
  hasKeysOptions
} from '../data/carBrands';
import { carMakes, popularBrands, CarMake } from '../constants/carMakes';
import { getEnumLabel } from '../services/enumService';
import * as SiIcons from 'react-icons/si';

// Comprehensive TypeScript Interfaces
interface VehicleFormData {
  // Basic Information
  make: string;
  model: string;
  year: number;
  vin: string;
  color: string;
  bodyStyle: string;
  
  // Enum Fields (numeric values matching backend)
  fuelType: number;
  damageType: number;
  secondaryDamage: number;
  transmission: number;
  driveTrain: number;
  carCondition: number;
  titleType: number;
  
  // Additional Fields
  mileage: number;
  mileageUnit: string;
  price: number;
  currency: string;
  locationId: string;
  hasKeys: boolean;
  titleState: string;
  estimatedRetailValue: number;
}

interface LocationOption {
  id: string;
  name: string;
}

interface ValidationErrors {
  [key: string]: string;
}


// Step Component Interfaces
interface Step1Props {
  selectedBrand: CarMake | null;
  brandQueryRef: React.RefObject<HTMLInputElement>;
  handleBrandSelect: (brand: CarMake | null) => void;
  goToStep: (step: number) => void;
}

interface Step2Props {
  errors: Record<string, string>;
  selectedBrand: CarMake | null;
  selectedYear: number | null;
  modelInputValue: string;
  showModelDropdown: boolean;
  filteredModels: string[];
  modelSearchTermRef: React.RefObject<HTMLInputElement>;
  yearRef: React.RefObject<HTMLSelectElement>;
  handleModelSelect: (model: string) => void;
  handleModelInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleModelInputFocus: () => void;
  handleModelInputBlur: () => void;
  handleYearSelect: (year: number) => void;
}

interface Step3Props {
  formData: VehicleFormData;
  errors: ValidationErrors;
  selectedColor: string;
  locationOptions: LocationOption[];
  vinRef: React.RefObject<HTMLInputElement>;
  bodyStyleRef: React.RefObject<HTMLSelectElement>;
  fuelTypeRef: React.RefObject<HTMLSelectElement>;
  damageTypeRef: React.RefObject<HTMLSelectElement>;
  secondaryDamageRef: React.RefObject<HTMLSelectElement>;
  transmissionRef: React.RefObject<HTMLSelectElement>;
  driveTrainRef: React.RefObject<HTMLSelectElement>;
  carConditionRef: React.RefObject<HTMLSelectElement>;
  titleTypeRef: React.RefObject<HTMLSelectElement>;
  mileageRef: React.RefObject<HTMLInputElement>;
  mileageUnitRef: React.RefObject<HTMLSelectElement>;
  priceRef: React.RefObject<HTMLInputElement>;
  currencyRef: React.RefObject<HTMLSelectElement>;
  locationIdRef: React.RefObject<HTMLSelectElement>;
  hasKeysRef: React.RefObject<HTMLSelectElement>;
  titleStateRef: React.RefObject<HTMLSelectElement>;
  estimatedRetailValueRef: React.RefObject<HTMLInputElement>;
  handleInputChange: (field: keyof VehicleFormData, value: string | number | boolean) => void;
  handleColorSelect: (color: string) => void;
}

interface Step4Props {
  images: File[];
  imagePreviews: string[];
  videoPreview: string | null;
  dragOver: boolean;
  errors: Record<string, string>;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, type: 'image' | 'video') => void;
  removeFile: (type: 'image' | 'video', index?: number) => void;
}

interface Step5Props {
  formData: VehicleFormData;
  selectedBrand: CarMake | null;
  selectedColor: string;
  locationOptions: LocationOption[];
  images: File[];
  errors: ValidationErrors;
  loading: boolean;
}

const BrandIcon = ({ iconName, ...props }: { iconName: string } & React.SVGProps<SVGSVGElement>) => {
  const IconComponent = (SiIcons as any)[`Si${iconName}`];

  if (IconComponent) {
    return <IconComponent {...props} />;
  }

  // Fallback icon
  return <Car {...props} />;
};

// Step Components - Extracted outside main component to prevent re-renders
const Step1BrandSelection: React.FC<Step1Props> = ({ selectedBrand, brandQueryRef, handleBrandSelect, goToStep }) => {
  // Filter brands based on search query
  const getFilteredBrands = () => {
    const query = brandQueryRef.current?.value || '';
    return query === ''
      ? carMakes
      : carMakes.filter((brand) =>
          brand.name.toLowerCase().includes(query.toLowerCase())
        );
  };
  
  const filteredBrands = getFilteredBrands();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
          <Car className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Markanı Seçin</h2>
        <p className="text-slate-300">Avtomobilinizin markasını seçin</p>
      </div>

      {/* Brand Selection Dropdown */}
      <div className="max-w-2xl mx-auto">
        <Combobox value={selectedBrand} onChange={handleBrandSelect}>
          <div className="relative">
            <div className="relative">
              <Combobox.Input
                ref={brandQueryRef}
                className="w-full px-4 py-4 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300 pr-12"
                placeholder="Marka axtarın..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission
                  }
                }}
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-4">
                <ChevronDown className="h-5 w-5 text-slate-400" />
              </Combobox.Button>
            </div>

            <Combobox.Options className="absolute z-50 mt-2 w-full bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-xl max-h-96 overflow-y-auto custom-scrollbar">
              {/* Popular Brands Section */}
              {brandQueryRef.current?.value === '' && (
                <div className="p-4 border-b border-slate-700/50">
                  <h3 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Məşhur Markalar
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {popularBrands.map((brand) => (
                      <button
                        key={brand.id}
                        type="button"
                        onClick={() => handleBrandSelect(brand)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors duration-200 text-left w-full"
                      >
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                          <BrandIcon iconName={brand.iconName} className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-white font-medium text-sm">{brand.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              <div className="p-2">
                {filteredBrands.length === 0 && brandQueryRef.current?.value !== '' ? (
                  <div className="p-4 text-center text-slate-400">
                    Heç bir marka tapılmadı
                  </div>
                ) : (
                  filteredBrands.map((brand) => (
                    <Combobox.Option
                      key={brand.id}
                      value={brand}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-3 px-4 rounded-lg transition-colors duration-200 ${
                          active ? 'bg-slate-700/50' : ''
                        }`
                      }
                    >
                      {({ selected }) => (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                            <BrandIcon iconName={brand.iconName} className="w-5 h-5 text-blue-400" />
                          </div>
                          <span className={`font-medium text-sm ${
                            selected ? 'text-blue-400' : 'text-white'
                          }`}>
                            {brand.name}
                          </span>
                          {selected && (
                            <CheckCircle className="w-5 h-5 text-blue-400 ml-auto" />
                          )}
                        </div>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </div>
            </Combobox.Options>
          </div>
        </Combobox>
      </div>

      {/* Selected Brand Display */}
      {selectedBrand && (
        <div className="max-w-2xl mx-auto mt-6">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <BrandIcon iconName={selectedBrand.iconName} className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{selectedBrand.name}</h3>
                <p className="text-slate-400 text-sm">{selectedBrand.models.length} model mövcuddur</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  handleBrandSelect(null);
                  goToStep(1);
                }}
                className="ml-auto text-sm text-blue-400 hover:text-blue-300 font-semibold"
              >
                Dəyişdir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Step2ModelYear: React.FC<Step2Props> = ({ 
  errors, 
  selectedBrand, 
  selectedYear, 
  modelInputValue, 
  showModelDropdown, 
  filteredModels, 
  modelSearchTermRef, 
  yearRef, 
  handleModelSelect, 
  handleModelInputChange, 
  handleModelInputFocus, 
  handleModelInputBlur, 
  handleYearSelect 
}) => {
  // Generate year options
  const yearOptions = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-4">
          <Calendar className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Model və İl</h2>
        <p className="text-slate-300">
          {selectedBrand && (
            <span className="text-blue-300 font-semibold">{selectedBrand.name}</span>
          )} üçün model və ili seçin
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Model Selection */}
        <div className="space-y-4">
          <label className="block text-white font-medium text-lg">
            Model Seçin *
          </label>
          <div className="relative">
            <input
              ref={modelSearchTermRef}
              type="text"
              value={modelInputValue}
              onChange={handleModelInputChange}
              onFocus={handleModelInputFocus}
              onBlur={handleModelInputBlur}
              className="w-full px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300"
              placeholder="Model axtarın..."
            />
            {showModelDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto">
                {filteredModels.map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => handleModelSelect(model)}
                    className="w-full px-4 py-3 text-left text-white hover:bg-slate-700/50 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl"
                  >
                    {model}
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.model && <p className="text-red-400 text-sm">{errors.model}</p>}
        </div>

        {/* Year Selection */}
        <div className="space-y-4">
          <label className="block text-white font-medium text-lg">
            Buraxılış İli *
          </label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[2024, 2023, 2022].map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => handleYearSelect(year)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  selectedYear === year
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
          <select
            ref={yearRef}
            className="w-full px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300"
          >
            {yearOptions.map(year => (
              <option key={year} value={year} className="bg-slate-800 text-white">
                {year}
              </option>
            ))}
          </select>
          {errors.year && <p className="text-red-400 text-sm">{errors.year}</p>}
        </div>
      </div>
    </div>
  );
};

const Step3TechnicalSpecs: React.FC<Step3Props> = ({
  formData,
  errors,
  selectedColor,
  locationOptions,
  vinRef,
  bodyStyleRef,
  fuelTypeRef,
  damageTypeRef,
  secondaryDamageRef,
  transmissionRef,
  driveTrainRef,
  carConditionRef,
  titleTypeRef,
  mileageRef,
  mileageUnitRef,
  priceRef,
  currencyRef,
  locationIdRef,
  hasKeysRef,
  titleStateRef,
  estimatedRetailValueRef,
  handleInputChange,
  handleColorSelect
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-4">
          <Wrench className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Texniki Göstəricilər</h2>
        <p className="text-slate-300">Avtomobilinizin texniki məlumatlarını daxil edin</p>
      </div>

      {/* 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Basic Information */}
        <div className="space-y-6">
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-400" />
              Əsas Məlumatlar
            </h3>
            
            {/* VIN */}
            <div className="space-y-2 mb-4">
              <label className="block text-white font-medium">
                <Hash className="h-4 w-4 inline mr-2" />
                VIN Nömrəsi *
              </label>
              <input
                ref={vinRef}
                type="text"
                value={formData.vin}
                onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
                maxLength={17}
                aria-label="VIN nömrəsi"
                aria-describedby="vin-help"
                className={`w-full px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300 ${
                  errors.vin ? 'border-red-400' : ''
                }`}
                placeholder="VIN nömrəsini daxil edin"
              />
              <div id="vin-help" className="text-xs text-slate-400 mt-1">
                VIN nömrəsi tam 17 simvol olmalıdır və yalnız hərflər və rəqəmlərdən ibarət olmalıdır
              </div>
              {errors.vin && <p className="text-red-400 text-sm">{errors.vin}</p>}
            </div>

            {/* Body Style */}
            <div className="space-y-2 mb-4">
              <label className="block text-white font-medium">
                <Car className="h-4 w-4 inline mr-2" />
                Gövdə Tipi *
              </label>
              <select
                ref={bodyStyleRef}
                value={formData.bodyStyle}
                onChange={(e) => handleInputChange('bodyStyle', e.target.value)}
                aria-label="Gövdə tipi seçimi"
                className={`w-full px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300 ${
                  errors.bodyStyle ? 'border-red-400' : ''
                }`}
              >
                <option value="">Gövdə tipini seçin</option>
                {bodyStyleOptions.map(style => (
                  <option key={style} value={style} className="bg-slate-800 text-white">
                    {style}
                  </option>
                ))}
              </select>
              {errors.bodyStyle && <p className="text-red-400 text-sm">{errors.bodyStyle}</p>}
            </div>

            {/* Color Selection */}
            <div className="space-y-2">
              <label className="block text-white font-medium">
                <Palette className="h-4 w-4 inline mr-2" />
                Rəng *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleColorSelect(color.name)}
                    aria-label={`${color.name} rəngini seç`}
                    aria-pressed={selectedColor === color.name}
                    className={`relative p-2 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                      selectedColor === color.name
                        ? 'border-blue-400 shadow-lg shadow-blue-500/25'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    <span 
                      className="text-xs font-medium"
                      style={{ color: color.textColor }}
                    >
                      {color.name}
                    </span>
                    {selectedColor === color.name && (
                      <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-blue-400 bg-white rounded-full" />
                    )}
                  </button>
                ))}
              </div>
              {errors.color && <p className="text-red-400 text-sm">{errors.color}</p>}
            </div>
          </div>
        </div>

        {/* Column 2: Technical Specifications */}
        <div className="space-y-6">
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-400" />
              Texniki Spesifikasiyalar
            </h3>
            
            {/* Fuel Type */}
            <div className="space-y-2 mb-4">
              <label className="block text-white font-medium">
                <Fuel className="h-4 w-4 inline mr-2" />
                Yanacaq Növü *
              </label>
              <select
                ref={fuelTypeRef}
                value={formData.fuelType}
                onChange={(e) => handleInputChange('fuelType', parseInt(e.target.value))}
                className={`w-full px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300 ${errors.fuelType ? 'border-red-400' : ''}`}
              >
                <option value={0}>Yanacaq növünü seçin</option>
                {fuelTypeOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.fuelType && <p className="text-red-400 text-sm">{errors.fuelType}</p>}
            </div>

            {/* Transmission */}
            <div className="space-y-2 mb-4">
              <label className="block text-white font-medium">
                <Settings className="h-4 w-4 inline mr-2" />
                Ötürücü *
              </label>
              <select
                ref={transmissionRef}
                value={formData.transmission}
                onChange={(e) => handleInputChange('transmission', parseInt(e.target.value))}
                aria-label="Ötürücü növü seçimi"
                className={`w-full px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300 ${errors.transmission ? 'border-red-400' : ''}`}
              >
                <option value={0}>Ötürücü növünü seçin</option>
                {transmissionOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.transmission && <p className="text-red-400 text-sm">{errors.transmission}</p>}
            </div>

            {/* Drive Train */}
            <div className="space-y-2 mb-4">
              <label className="block text-white font-medium">
                <Cog className="h-4 w-4 inline mr-2" />
                Ötürücü Sistemi *
              </label>
              <select
                ref={driveTrainRef}
                value={formData.driveTrain}
                onChange={(e) => handleInputChange('driveTrain', parseInt(e.target.value))}
                aria-label="Ötürücü sistemi seçimi"
                className={`w-full px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300 ${errors.driveTrain ? 'border-red-400' : ''}`}
              >
                <option value={0}>Ötürücü sistemini seçin</option>
                {driveTrainOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.driveTrain && <p className="text-red-400 text-sm">{errors.driveTrain}</p>}
            </div>

            {/* Mileage */}
            <div className="space-y-2">
              <label className="block text-white font-medium">
                <Gauge className="h-4 w-4 inline mr-2" />
                Yürüş
              </label>
              <div className="flex gap-2">
                <input
                  ref={mileageRef}
                  type="number"
                  value={formData.mileage === 0 ? '' : formData.mileage}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                    handleInputChange('mileage', isNaN(value) ? 0 : value);
                  }}
                  min="0"
                  step="1"
                  required
                  className="flex-1 px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300"
                  placeholder="Yürüş məsafəsi (km)"
                />
                <select
                  ref={mileageUnitRef}
                  value={formData.mileageUnit}
                  onChange={(e) => handleInputChange('mileageUnit', e.target.value)}
                  className="px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300"
                >
                  {mileageUnitOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.mileage && (
                <p className="text-red-400 text-sm mt-1">{errors.mileage}</p>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Condition & Legal */}
        <div className="space-y-6">
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-400" />
              Vəziyyət və Hüquqi
            </h3>
            
            {/* Damage Type */}
            <div className="space-y-2 mb-4">
              <label className="block text-white font-medium">
                <Wrench className="h-4 w-4 inline mr-2" />
                Zədə Növü *
              </label>
              <select
                ref={damageTypeRef}
                value={formData.damageType}
                onChange={(e) => handleInputChange('damageType', parseInt(e.target.value))}
                className={`w-full px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300 ${errors.damageType ? 'border-red-400' : ''}`}
              >
                <option value={0}>Zədə növünü seçin</option>
                {damageTypeOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.damageType && <p className="text-red-400 text-sm">{errors.damageType}</p>}
            </div>

            {/* Secondary Damage */}
            <div className="space-y-2 mb-4">
              <label className="block text-white font-medium">
                <Wrench className="h-4 w-4 inline mr-2" />
                İkincil Zədə
              </label>
              <select
                ref={secondaryDamageRef}
                value={formData.secondaryDamage}
                onChange={(e) => handleInputChange('secondaryDamage', parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300"
              >
                <option value={0}>İkincil zədə seçin</option>
                {secondaryDamageOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Car Condition */}
            <div className="space-y-2 mb-4">
              <label className="block text-white font-medium">
                <Shield className="h-4 w-4 inline mr-2" />
                Avtomobil Vəziyyəti *
              </label>
              <select
                ref={carConditionRef}
                value={formData.carCondition}
                onChange={(e) => handleInputChange('carCondition', parseInt(e.target.value))}
                aria-label="Avtomobil vəziyyəti seçimi"
                className={`w-full px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300 ${errors.carCondition ? 'border-red-400' : ''}`}
              >
                <option value={0}>Avtomobil vəziyyətini seçin</option>
                {carConditionOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.carCondition && <p className="text-red-400 text-sm">{errors.carCondition}</p>}
            </div>

            {/* Title Type */}
            <div className="space-y-2 mb-4">
              <label className="block text-white font-medium">
                <FileText className="h-4 w-4 inline mr-2" />
                Sənəd Növü *
              </label>
              <select
                ref={titleTypeRef}
                value={formData.titleType}
                onChange={(e) => handleInputChange('titleType', parseInt(e.target.value))}
                aria-label="Sənəd növü seçimi"
                className={`w-full px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300 ${errors.titleType ? 'border-red-400' : ''}`}
              >
                <option value={0}>Sənəd növünü seçin</option>
                {titleTypeOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.titleType && <p className="text-red-400 text-sm">{errors.titleType}</p>}
            </div>

            {/* Has Keys */}
            <div className="space-y-2">
              <label className="block text-white font-medium">
                <Settings className="h-4 w-4 inline mr-2" />
                Açarı Var?
              </label>
              <select
                ref={hasKeysRef}
                value={formData.hasKeys.toString()}
                onChange={(e) => handleInputChange('hasKeys', e.target.value === 'true')}
                className="w-full px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300"
              >
                {hasKeysOptions.map(option => (
                  <option key={option.value.toString()} value={option.value.toString()} className="bg-slate-800 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Price, Location, and Additional Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Price */}
        <div className="space-y-2">
          <label className="block text-white font-medium">
            <DollarSign className="h-4 w-4 inline mr-2" />
            Qiymət *
          </label>
          <div className="flex gap-2">
            <input
              ref={priceRef}
              type="number"
              step="0.01"
              min="0.01"
              value={formData.price || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                handleInputChange('price', !isNaN(value) && value > 0 ? value : 0);
              }}
              className={`flex-1 px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300 ${
                errors.price ? 'border-red-400' : ''
              }`}
              placeholder="Qiymət"
            />
            <select
              ref={currencyRef}
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300"
            >
              {currencyOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {errors.price && <p className="text-red-400 text-sm">{errors.price}</p>}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="block text-white font-medium">
            <Car className="h-4 w-4 inline mr-2" />
            Məkan *
          </label>
          <select
            ref={locationIdRef}
            value={formData.locationId}
            onChange={(e) => handleInputChange('locationId', e.target.value)}
            className={`w-full px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300 ${
              errors.locationId ? 'border-red-400' : ''
            }`}
          >
            <option value="">Məkanı seçin</option>
            {locationOptions.map(option => (
              <option key={option.id} value={option.id} className="bg-slate-800 text-white">
                {option.name}
              </option>
            ))}
          </select>
          {errors.locationId && <p className="text-red-400 text-sm">{errors.locationId}</p>}
        </div>

        {/* Title State */}
        <div className="space-y-2">
          <label className="block text-white font-medium">
            <FileText className="h-4 w-4 inline mr-2" />
            Sənəd Ştatı
          </label>
          <select
            ref={titleStateRef}
            value={formData.titleState}
            onChange={(e) => handleInputChange('titleState', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300"
          >
            {titleStateOptions.map(option => (
              <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Estimated Retail Value - Always visible */}
      <div className="space-y-2">
        <label className="block text-white font-medium">
          <DollarSign className="h-4 w-4 inline mr-2" />
          Təxmini Satış Qiyməti
        </label>
        <input
          ref={estimatedRetailValueRef}
          type="number"
          step="0.01"
          min="0"
          value={formData.estimatedRetailValue || ''}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            handleInputChange('estimatedRetailValue', !isNaN(value) && value >= 0 ? value : 0);
          }}
          className="w-full px-4 py-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-slate-800/60 transition-all duration-300"
          placeholder="Təxmini satış qiyməti (məsələn: 25000)"
        />
      </div>
    </div>
  );
};

const Step4MediaUpload: React.FC<Step4Props> = ({
  images,
  imagePreviews,
  videoPreview,
  dragOver,
  errors,
  handleFileInputChange,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  removeFile
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mb-4">
          <Camera className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Şəkil və Video</h2>
        <p className="text-slate-300">Avtomobilinizin şəkillərini və videosunu yükləyin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Upload */}
        <div className="space-y-4">
          <label className="block text-white font-medium text-lg">
            Şəkillər ({images.length}/15)
          </label>
          
          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-32 object-cover rounded-xl" 
                  />
                  <button
                    type="button"
                    onClick={() => removeFile('image', index)}
                    className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              dragOver ? 'border-blue-400 bg-blue-400/20' : 'border-slate-600/50'
            } ${images.length >= 15 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'image')}
          >
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-slate-400" />
              <div>
                <p className="text-white font-medium">Şəkilləri buraya sürükləyin</p>
                <p className="text-slate-400 text-sm">və ya klikləyərək yükləyin</p>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileInputChange(e, 'image')}
                className="hidden"
                id="image-upload"
                disabled={images.length >= 15}
              />
              <label
                htmlFor="image-upload"
                className={`inline-block px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  images.length >= 15 
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25'
                }`}
              >
                Şəkil Seç
              </label>
            </div>
          </div>
          {errors.images && <p className="text-red-400 text-sm">{errors.images}</p>}
        </div>

        {/* Video Upload */}
        <div className="space-y-4">
          <label className="block text-white font-medium text-lg">
            Video (isteğe bağlı)
          </label>
          
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              dragOver ? 'border-blue-400 bg-blue-400/20' : 'border-slate-600/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'video')}
          >
            {videoPreview ? (
              <div className="relative">
                <video 
                  src={videoPreview} 
                  className="w-full h-48 object-cover rounded-xl mb-4" 
                  controls 
                />
                <button
                  type="button"
                  onClick={() => removeFile('video')}
                  className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Video className="h-12 w-12 mx-auto text-slate-400" />
                <div>
                  <p className="text-white font-medium">Videonu buraya sürükləyin</p>
                  <p className="text-slate-400 text-sm">və ya klikləyərək yükləyin</p>
                </div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileInputChange(e, 'video')}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="inline-block bg-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 cursor-pointer"
                >
                  Video Seç
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Step5Review: React.FC<Step5Props> = ({
  formData,
  selectedBrand,
  selectedColor,
  locationOptions,
  images,
  errors,
  loading
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Yekunlaşdırma</h2>
        <p className="text-slate-300">Məlumatları yoxlayın və elanı dərc edin</p>
      </div>

      <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-400" />
              Avtomobil Məlumatları
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Marka:</span>
                <span className="text-white font-medium">{selectedBrand?.name || ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Model:</span>
                <span className="text-white font-medium">{formData.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">İl:</span>
                <span className="text-white font-medium">{formData.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">VIN:</span>
                <span className="text-white font-medium font-mono text-sm">{formData.vin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rəng:</span>
                <span className="text-white font-medium">{selectedColor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gövdə Tipi:</span>
                <span className="text-white font-medium">{formData.bodyStyle}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Technical Specifications */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-400" />
              Texniki Spesifikasiyalar
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Yanacaq:</span>
                <span className="text-white font-medium">{getEnumLabel('FuelType', formData.fuelType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ötürücü:</span>
                <span className="text-white font-medium">{getEnumLabel('Transmission', formData.transmission)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ötürücü Sistemi:</span>
                <span className="text-white font-medium">{getEnumLabel('DriveTrain', formData.driveTrain)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Yürüş:</span>
                <span className="text-white font-medium">
                  {formData.mileage > 0 ? `${formData.mileage.toLocaleString()} ${formData.mileageUnit}` : 'Məlumat yoxdur'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Açarı Var:</span>
                <span className="text-white font-medium">{formData.hasKeys ? 'Bəli' : 'Xeyr'}</span>
              </div>
            </div>
          </div>

          {/* Column 3: Condition & Legal */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-400" />
              Vəziyyət və Hüquqi
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Zədə Növü:</span>
                <span className="text-white font-medium">{getEnumLabel('DamageType', formData.damageType)}</span>
              </div>
              {formData.secondaryDamage > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">İkincil Zədə:</span>
                  <span className="text-white font-medium">{getEnumLabel('DamageType', formData.secondaryDamage)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Avtomobil Vəziyyəti:</span>
                <span className="text-white font-medium">{getEnumLabel('CarCondition', formData.carCondition)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sənəd Növü:</span>
                <span className="text-white font-medium">{getEnumLabel('TitleType', formData.titleType)}</span>
              </div>
              {formData.titleState && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Sənəd Ştatı:</span>
                  <span className="text-white font-medium">{formData.titleState}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Pricing and Location */}
        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Pricing Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-yellow-400" />
                Qiymət Məlumatları
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Qiymət:</span>
                  <span className="text-white font-medium text-lg">
                    {formData.price.toLocaleString()} {formData.currency}
                  </span>
                </div>
                {formData.estimatedRetailValue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Təxmini Satış Qiyməti:</span>
                    <span className="text-white font-medium">
                      {formData.estimatedRetailValue.toLocaleString()} {formData.currency}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Location and Media */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Car className="h-5 w-5 text-indigo-400" />
                Məkan və Media
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Məkan:</span>
                  <span className="text-white font-medium">
                    {locationOptions.find(loc => loc.id === formData.locationId)?.name || 'Seçilməyib'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Şəkillər:</span>
                  <span className="text-white font-medium">{images.length} şəkil</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="mt-6 bg-red-500/20 border border-red-400 rounded-xl p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-400">{errors.submit}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:shadow-emerald-500/25"
          >
            {loading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                Dərc edilir...
              </>
            ) : (
              <>
                <Sparkles className="h-6 w-6" />
                Elanı Dərc Et
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const AddVehicle: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState<CarMake | null>(null);
  const [filteredModels, setFilteredModels] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [modelInputValue, setModelInputValue] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // Unified form data state - single source of truth with numeric defaults
  const [formData, setFormData] = useState<VehicleFormData>({
    // Basic Information
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    color: '',
    bodyStyle: '',
    
    // Enum Fields (numeric values matching backend - all start with 0 for Unknown)
    fuelType: 0,
    damageType: 0,
    secondaryDamage: 0,
    transmission: 0,
    driveTrain: 0,
    carCondition: 0,
    titleType: 0,
    
    // Additional Fields
    mileage: 0,
    mileageUnit: 'km',
    price: 0,
    currency: 'AZN',
    locationId: '',
    hasKeys: false,
    titleState: '',
    estimatedRetailValue: 0
  });
  
  // Brand and model refs
  const brandQueryRef = useRef<HTMLInputElement>(null);
  const modelSearchTermRef = useRef<HTMLInputElement>(null);
  
  // Form refs - comprehensive ref management system
  const yearRef = useRef<HTMLSelectElement>(null);
  const mileageRef = useRef<HTMLInputElement>(null);
  const mileageUnitRef = useRef<HTMLSelectElement>(null);
  const vinRef = useRef<HTMLInputElement>(null);
  const fuelTypeRef = useRef<HTMLSelectElement>(null);
  const damageTypeRef = useRef<HTMLSelectElement>(null);
  const secondaryDamageRef = useRef<HTMLSelectElement>(null);
  const transmissionRef = useRef<HTMLSelectElement>(null);
  const driveTrainRef = useRef<HTMLSelectElement>(null);
  const carConditionRef = useRef<HTMLSelectElement>(null);
  const titleTypeRef = useRef<HTMLSelectElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const currencyRef = useRef<HTMLSelectElement>(null);
  const bodyStyleRef = useRef<HTMLSelectElement>(null);
  const locationIdRef = useRef<HTMLSelectElement>(null);
  const hasKeysRef = useRef<HTMLSelectElement>(null);
  const titleStateRef = useRef<HTMLSelectElement>(null);
  const estimatedRetailValueRef = useRef<HTMLInputElement>(null);
  
  // State for non-input data
  const [images, setImages] = useState<File[]>([]);
  const [selectedColor, setSelectedColor] = useState('');

  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [dragOver, setDragOver] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

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

  // Set default values for refs
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    if (yearRef.current) {
      yearRef.current.value = currentYear.toString();
    }
    if (mileageUnitRef.current) {
      mileageUnitRef.current.value = 'km';
    }
    if (currencyRef.current) {
      currencyRef.current.value = 'AZN';
    }
    setSelectedYear(currentYear);
  }, []);

  // Load locations data
  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const rawLocations = await apiClient.getLocations();
      let processedLocations: {id: string, name: string}[] = [];
      
      if (Array.isArray(rawLocations) && rawLocations.length > 0) {
        const hasIdAndName = rawLocations.every(item => 
          typeof item === 'object' && 
          item !== null && 
          typeof item.id === 'string' && 
          (typeof item.name === 'string' || typeof item.city === 'string')
        );
        
        if (hasIdAndName) {
          processedLocations = rawLocations.map(loc => ({
            id: loc.id,
            name: loc.name || loc.city || 'Unknown Location'
          }));
        } else if (rawLocations.every(item => typeof item === 'string')) {
          processedLocations = rawLocations.map((name, index) => ({
            id: `mock-location-${index}-${Date.now()}`,
            name: name
          }));
        }
      }
      
      setLocationOptions(processedLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
      const fallbackLocations = [
        { id: 'fallback-1', name: 'Baku' },
        { id: 'fallback-2', name: 'Ganja' },
        { id: 'fallback-3', name: 'Sumgayit' },
        { id: 'fallback-4', name: 'Mingachevir' },
        { id: 'fallback-5', name: 'Lankaran' }
      ];
      setLocationOptions(fallbackLocations);
    }
  };

  // Wizard navigation functions
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 5) {
      setCurrentStep(step);
    }
  };

  // Step 1: Brand selection
  const handleBrandSelect = (brand: CarMake | null) => {
    if (!brand) return;
    setSelectedBrand(brand);
    setFormData(prev => ({ ...prev, make: brand.name, model: '' }));
    if (brandQueryRef.current) {
      brandQueryRef.current.value = brand.name;
    }
    if (modelSearchTermRef.current) {
      modelSearchTermRef.current.value = '';
    }
    setFilteredModels(brand.models);
    setShowModelDropdown(false);
    setSelectedYear(null);
    setModelInputValue('');
    nextStep();
  };

  // Step 2: Model and year selection
  const handleModelSelect = (model: string) => {
    setFormData(prev => ({ ...prev, model }));
    if (modelSearchTermRef.current) {
      modelSearchTermRef.current.value = model;
    }
    setModelInputValue(model);
    setShowModelDropdown(false);
  };

  const handleModelInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (modelSearchTermRef.current) {
      modelSearchTermRef.current.value = value;
    }
    setModelInputValue(value);
    setFormData(prev => ({ ...prev, model: value }));
    
    // Update filtered models and dropdown visibility
    if (selectedBrand) {
      const filtered = selectedBrand.models.filter(model =>
        model.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredModels(filtered);
    }
    
    // Show dropdown if there's input
    setShowModelDropdown(value.length > 0);
  };

  const handleModelInputFocus = () => {
    setShowModelDropdown(modelInputValue.length > 0);
  };

  const handleModelInputBlur = () => {
    // Delay hiding to allow click on dropdown items
    setTimeout(() => setShowModelDropdown(false), 150);
  };

  const handleYearSelect = (year: number) => {
    setFormData(prev => ({ ...prev, year }));
    if (yearRef.current) {
      yearRef.current.value = year.toString();
    }
    setSelectedYear(year);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setFormData(prev => ({ ...prev, color }));
  };

  // General input change handler for formData - type-safe
  const handleInputChange = (field: keyof VehicleFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Step 4: File upload functions
  const handleFileUpload = (file: File, type: 'image' | 'video') => {
    if (type === 'image') {
      if (images.length >= 15) {
        setErrors(prev => ({ 
          ...prev, 
          submit: 'Maksimum 15 şəkil icazə verilir' 
        }));
        return;
      }

      setImages(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreviews(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => setVideoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = Array.from(e.target.files || []);
    
    if (type === 'image') {
      if (images.length + files.length > 15) {
        setErrors(prev => ({ 
          ...prev, 
          submit: `Maksimum 15 şəkil icazə verilir. ${15 - images.length} şəkil daha əlavə edə bilərsiniz.` 
        }));
        return;
      }

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setErrors(prev => ({ 
            ...prev, 
            submit: 'Zəhmət olmasa düzgün şəkil faylları seçin' 
          }));
          return;
        }

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          setErrors(prev => ({ 
            ...prev, 
            submit: `Fayl ölçüsü çox böyükdür. Şəkillər üçün maksimum 10MB icazə verilir` 
          }));
          return;
        }

        handleFileUpload(file, type);
      }
    } else {
      const file = files[0];
      if (file) {
        if (!file.type.startsWith('video/')) {
          setErrors(prev => ({ 
            ...prev, 
            submit: 'Zəhmət olmasa düzgün video faylı seçin' 
          }));
          return;
        }

        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
          setErrors(prev => ({ 
            ...prev, 
            submit: `Fayl ölçüsü çox böyükdür. Videolar üçün maksimum 50MB icazə verilir` 
          }));
          return;
        }

        handleFileUpload(file, type);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent, type: 'image' | 'video') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      if (type === 'image' && file.type.startsWith('image/')) {
        handleFileUpload(file, 'image');
      } else if (type === 'video' && file.type.startsWith('video/')) {
        handleFileUpload(file, 'video');
      } else {
        setErrors(prev => ({ 
          ...prev, 
          submit: `Zəhmət olmasa düzgün ${type} faylı seçin` 
        }));
      }
    }
  };

  const removeFile = (type: 'image' | 'video', index?: number) => {
    if (type === 'image' && index !== undefined) {
      setImages(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'video') {
      setVideoPreview(null);
    }
  };

  // Enhanced validation functions with comprehensive field validation
  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    switch (step) {
      case 1:
        if (!selectedBrand) {
          newErrors.brand = 'Marka seçilməlidir';
        }
        break;
      case 2:
        if (!formData.model || formData.model.trim() === '') {
          newErrors.model = 'Model tələb olunur';
        }
        if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
          newErrors.year = 'Düzgün il daxil edin';
        }
        break;
      case 3:
        // Enhanced VIN validation with regex
        if (!formData.vin || formData.vin.length !== 17) {
          newErrors.vin = 'VIN nömrəsi tam 17 simvol olmalıdır';
        } else if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(formData.vin)) {
          newErrors.vin = 'VIN nömrəsi yalnız hərflər və rəqəmlərdən ibarət olmalıdır (I, O, Q istisna)';
        }
        
        // Color validation
        if (!selectedColor) newErrors.color = 'Rəng seçilməlidir';
        
        // Enum field validations (numeric values)
        if (formData.fuelType === 0) newErrors.fuelType = 'Yanacaq növü seçilməlidir';
        if (formData.damageType === 0) newErrors.damageType = 'Zədə növü seçilməlidir';
        if (formData.transmission === 0) newErrors.transmission = 'Ötürücü seçilməlidir';
        if (formData.driveTrain === 0) newErrors.driveTrain = 'Ötürücü sistemi seçilməlidir';
        if (formData.carCondition === 0) newErrors.carCondition = 'Avtomobil vəziyyəti seçilməlidir';
        if (formData.titleType === 0) newErrors.titleType = 'Sənəd növü seçilməlidir';
        
        // Basic field validations
        if (!formData.bodyStyle) newErrors.bodyStyle = 'Gövdə tipi seçilməlidir';
        if (!formData.locationId) newErrors.locationId = 'Məkan seçilməlidir';
        
        // Price validation with reasonable limits
        if (!formData.price || formData.price <= 0) {
          newErrors.price = 'Qiymət 0-dan böyük olmalıdır';
        } else if (formData.price > 1000000) {
          newErrors.price = 'Qiymət çox yüksəkdir (maksimum 1,000,000)';
        }
        
        // Mileage validation
        if (!formData.mileage || formData.mileage <= 0) {
          newErrors.mileage = 'Yürüş məsafəsi daxil edilməlidir və 0-dan böyük olmalıdır';
        } else if (formData.mileage > 999999) {
          newErrors.mileage = 'Yürüş çox yüksəkdir (maksimum 999,999)';
        }
        
        // Estimated Retail Value validation (conditional)
        if ((formData.titleType === 1 || formData.titleType === 5) && formData.estimatedRetailValue > 0) {
          if (formData.estimatedRetailValue > formData.price * 2) {
            newErrors.estimatedRetailValue = 'Təxmini satış qiyməti əsas qiymətdən çox yüksəkdir';
          }
        }
        
        break;
      case 4:
        if (images.length < 3) {
          newErrors.images = 'Minimum 3 şəkil tələb olunur';
        } else if (images.length > 15) {
          newErrors.images = 'Maksimum 15 şəkil icazə verilir';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Basic information validation
    if (!selectedBrand) newErrors.make = 'Marka tələb olunur';
    if (!formData.model || formData.model.trim() === '') newErrors.model = 'Model tələb olunur';
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Düzgün il daxil edin';
    }
    
    // Enhanced VIN validation
    if (!formData.vin || formData.vin.length !== 17) {
      newErrors.vin = 'VIN nömrəsi tam 17 simvol olmalıdır';
    } else if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(formData.vin)) {
      newErrors.vin = 'VIN nömrəsi yalnız hərflər və rəqəmlərdən ibarət olmalıdır (I, O, Q istisna)';
    }
    
    // Color validation
    if (!selectedColor) newErrors.color = 'Rəng seçilməlidir';
    
    // Enum field validations (numeric values)
    if (formData.fuelType === 0) newErrors.fuelType = 'Yanacaq növü seçilməlidir';
    if (formData.damageType === 0) newErrors.damageType = 'Zədə növü seçilməlidir';
    if (formData.transmission === 0) newErrors.transmission = 'Ötürücü seçilməlidir';
    if (formData.driveTrain === 0) newErrors.driveTrain = 'Ötürücü sistemi seçilməlidir';
    if (formData.carCondition === 0) newErrors.carCondition = 'Avtomobil vəziyyəti seçilməlidir';
    if (formData.titleType === 0) newErrors.titleType = 'Sənəd növü seçilməlidir';
    
    // Basic field validations
    if (!formData.bodyStyle) newErrors.bodyStyle = 'Gövdə tipi seçilməlidir';
    if (!formData.locationId) newErrors.locationId = 'Məkan seçilməlidir';
    
    // Price validation matching backend DTO requirements
    if (!formData.price || formData.price < 0.01) {
      newErrors.price = 'Qiymət tələb olunur və 0-dan böyük olmalıdır (minimum 0.01)';
    } else if (formData.price > 1000000) {
      newErrors.price = 'Qiymət çox yüksəkdir (maksimum 1,000,000)';
    }
    
    // Mileage validation
    if (!formData.mileage || formData.mileage <= 0) {
      newErrors.mileage = 'Yürüş məsafəsi daxil edilməlidir və 0-dan böyük olmalıdır';
    } else if (formData.mileage > 999999) {
      newErrors.mileage = 'Yürüş çox yüksəkdir (maksimum 999,999)';
    }
    
    // Estimated Retail Value validation
    if (formData.estimatedRetailValue > 0) {
      if (formData.estimatedRetailValue > formData.price * 3) {
        newErrors.estimatedRetailValue = 'Təxmini satış qiyməti əsas qiymətdən çox yüksəkdir';
      } else if (formData.estimatedRetailValue < 100) {
        newErrors.estimatedRetailValue = 'Təxmini satış qiyməti çox aşağıdır (minimum 100)';
      }
    }
    
    // Image validation
    if (images.length < 3) {
      newErrors.images = 'Minimum 3 şəkil tələb olunur';
    } else if (images.length > 15) {
      newErrors.images = 'Maksimum 15 şəkil icazə verilir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 5: Final submission - Optimized with comprehensive field handling
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({}); // Clear previous errors
    
    try {
      const submitData = new FormData();
      
      // Basic Information
      submitData.append('Make', formData.make);
      submitData.append('Model', formData.model);
      submitData.append('Year', formData.year.toString());
      submitData.append('Vin', formData.vin);
      submitData.append('Color', selectedColor); // Use selectedColor state
      submitData.append('BodyStyle', formData.bodyStyle);
      submitData.append('LocationId', formData.locationId);
      
      // Enum Fields (numeric values matching backend)
      submitData.append('FuelType', formData.fuelType.toString());
      submitData.append('DamageType', formData.damageType.toString());
      submitData.append('SecondaryDamage', formData.secondaryDamage.toString());
      submitData.append('Transmission', formData.transmission.toString());
      submitData.append('DriveTrain', formData.driveTrain.toString());
      submitData.append('CarCondition', formData.carCondition.toString());
      submitData.append('TitleType', formData.titleType.toString());
      
      // Additional Fields - Price (Required, must be > 0.01 to match backend DTO)
      if (formData.price && formData.price >= 0.01) {
        submitData.append('Price', formData.price.toString());
      }
      submitData.append('Currency', formData.currency);
      
      // DEBUG: Log mileage before appending
      console.log('🔍 MILEAGE DEBUG - formData.mileage:', formData.mileage, 'type:', typeof formData.mileage);
      console.log('🔍 MILEAGE DEBUG - formData.mileageUnit:', formData.mileageUnit);
      
      submitData.append('Mileage', formData.mileage.toString());
      submitData.append('MileageUnit', formData.mileageUnit);
      submitData.append('HasKeys', formData.hasKeys.toString());
      submitData.append('TitleState', formData.titleState);
      
      // DEBUG: Log what's in FormData
      console.log('📤 FormData contents:');
      for (let pair of submitData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      // Estimated Retail Value - Always append
      submitData.append('EstimatedRetailValue', (formData.estimatedRetailValue || 0).toString());
      
      // User Authentication
      if (user?.user?.id) {
        submitData.append('OwnerId', user.user.id);
      } else {
        setErrors({ submit: 'Kimlik doğrulama xətası: İstifadəçi ID-si mövcud deyil. Yenidən daxil olun.' });
        setLoading(false);
        return;
      }
      
      // Image Upload (first image)
      if (images.length > 0) {
        submitData.append('Image', images[0]);
      }
      
      // Debug logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Submitting vehicle data:', {
          make: formData.make,
          model: formData.model,
          year: formData.year,
          vin: formData.vin,
          color: selectedColor,
          fuelType: formData.fuelType,
          damageType: formData.damageType,
          transmission: formData.transmission,
          driveTrain: formData.driveTrain,
          carCondition: formData.carCondition,
          titleType: formData.titleType,
          price: formData.price,
          currency: formData.currency,
          mileage: formData.mileage,
          mileageUnit: formData.mileageUnit,
          hasKeys: formData.hasKeys,
          titleState: formData.titleState,
          estimatedRetailValue: formData.estimatedRetailValue,
          imageCount: images.length
        });
      }
      
      const response = await fetch('https://localhost:7249/api/Car', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('authToken')}`
        },
        body: submitData
      });

      if (response.ok) {
        const result = await response.json();
        
        // Upload additional images if any
        if (images.length > 1) {
          await uploadAdditionalImages(result.id || result.carId, images.slice(1));
        }
        
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/my-vehicles');
        }, 2000);
      } else {
        const errorText = await response.text();
        let errorMessage = 'Avtomobil yaradıla bilmədi. Yenidən cəhd edin.';
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.errors) {
            const errorMessages = Object.values(errorJson.errors).flat();
            errorMessage = errorMessages.join(', ');
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          // Keep original errorText if parsing fails
        }
        
        setErrors({ submit: errorMessage });
      }
    } catch (error) {
      console.error('Error submitting vehicle:', error);
      setErrors({ submit: 'Şəbəkə xətası. Bağlantınızı yoxlayın və yenidən cəhd edin.' });
    } finally {
      setLoading(false);
    }
  }, [formData, selectedColor, images, user, validateForm, navigate]);

  const uploadAdditionalImages = async (carId: string, images: File[]) => {
    try {
      for (const image of images) {
        const formData = new FormData();
        formData.append('File', image);
        
        const response = await fetch(`https://localhost:7249/api/Car/${carId}/photo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('authToken')}`
          },
          body: formData
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to upload image for car ${carId}:`, {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
        }
      }
    } catch (error) {
      console.error('Error uploading additional images:', error);
    }
  };

  // Main return statement
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-indigo-900/80 to-slate-900/90"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
          <CheckCircle className="h-5 w-5" />
          <span>✅ Avtomobil elanı uğurla yaradıldı!</span>
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Yeni Avtomobil Əlavə Et</h1>
          <p className="text-slate-300">Addım-addım avtomobil elanı yaradın</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={5} aria-label="Form addımları">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <button
                  type="button"
                  onClick={() => goToStep(step)}
                  aria-label={`Addım ${step}${step === currentStep ? ' - hazırkı addım' : step < currentStep ? ' - tamamlanmış' : ' - gələcək addım'}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    step === currentStep
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : step < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                </button>
                {step < 5 && (
                  <div className={`w-8 h-1 mx-2 rounded ${
                    step < currentStep ? 'bg-green-500' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <form onSubmit={handleSubmit}>
          <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-75"></div>
            
            <div className="relative z-10">
              {/* Step Content */}
              {currentStep === 1 && (
                <Step1BrandSelection 
                  selectedBrand={selectedBrand}
                  brandQueryRef={brandQueryRef}
                  handleBrandSelect={handleBrandSelect}
                  goToStep={goToStep}
                />
              )}
              {currentStep === 2 && (
                <Step2ModelYear 
                  errors={errors}
                  selectedBrand={selectedBrand}
                  selectedYear={selectedYear}
                  modelInputValue={modelInputValue}
                  showModelDropdown={showModelDropdown}
                  filteredModels={filteredModels}
                  modelSearchTermRef={modelSearchTermRef}
                  yearRef={yearRef}
                  handleModelSelect={handleModelSelect}
                  handleModelInputChange={handleModelInputChange}
                  handleModelInputFocus={handleModelInputFocus}
                  handleModelInputBlur={handleModelInputBlur}
                  handleYearSelect={handleYearSelect}
                />
              )}
              {currentStep === 3 && (
                <Step3TechnicalSpecs 
                  formData={formData}
                  errors={errors}
                  selectedColor={selectedColor}
                  locationOptions={locationOptions}
                  vinRef={vinRef}
                  bodyStyleRef={bodyStyleRef}
                  fuelTypeRef={fuelTypeRef}
                  damageTypeRef={damageTypeRef}
                  secondaryDamageRef={secondaryDamageRef}
                  transmissionRef={transmissionRef}
                  driveTrainRef={driveTrainRef}
                  carConditionRef={carConditionRef}
                  titleTypeRef={titleTypeRef}
                  mileageRef={mileageRef}
                  mileageUnitRef={mileageUnitRef}
                  priceRef={priceRef}
                  currencyRef={currencyRef}
                  locationIdRef={locationIdRef}
                  hasKeysRef={hasKeysRef}
                  titleStateRef={titleStateRef}
                  estimatedRetailValueRef={estimatedRetailValueRef}
                  handleInputChange={handleInputChange}
                  handleColorSelect={handleColorSelect}
                />
              )}
              {currentStep === 4 && (
                <Step4MediaUpload 
                  images={images}
                  imagePreviews={imagePreviews}
                  videoPreview={videoPreview}
                  dragOver={dragOver}
                  errors={errors}
                  handleFileInputChange={handleFileInputChange}
                  handleDragOver={handleDragOver}
                  handleDragLeave={handleDragLeave}
                  handleDrop={handleDrop}
                  removeFile={removeFile}
                />
              )}
              {currentStep === 5 && (
                <Step5Review 
                  formData={formData}
                  selectedBrand={selectedBrand}
                  selectedColor={selectedColor}
                  locationOptions={locationOptions}
                  images={images}
                  errors={errors}
                  loading={loading}
                />
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-12">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-slate-600 text-slate-300 rounded-xl font-medium hover:bg-slate-700/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Geri
                </button>

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep(currentStep)) {
                        nextStep();
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
                  >
                    İrəli
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;
