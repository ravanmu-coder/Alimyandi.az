import { useState } from 'react'
import { 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  X,
  Calendar,
  Gauge,
  Car,
  MapPin,
  User,
  Search
} from 'lucide-react'
import { Button } from './common/Button'
import { useEnums, getEnumValues } from '../../services/enumService'

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

interface InventoryFilterPanelProps {
  filters: Filters
  onFilterChange: (key: keyof Filters, value: string) => void
  onApplyFilters: () => void
  onClearFilters: () => void
  searchTerm: string
  onSearchChange: (value: string) => void
}

export function InventoryFilterPanel({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  searchTerm,
  onSearchChange
}: InventoryFilterPanelProps) {
  const { enums } = useEnums()
  const [isExpanded, setIsExpanded] = useState(false)

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(value => value !== '').length + (searchTerm ? 1 : 0)

  // Get enum options dynamically
  const carConditionOptions = getEnumValues('CarCondition', enums)
  const damageTypeOptions = getEnumValues('DamageType', enums)
  const fuelTypeOptions = getEnumValues('FuelType', enums)
  const transmissionOptions = getEnumValues('Transmission', enums)
  const driveTrainOptions = getEnumValues('DriveTrain', enums)
  const titleTypeOptions = getEnumValues('TitleType', enums)

  const CollapsedView = () => (
    <div className="bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" />
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">Filters</h3>
            <p className="text-xs text-gray-500 dark:text-dark-text-muted">
              {activeFiltersCount > 0 ? `${activeFiltersCount} active filter${activeFiltersCount > 1 ? 's' : ''}` : 'No filters applied'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-700 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Quick filter preview */}
      {activeFiltersCount > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              Search: {searchTerm}
            </span>
          )}
          {filters.carCondition && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              Condition: {carConditionOptions.find(opt => opt.value === filters.carCondition)?.label || filters.carCondition}
            </span>
          )}
          {filters.damageType && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              Damage: {damageTypeOptions.find(opt => opt.value === filters.damageType)?.label || filters.damageType}
            </span>
          )}
          {filters.fuelType && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              Fuel: {fuelTypeOptions.find(opt => opt.value === filters.fuelType)?.label || filters.fuelType}
            </span>
          )}
          {(filters.yearFrom || filters.yearTo) && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              Year: {filters.yearFrom || 'Any'} - {filters.yearTo || 'Any'}
            </span>
          )}
        </div>
      )}
    </div>
  )

  const ExpandedView = () => (
    <div className="bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Filters</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
          >
            Clear All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            <Search className="w-4 h-4 inline mr-2" />
            Search Vehicles
          </label>
          <input
            type="text"
            placeholder="Search by make, model, VIN..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
        </div>

        {/* Car Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            <Car className="w-4 h-4 inline mr-2" />
            Condition
          </label>
          <select
            value={filters.carCondition}
            onChange={(e) => onFilterChange('carCondition', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          >
            <option value="">All Conditions</option>
            {carConditionOptions.map((option) => (
              // "Unknown" (value: 0) seçimini göstərməmək üçün yoxlama
              option.value !== '0' && (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              )
            ))}
          </select>
        </div>

        {/* Damage Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            Damage Type
          </label>
          <select
            value={filters.damageType}
            onChange={(e) => onFilterChange('damageType', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          >
            <option value="">All Damage Types</option>
            {damageTypeOptions.map((option) => (
              // "Unknown" (value: 0) seçimini göstərməmək üçün yoxlama
              option.value !== '0' && (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              )
            ))}
          </select>
        </div>

        {/* Fuel Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            Fuel Type
          </label>
          <select
            value={filters.fuelType}
            onChange={(e) => onFilterChange('fuelType', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          >
            <option value="">All Fuel Types</option>
            {fuelTypeOptions.map((option) => (
              // "Unknown" (value: 0) seçimini göstərməmək üçün yoxlama
              option.value !== '0' && (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              )
            ))}
          </select>
        </div>

        {/* Transmission */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            Transmission
          </label>
          <select
            value={filters.transmission}
            onChange={(e) => onFilterChange('transmission', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          >
            <option value="">All Transmissions</option>
            {transmissionOptions.map((option) => (
              // "Unknown" (value: 0) seçimini göstərməmək üçün yoxlama
              option.value !== '0' && (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              )
            ))}
          </select>
        </div>

        {/* Drive Train */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            Drive Train
          </label>
          <select
            value={filters.driveTrain}
            onChange={(e) => onFilterChange('driveTrain', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          >
            <option value="">All Drive Trains</option>
            {driveTrainOptions.map((option) => (
              // "Unknown" (value: 0) seçimini göstərməmək üçün yoxlama
              option.value !== '0' && (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              )
            ))}
          </select>
        </div>

        {/* Title Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            Title Type
          </label>
          <select
            value={filters.titleType}
            onChange={(e) => onFilterChange('titleType', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          >
            <option value="">All Title Types</option>
            {titleTypeOptions.map((option) => (
              // "Unknown" (value: 0) seçimini göstərməmək üçün yoxlama
              option.value !== '0' && (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              )
            ))}
          </select>
        </div>

        {/* Year Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Year Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="From"
              value={filters.yearFrom}
              onChange={(e) => onFilterChange('yearFrom', e.target.value)}
              className="px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="To"
              value={filters.yearTo}
              onChange={(e) => onFilterChange('yearTo', e.target.value)}
              className="px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Mileage Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            <Gauge className="w-4 h-4 inline mr-2" />
            Mileage Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="From"
              value={filters.mileageFrom}
              onChange={(e) => onFilterChange('mileageFrom', e.target.value)}
              className="px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="To"
              value={filters.mileageTo}
              onChange={(e) => onFilterChange('mileageTo', e.target.value)}
              className="px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Make */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            Make
          </label>
          <input
            type="text"
            placeholder="Search make..."
            value={filters.make}
            onChange={(e) => onFilterChange('make', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            Model
          </label>
          <input
            type="text"
            placeholder="Search model..."
            value={filters.model}
            onChange={(e) => onFilterChange('model', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            <MapPin className="w-4 h-4 inline mr-2" />
            Location
          </label>
          <input
            type="text"
            placeholder="Search location..."
            value={filters.location}
            onChange={(e) => onFilterChange('location', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
        </div>

        {/* Seller */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Seller
          </label>
          <input
            type="text"
            placeholder="Search seller..."
            value={filters.seller}
            onChange={(e) => onFilterChange('seller', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
        </div>

        {/* Apply Filters Button */}
        <Button onClick={onApplyFilters} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          Apply Filters
        </Button>
      </div>
    </div>
  )

  return isExpanded ? <ExpandedView /> : <CollapsedView />
}
