import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '../common/Button'
import { TagChip } from '../common/TagChip'

interface FilterGroup {
  title: string
  key: string
  type: 'select' | 'range' | 'checkbox' | 'search'
  options?: { label: string; value: string }[]
  min?: number
  max?: number
  step?: number
}

interface FilterPanelProps {
  filters: FilterGroup[]
  values: Record<string, any>
  onChange: (key: string, value: any) => void
  onClear: () => void
  className?: string
}

export function FilterPanel({ 
  filters, 
  values, 
  onChange, 
  onClear, 
  className = '' 
}: FilterPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(filters.map(f => f.key)))

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedGroups(newExpanded)
  }

  const getActiveFiltersCount = () => {
    return Object.values(values).filter(value => 
      value !== '' && value !== null && value !== undefined && 
      (Array.isArray(value) ? value.length > 0 : true)
    ).length
  }

  const renderFilterInput = (filter: FilterGroup) => {
    const value = values[filter.key] || ''

    switch (filter.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onChange(filter.key, e.target.value)}
            className="input"
          >
            <option value="">All {filter.title}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'search':
        return (
          <input
            type="text"
            placeholder={`Search ${filter.title.toLowerCase()}...`}
            value={value}
            onChange={(e) => onChange(filter.key, e.target.value)}
            className="input"
          />
        )

      case 'range':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={value?.min || ''}
                onChange={(e) => onChange(filter.key, { ...value, min: e.target.value })}
                className="input flex-1"
                min={filter.min}
                max={filter.max}
                step={filter.step}
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                placeholder="Max"
                value={value?.max || ''}
                onChange={(e) => onChange(filter.key, { ...value, max: e.target.value })}
                className="input flex-1"
                min={filter.min}
                max={filter.max}
                step={filter.step}
              />
            </div>
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : []
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: string) => v !== option.value)
                    onChange(filter.key, newValues)
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {getActiveFiltersCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-red-600 hover:text-red-700"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {getActiveFiltersCount() > 0 && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {Object.entries(values).map(([key, value]) => {
              if (!value || value === '' || (Array.isArray(value) && value.length === 0)) return null
              
              const filter = filters.find(f => f.key === key)
              if (!filter) return null

              const displayValue = Array.isArray(value) 
                ? value.join(', ')
                : typeof value === 'object' && value.min !== undefined && value.max !== undefined
                ? `${value.min} - ${value.max}`
                : value

              return (
                <TagChip
                  key={key}
                  label={`${filter.title}: ${displayValue}`}
                  onRemove={() => onChange(key, '')}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Filter Groups */}
      <div className="space-y-4">
        {filters.map((filter) => (
          <div key={filter.key} className="border border-gray-200 rounded-xl">
            <button
              onClick={() => toggleGroup(filter.key)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="font-medium text-gray-900">{filter.title}</span>
              {expandedGroups.has(filter.key) ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            {expandedGroups.has(filter.key) && (
              <div className="px-4 pb-4">
                {renderFilterInput(filter)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
