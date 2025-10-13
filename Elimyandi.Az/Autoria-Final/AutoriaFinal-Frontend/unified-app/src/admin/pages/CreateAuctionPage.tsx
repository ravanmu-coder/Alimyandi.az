import { useState } from 'react'
import { 
  ArrowLeft,
  Save,
  Plus,
  X,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Car
} from 'lucide-react'
import { useToast } from '../components/common/Toast'
import { AddVehicleModal } from '../components/AddVehicleModal'
import { NewAuctionModal } from '../components/NewAuctionModal'

export function CreateAuctionPage() {
  const { success } = useToast()
  const [showNewAuctionModal, setShowNewAuctionModal] = useState(false)
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)
  const [selectedVehicles, setSelectedVehicles] = useState<any[]>([])
  const [createdAuction, setCreatedAuction] = useState<any>(null)

  const handleCreateAuction = () => {
    setShowNewAuctionModal(true)
  }

  const handleAuctionCreated = (auction: any) => {
    setCreatedAuction(auction)
    setShowNewAuctionModal(false)
    setShowAddVehicleModal(true)
    success('Auction Created', 'Your auction has been created successfully. Now add vehicles to it.')
  }

  const handleAddVehicles = () => {
    if (createdAuction) {
      setShowAddVehicleModal(true)
    } else {
      // If no auction created yet, show the create auction modal first
      setShowNewAuctionModal(true)
    }
  }

  const handleVehiclesAdded = () => {
    setShowAddVehicleModal(false)
    success('Vehicles Added', 'Vehicles have been successfully added to the auction.')
  }

  const handleRemoveVehicle = (vehicleId: string) => {
    setSelectedVehicles(prev => prev.filter(v => v.id !== vehicleId))
  }

  const handleSaveDraft = () => {
    // Visual feedback only
    success('Draft Saved', 'Your auction draft has been saved successfully.')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <span>Admin</span>
                <span>/</span>
                <span>Auctions</span>
                <span>/</span>
                <span className="text-gray-900 font-medium">Create Auction</span>
              </nav>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Auction</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Set up a new auction with vehicles</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button 
              onClick={handleSaveDraft}
              className="px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save Draft</span>
              <span className="sm:hidden">Save</span>
            </button>
            <button 
              onClick={handleCreateAuction}
              className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <span className="hidden sm:inline">Create Auction</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Auction Details</h2>
              
              <div className="space-y-6">
                {/* Auction Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auction Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter auction name..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Select location...</option>
                      <option>Baku Auction Center</option>
                      <option>Ganja Auction Center</option>
                      <option>Sumgayit Auction Center</option>
                    </select>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>UTC+4 (Azerbaijan Time)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC+1 (CET)</option>
                    <option>UTC+3 (MSK)</option>
                  </select>
                </div>

                {/* Timer Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timer per Lot (seconds)
                    </label>
                    <input
                      type="number"
                      placeholder="30"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Bid Increment ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        placeholder="100"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Default Reserve */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Reserve Options
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>No Reserve</option>
                    <option>Reserve Price</option>
                    <option>Hidden Reserve</option>
                  </select>
                </div>

                {/* Auction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auction Type
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Live Auction</option>
                    <option>Online Auction</option>
                    <option>Sealed Bid</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter auction description..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Selected Vehicles */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Selected Vehicles</h3>
                <span className="text-sm text-gray-500">{selectedVehicles.length} vehicles</span>
              </div>

              {selectedVehicles.length === 0 ? (
                /* Empty State */
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <Car className="w-12 h-12 mx-auto" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">No vehicles selected</h4>
                  <p className="text-xs text-gray-500 mb-4">Add vehicles to this auction to get started.</p>
                  <button 
                    onClick={handleAddVehicles}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Vehicles
                  </button>
                </div>
              ) : (
                /* Selected Vehicles List */
                <div className="space-y-4">
                  {selectedVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded animate-pulse"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse mb-1 w-24"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveVehicle(vehicle.id)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Lot Number</label>
                          <input
                            type="text"
                            placeholder="Auto-generated"
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Min Pre-Bid ($)</label>
                          <input
                            type="number"
                            placeholder="0"
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Reserve Price ($)</label>
                          <input
                            type="number"
                            placeholder="No reserve"
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={handleAddVehicles}
                    className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add More Vehicles
                  </button>
                </div>
              )}

              {/* Quick Stats */}
              {selectedVehicles.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Vehicles:</span>
                      <span className="font-medium">{selectedVehicles.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Reserve:</span>
                      <span className="font-medium">$0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg Reserve:</span>
                      <span className="font-medium">$0</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Auction Modal */}
      <NewAuctionModal
        isOpen={showNewAuctionModal}
        onClose={() => setShowNewAuctionModal(false)}
        onSuccess={() => {}} // Not used since we use onAuctionCreated
        onAuctionCreated={handleAuctionCreated}
      />

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={showAddVehicleModal}
        onClose={() => setShowAddVehicleModal(false)}
        auctionId={createdAuction?.id || ''}
        onSuccess={handleVehiclesAdded}
      />
    </div>
  )
}
