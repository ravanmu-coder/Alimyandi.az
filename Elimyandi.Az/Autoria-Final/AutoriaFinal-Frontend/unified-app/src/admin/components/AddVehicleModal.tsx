import React, { useState, useEffect, useCallback, useReducer } from 'react'
import { X, Car, Search, Plus, Eye, Loader2, AlertCircle, Edit3, Check, RotateCcw } from 'lucide-react'
import { Button } from './common/Button'
import { apiClient } from '../services/apiClient'
import { useToast } from './common/Toast'

interface Car {
  id: string
  make: string
  model: string
  year: number
  vin: string
  estimatedRetailValue?: number
  mileage?: number
  color?: string
  condition?: string
}

interface SelectedCar {
  carId: string
  lotNumber: string
  startingBid: number
  car: Car
  estimatedRetailValue?: number
  isEditingPrice?: boolean
}

interface CarSelectionState {
  availableCars: Car[]
  selectedCars: SelectedCar[]
}

type CarSelectionAction = 
  | { type: 'ADD_CAR'; car: Car; selectedCar: SelectedCar }
  | { type: 'REMOVE_CAR'; carId: string }
  | { type: 'SET_AVAILABLE_CARS'; cars: Car[] }
  | { type: 'UPDATE_STARTING_PRICE'; carId: string; newPrice: number }
  | { type: 'TOGGLE_PRICE_EDIT'; carId: string }

const carSelectionReducer = (state: CarSelectionState, action: CarSelectionAction): CarSelectionState => {
  switch (action.type) {
    case 'ADD_CAR':
      return {
        availableCars: state.availableCars.filter(c => c.id !== action.car.id),
        selectedCars: state.selectedCars.some(sc => sc.carId === action.car.id) 
          ? state.selectedCars 
          : [...state.selectedCars, action.selectedCar]
      }
    case 'REMOVE_CAR':
      const removedCar = state.selectedCars.find(sc => sc.carId === action.carId)
      if (!removedCar) return state
      
      return {
        availableCars: state.availableCars.some(c => c.id === action.carId)
          ? state.availableCars
          : [...state.availableCars, removedCar.car],
        selectedCars: state.selectedCars.filter(sc => sc.carId !== action.carId)
      }
    case 'SET_AVAILABLE_CARS':
      return {
        ...state,
        availableCars: action.cars
      }
    case 'UPDATE_STARTING_PRICE':
      return {
        ...state,
        selectedCars: state.selectedCars.map(sc => 
          sc.carId === action.carId 
            ? { ...sc, startingBid: action.newPrice, isEditingPrice: false }
            : sc
        )
      }
    case 'TOGGLE_PRICE_EDIT':
      return {
        ...state,
        selectedCars: state.selectedCars.map(sc => 
          sc.carId === action.carId 
            ? { ...sc, isEditingPrice: !sc.isEditingPrice }
            : sc
        )
      }
    default:
      return state
  }
}

interface AddVehicleModalProps {
  auctionId: string
  onClose: () => void
  onSuccess?: () => void
}

export function AddVehicleModal({ auctionId, onClose, onSuccess }: AddVehicleModalProps) {
  const [carState, dispatch] = useReducer(carSelectionReducer, {
    availableCars: [],
    selectedCars: []
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingCars, setLoadingCars] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [assignedCarIds, setAssignedCarIds] = useState<Set<string>>(new Set())
  const [carsError, setCarsError] = useState<string | null>(null)
  const { success, error, warning } = useToast()

  // Generate lot number function
  const generateLotNumber = (): string => {
    const part1 = Math.floor(1000 + Math.random() * 9000)
    const part2 = Math.floor(1000 + Math.random() * 9000)
    return `${part1}-${part2}`
  }

  // Calculate starting price (80% of estimated retail value)
  const calculateStartingPrice = (estimatedValue?: number): number => {
    if (!estimatedValue) return 0
    return Math.round(estimatedValue * 0.8)
  }

  // Load assigned cars and filter available cars
  const loadAvailableCars = async () => {
    setLoadingCars(true)
    setCarsError(null)
    
    try {
      console.log('Step 1: Loading all assigned cars...')
      
      // Step 1: Get all assigned cars from all auctions
      const assignedCarsResponse = await apiClient.getAuctionCars({ pageSize: 2000 })
      console.log('Assigned cars response:', assignedCarsResponse)
      
      // Handle different response formats
      let assignedCars: any[] = []
      if (Array.isArray(assignedCarsResponse)) {
        assignedCars = assignedCarsResponse
      } else if (assignedCarsResponse && Array.isArray(assignedCarsResponse.items)) {
        assignedCars = assignedCarsResponse.items
      } else if (assignedCarsResponse && Array.isArray(assignedCarsResponse.data)) {
        assignedCars = assignedCarsResponse.data
      }
      
      console.log('Found assigned cars:', assignedCars.length)
      
      // Step 2: Create set of assigned car IDs
      const assignedIds = new Set(assignedCars.map((car: any) => car.carId))
      setAssignedCarIds(assignedIds)
      console.log('Assigned car IDs:', Array.from(assignedIds))
      
      // Step 3: Get all cars from the system
      console.log('Step 3: Loading all cars...')
      const allCarsResponse = await apiClient.getCars()
      console.log('All cars response:', allCarsResponse)
      
      // Handle different response formats for cars
      let allCars: Car[] = []
      if (Array.isArray(allCarsResponse)) {
        allCars = allCarsResponse
      } else if (allCarsResponse && Array.isArray(allCarsResponse.items)) {
        allCars = allCarsResponse.items
      } else if (allCarsResponse && Array.isArray(allCarsResponse.data)) {
        allCars = allCarsResponse.data
      }
      
      console.log('Found all cars:', allCars.length)
      
      // Step 4: Filter out assigned cars
      const unassignedCars = allCars.filter((car: Car) => !assignedIds.has(car.id))
      console.log('Unassigned cars after filtering:', unassignedCars.length)
      
      dispatch({ type: 'SET_AVAILABLE_CARS', cars: unassignedCars })
      
      if (unassignedCars.length === 0) {
        console.log('No unassigned vehicles found')
      }
      
    } catch (err) {
      console.error('Error loading available cars:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load available cars'
      setCarsError(errorMessage)
      error(`Failed to load available cars: ${errorMessage}`)
    } finally {
      setLoadingCars(false)
    }
  }

  useEffect(() => {
    loadAvailableCars()
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleAddCar = useCallback(async (car: Car) => {
    try {
      // Validate that the car has a valid EstimatedRetailValue
      if (!car.estimatedRetailValue || car.estimatedRetailValue < 100 || car.estimatedRetailValue > 1000000) {
        error(`Cannot add ${car.make} ${car.model}: Estimated retail value (${car.estimatedRetailValue}) must be between 100-1000000`)
        return
      }

      // Generate lot number
      const lotNumber = generateLotNumber()
      
      // Calculate starting price
      const startingBid = calculateStartingPrice(car.estimatedRetailValue)

      const selectedCar: SelectedCar = {
        carId: car.id,
        lotNumber,
        startingBid,
        car,
        estimatedRetailValue: car.estimatedRetailValue,
        isEditingPrice: false
      }

      // Use reducer for atomic state updates
      dispatch({ 
        type: 'ADD_CAR', 
        car, 
        selectedCar 
      })
      
      success(`${car.make} ${car.model} added to auction`)
    } catch (err) {
      console.error('Error adding car:', err)
      error('Failed to add car')
    }
  }, [success, error])

  const handleRemoveCar = useCallback((carId: string) => {
    dispatch({ type: 'REMOVE_CAR', carId })
  }, [])

  const handleUpdateStartingPrice = useCallback((carId: string, newPrice: number) => {
    dispatch({ type: 'UPDATE_STARTING_PRICE', carId, newPrice })
  }, [])

  const handleTogglePriceEdit = useCallback((carId: string) => {
    dispatch({ type: 'TOGGLE_PRICE_EDIT', carId })
  }, [])

  const handleRecalculatePrice = useCallback((carId: string) => {
    const selectedCar = carState.selectedCars.find(sc => sc.carId === carId)
    if (selectedCar && selectedCar.estimatedRetailValue) {
      const newPrice = calculateStartingPrice(selectedCar.estimatedRetailValue)
      dispatch({ type: 'UPDATE_STARTING_PRICE', carId, newPrice })
    }
  }, [carState.selectedCars])

  // Price editing component
  const PriceEditor = ({ selectedCar }: { selectedCar: SelectedCar }) => {
    const [tempPrice, setTempPrice] = useState(selectedCar.startingBid.toString())

    const handleSave = () => {
      const newPrice = parseFloat(tempPrice)
      if (!isNaN(newPrice) && newPrice >= 0) {
        handleUpdateStartingPrice(selectedCar.carId, newPrice)
      }
    }

    const handleCancel = () => {
      setTempPrice(selectedCar.startingBid.toString())
      handleTogglePriceEdit(selectedCar.carId)
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={tempPrice}
            onChange={(e) => setTempPrice(e.target.value)}
            className="flex-1 px-2 py-1 bg-dark-bg-quaternary border border-dark-border rounded text-body-sm text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
            placeholder="Enter starting price"
            min="0"
            step="100"
          />
          <Button
            icon={Check}
            onClick={handleSave}
            size="sm"
            variant="primary"
            className="px-2"
          />
          <Button
            icon={X}
            onClick={handleCancel}
            size="sm"
            variant="ghost"
            className="px-2"
          />
        </div>
        {selectedCar.estimatedRetailValue && (
          <div className="flex items-center space-x-2">
            <span className="text-body-xs text-dark-text-muted">
              Est. Value: ${selectedCar.estimatedRetailValue.toLocaleString()} (80%)
            </span>
            <Button
              icon={RotateCcw}
              onClick={() => handleRecalculatePrice(selectedCar.carId)}
              size="sm"
              variant="ghost"
              className="px-2 text-accent-info hover:text-accent-info"
              title="Recalculate to 80% of estimated value"
            />
          </div>
        )}
      </div>
    )
  }

  const handleSubmit = async () => {
    if (carState.selectedCars.length === 0) {
      warning('Please select at least one vehicle')
      return
    }

    // Validate EstimatedRetailValue for all selected cars
    for (const selectedCar of carState.selectedCars) {
      const estimatedValue = selectedCar.estimatedRetailValue || selectedCar.car.estimatedRetailValue
      if (!estimatedValue || estimatedValue < 100 || estimatedValue > 1000000) {
        error(`Vehicle ${selectedCar.car.make} ${selectedCar.car.model} has invalid estimated retail value (${estimatedValue}). Must be between 100-1000000.`)
        return
      }
    }

    setSubmitting(true)
    try {
      for (const selectedCar of carState.selectedCars) {
        await apiClient.addCarToAuction(auctionId, {
          carId: selectedCar.carId,
          lotNumber: selectedCar.lotNumber,
          startingBid: selectedCar.startingBid,
          reservePrice: 0, // No reserve price
          estimatedRetailValue: selectedCar.estimatedRetailValue || selectedCar.car.estimatedRetailValue
        })
      }

      success(`Successfully added ${carState.selectedCars.length} vehicle(s) to auction`)
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Error adding vehicles:', err)
      error('Failed to add vehicles to auction')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredCars = carState.availableCars.filter(car =>
      car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.vin.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-bg-secondary rounded-xl shadow-dark-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent-primary/10 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <h2 className="text-h3 font-heading text-dark-text-primary">Add Vehicles to Auction</h2>
              <p className="text-body-sm text-dark-text-secondary">
                Showing only unassigned vehicles ({carState.availableCars.length} available)
              </p>
            </div>
          </div>
          <Button variant="ghost" icon={X} onClick={onClose} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Available Cars */}
          <div className="flex-1 p-6 border-r border-dark-border">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-text-muted" />
              <input
                type="text"
                  placeholder="Search vehicles..."
                value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 bg-dark-bg-quaternary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary"
                />
              </div>
        </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {loadingCars ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
                  <span className="ml-2 text-dark-text-secondary">Loading vehicles...</span>
                </div>
              ) : carsError ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-accent-error mx-auto mb-3" />
                  <p className="text-accent-error mb-2">Error loading vehicles</p>
                  <p className="text-body-sm text-dark-text-secondary mb-4">{carsError}</p>
                  <Button 
                    onClick={loadAvailableCars}
                    size="sm"
                    variant="secondary"
                  >
                    Retry
                  </Button>
                </div>
              ) : filteredCars.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-dark-text-muted mx-auto mb-3" />
                  <p className="text-dark-text-secondary">No unassigned vehicles found</p>
                  <p className="text-body-sm text-dark-text-muted mt-2">
                    All vehicles are currently assigned to auctions
                  </p>
                </div>
          ) : (
                filteredCars.map((car) => (
                  <div key={`available-${car.id}`} className="bg-dark-bg-tertiary rounded-lg p-4 border border-dark-border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-body-md font-medium text-dark-text-primary">
                              {car.year} {car.make} {car.model}
                            </h3>
                        <p className="text-body-sm text-dark-text-secondary">VIN: {car.vin}</p>
                        {car.estimatedRetailValue && (
                          <p className="text-body-sm text-accent-success">
                            Est. Value: ${car.estimatedRetailValue.toLocaleString()}
                          </p>
                        )}
                        {(!car.estimatedRetailValue || car.estimatedRetailValue < 100 || car.estimatedRetailValue > 1000000) && (
                          <p className="text-body-sm text-accent-error">
                            ⚠️ Invalid estimated value (must be 100-1000000)
                          </p>
                        )}
                            {car.mileage && (
                          <p className="text-body-sm text-dark-text-muted">
                            {car.mileage.toLocaleString()} miles
                          </p>
                            )}
                          </div>
                      <Button
                        icon={Plus}
                        onClick={() => handleAddCar(car)}
                        size="sm"
                        className="ml-4"
                        disabled={!car.estimatedRetailValue || car.estimatedRetailValue < 100 || car.estimatedRetailValue > 1000000}
                      >
                        Select
                      </Button>
                                </div>
                              </div>
                ))
              )}
                                </div>
                              </div>

          {/* Selected Cars */}
          <div className="w-80 p-6">
            <h3 className="text-body-lg font-medium text-dark-text-primary mb-4">
              Selected Vehicles ({carState.selectedCars.length})
            </h3>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {carState.selectedCars.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="w-12 h-12 text-dark-text-muted mx-auto mb-3" />
                  <p className="text-dark-text-secondary">No vehicles selected</p>
                        </div>
              ) : (
                carState.selectedCars.map((selectedCar) => (
                  <div key={`selected-${selectedCar.carId}`} className="bg-dark-bg-tertiary rounded-lg p-4 border border-dark-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-body-sm font-medium text-dark-text-primary">
                          {selectedCar.car.year} {selectedCar.car.make} {selectedCar.car.model}
                        </h4>
                        <p className="text-body-xs text-dark-text-secondary">VIN: {selectedCar.car.vin}</p>
                      </div>
                      <Button
                        variant="ghost"
                        icon={X}
                        onClick={() => handleRemoveCar(selectedCar.carId)}
                        size="sm"
                        className="text-dark-text-muted hover:text-accent-error"
                      />
                        </div>
                        
                    <div className="space-y-2">
                              <div>
                        <label className="text-body-xs text-dark-text-muted">Lot Number</label>
                        <p className="text-body-sm font-mono text-dark-text-primary bg-dark-bg-quaternary px-2 py-1 rounded">
                          {selectedCar.lotNumber}
                        </p>
                      </div>
                      <div>
                        <label className="text-body-xs text-dark-text-muted">Starting Price</label>
                        {selectedCar.isEditingPrice ? (
                          <PriceEditor selectedCar={selectedCar} />
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <p className="text-body-sm font-medium text-accent-success">
                                ${selectedCar.startingBid.toLocaleString()}
                              </p>
                              <Button
                                icon={Edit3}
                                onClick={() => handleTogglePriceEdit(selectedCar.carId)}
                                size="sm"
                                variant="ghost"
                                className="px-2 text-dark-text-muted hover:text-accent-primary"
                              />
                            </div>
                            {selectedCar.estimatedRetailValue && (
                              <div className="flex items-center space-x-2">
                                <span className="text-body-xs text-dark-text-muted">
                                  Est. Value: ${selectedCar.estimatedRetailValue.toLocaleString()} (80%)
                                </span>
                                <Button
                                  icon={RotateCcw}
                                  onClick={() => handleRecalculatePrice(selectedCar.carId)}
                                  size="sm"
                                  variant="ghost"
                                  className="px-2 text-accent-info hover:text-accent-info"
                                  title="Recalculate to 80% of estimated value"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-border">
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={carState.selectedCars.length === 0}
              className="flex-1"
            >
              Add {carState.selectedCars.length} Vehicle{carState.selectedCars.length !== 1 ? 's' : ''} to Auction
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}