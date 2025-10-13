import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Clock, 
  MapPin, 
  Calendar, 
  List, 
  Eye, 
  X,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  RefreshCw,
  Play
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { AuctionGetDto, LocationDto } from '../types/api';

// AuctionCard Component
interface AuctionCardProps {
  auction: AuctionWithDetails;
  onAuctionClick: (auction: AuctionWithDetails) => void;
  formatTime: (dateString: string) => string;
  formatDate: (dateString: string) => string;
}

const AuctionCard: React.FC<AuctionCardProps> = ({ 
  auction, 
  onAuctionClick, 
  formatTime, 
  formatDate 
}) => {
  return (
    <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700 rounded-xl p-4 hover:border-blue-500 hover:shadow-lg transition-all duration-200 group">
      <div className="flex items-center gap-4">
        {/* Left Section - Status and Time */}
        <div className="flex-shrink-0 w-20">
          <div className="flex flex-col items-center">
            {/* Status Indicator */}
            <div className="mb-2">
              {auction.isLive ? (
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              ) : (
                <Clock className="h-4 w-4 text-green-400" />
              )}
            </div>
            
            {/* Time */}
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-200">
                {formatTime(auction.startTimeUtc)}
              </div>
              <div className="text-xs text-slate-400">
                {formatDate(auction.startTimeUtc)}
              </div>
            </div>
          </div>
        </div>

        {/* Center Section - Main Info */}
        <div className="flex-1 min-w-0">
          <div className="space-y-2">
            {/* Auction Name */}
            <button
              onClick={() => onAuctionClick(auction)}
              className="text-left hover:text-blue-400 transition-colors"
            >
              <h3 className="text-lg font-bold text-white hover:text-blue-400 mb-1">
                {auction.name || 'Auction'}
              </h3>
            </button>
            
            {/* Location */}
            <div className="flex items-center gap-1 text-sm text-slate-400">
              <MapPin className="h-3 w-3" />
              <span>{auction.locationName}</span>
            </div>
            
            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold rounded-full">
                {auction.type || 'Unknown'}
              </span>
              <span className="inline-flex px-2 py-1 bg-slate-600/50 text-slate-300 border border-slate-500/30 text-xs font-semibold rounded-full">
                Mixed
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Stats and Actions */}
        <div className="flex-shrink-0 w-32">
          <div className="flex flex-col items-end space-y-3">
            {/* Vehicle Count */}
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-200">
                {auction.carCount || 0} vehicles
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full">
              <Link
                to={`/auctions/${auction.id}/cars`}
                className="inline-flex items-center justify-center px-3 py-2 border border-blue-500 text-blue-400 text-xs font-semibold rounded-lg hover:bg-blue-500/10 transition-all duration-200 hover:scale-105"
              >
                <Eye className="h-3 w-3 mr-1" />
                View List
              </Link>
              <Link
                to={`/auctions/${auction.id}`}
                className="inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <Play className="h-3 w-3 mr-1" />
                View Auction
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AuctionWithDetails extends AuctionGetDto {
  locationName?: string;
  carCount?: number;
  isLive: boolean;
  isUpcoming?: boolean;
  type?: string;
  description?: string;
}

interface AuctionDetails {
  id: string;
  name: string;
  description?: string;
  startTimeUtc: string;
  endTimeUtc: string;
  status: string;
  location: {
    name: string;
    city: string;
    region: string;
    address: string;
    phone: string;
    email: string;
  };
  totalCars: number;
  soldCars: number;
  totalRevenue: number;
  type: string;
}

const TodaysAuctions: React.FC = () => {
  const [auctions, setAuctions] = useState<AuctionWithDetails[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSaleType, setSelectedSaleType] = useState('All');
  const [saleTypes, setSaleTypes] = useState<string[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<AuctionDetails | null>(null);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadAuctions();
    loadLocations();
    loadSaleTypes();
  }, []);

  const loadAuctions = async () => {
    setLoading(true);
    try {
      console.log('Loading auctions and locations...');
      const [auctionsData, locationsData] = await Promise.all([
        apiClient.getAuctions(),
        apiClient.getLocations()
      ]);
      
      console.log('Auctions loaded:', auctionsData);
      console.log('Locations loaded:', locationsData);
      
      setLocations(locationsData);
      
      // Filter today's auctions and add location details
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todaysAuctions = auctionsData
        .filter(auction => {
          const auctionDate = new Date(auction.startTimeUtc);
          return auctionDate >= today && auctionDate < tomorrow;
        })
        .map(auction => {
          const location = locationsData.find(loc => loc.id === auction.locationId);
          const now = new Date();
          const startTime = new Date(auction.startTimeUtc);
          const endTime = new Date(auction.endTimeUtc);
          
          return {
            ...auction,
            locationName: location ? `${location.city}-${location.state || location.country}` : 'Unknown Location',
            isLive: now >= startTime && now <= endTime,
            isUpcoming: now < startTime
          };
        });
      
      console.log('Today\'s auctions:', todaysAuctions);
      setAuctions(todaysAuctions);
    } catch (error) {
      console.error('Error loading auctions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Failed to load auctions: ${errorMessage}`);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      console.log('Loading locations...');
      const locationsData = await apiClient.getLocations();
      console.log('Locations loaded successfully:', locationsData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading locations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Failed to load locations: ${errorMessage}`);
    }
  };

  const loadSaleTypes = async () => {
    try {
      console.log('Loading sale types...');
      const saleTypesData = await apiClient.getSaleTypes();
      console.log('Sale types loaded successfully:', saleTypesData);
      const types = saleTypesData.map(type => type.name);
      setSaleTypes(['All', ...types]);
    } catch (error) {
      console.error('Error loading sale types:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Failed to load sale types: ${errorMessage}`);
      setSaleTypes(['All', 'Copart US', 'Dealer', 'Bank', 'Government', 'Fleet']);
    }
  };

  const loadAuctionCarCount = async (auctionId: string) => {
    try {
      console.log(`Loading auction car count for auction: ${auctionId}`);
      const auctionCars = await apiClient.getAuctionCars(auctionId);
      console.log(`Auction cars loaded for ${auctionId}:`, auctionCars);
      return auctionCars.length;
    } catch (error) {
      console.error('Error loading auction car count:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Failed to load auction car count: ${errorMessage}`);
      return 0;
    }
  };

  const handleAuctionClick = async (auction: AuctionWithDetails) => {
    try {
      const carCount = await loadAuctionCarCount(auction.id);
      const location = locations.find(loc => loc.id === auction.locationId);
      
      const auctionDetails: AuctionDetails = {
        id: auction.id,
        name: auction.name || 'Auction',
        description: auction.description,
        startTimeUtc: auction.startTimeUtc,
        endTimeUtc: auction.endTimeUtc,
        status: auction.status || 'Unknown',
        location: {
          name: location?.name || 'Unknown',
          city: location?.city || 'Unknown',
          region: location?.state || location?.country || 'Unknown',
          address: location?.address || 'Address not available',
          phone: location?.phone || 'Phone not available',
          email: location?.email || 'Email not available'
        },
        totalCars: carCount,
        soldCars: auction.soldCarsCount || 0,
        totalRevenue: auction.totalRevenue || 0,
        type: auction.type || 'Unknown'
      };
      
      setSelectedAuction(auctionDetails);
      setShowAuctionModal(true);
    } catch (error) {
      console.error('Error loading auction details:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };


  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = searchQuery === '' || 
      auction.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auction.locationName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSaleType = selectedSaleType === 'All' || 
      auction.type === selectedSaleType;
    
    return matchesSearch && matchesSaleType;
  });

  const liveAuctions = filteredAuctions.filter(auction => auction.isLive);
  const upcomingAuctions = filteredAuctions.filter(auction => auction.isUpcoming);

  const paginatedLiveAuctions = liveAuctions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedUpcomingAuctions = upcomingAuctions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAuctions.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Loading today's auctions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3">Today's Auctions</h1>
              <p className="text-slate-300 text-lg">Live and upcoming auctions for today</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-6 py-3 rounded-xl text-sm font-semibold bg-blue-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-blue-500/50">
                <List className="h-4 w-4 mr-2 inline" />
                List
              </div>
              <Link
                to="/auctions/calendar"
                className="flex items-center gap-2 px-6 py-3 bg-green-600/90 text-white rounded-xl hover:bg-green-700/90 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm border border-green-500/50"
              >
                <CalendarIcon className="h-4 w-4" />
                Auction Calendar
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <div className="lg:w-64">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-4 sticky top-8">
              <h3 className="text-base font-bold text-white mb-4">Filters</h3>
              
              {/* Search */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Search Auctions
                </label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-7 pr-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-slate-200 placeholder-slate-400 bg-slate-800/60 text-sm"
                  />
                </div>
              </div>

              {/* Sale Type Filter */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sale Type
                </label>
                <select
                  value={selectedSaleType}
                  onChange={(e) => setSelectedSaleType(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-slate-200 bg-slate-800/60 text-sm"
                >
                  {saleTypes.map(type => (
                    <option key={type} value={type} className="bg-slate-800 text-slate-200">{type}</option>
                  ))}
                </select>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-xs font-medium text-slate-400">Live</span>
                  <span className="text-sm font-bold text-red-400">{liveAuctions.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-xs font-medium text-slate-400">Upcoming</span>
                  <span className="text-sm font-bold text-green-400">{upcomingAuctions.length}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs font-medium text-slate-400">Total</span>
                  <span className="text-sm font-bold text-white">{filteredAuctions.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {filteredAuctions.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-white mb-3">No auctions today</h3>
                <p className="text-slate-400 text-lg">There are no auctions scheduled for today.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Live Auctions Section */}
                {liveAuctions.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                      Live Auctions ({liveAuctions.length})
                    </h2>
                    <div className="space-y-4">
                      {paginatedLiveAuctions.map((auction) => (
                        <AuctionCard
                          key={auction.id}
                          auction={auction}
                          onAuctionClick={handleAuctionClick}
                          formatTime={formatTime}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Auctions Section */}
                {upcomingAuctions.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <Clock className="h-6 w-6 text-green-400" />
                      Upcoming Auctions ({upcomingAuctions.length})
                    </h2>
                    <div className="space-y-4">
                      {paginatedUpcomingAuctions.map((auction) => (
                        <AuctionCard
                          key={auction.id}
                          auction={auction}
                          onAuctionClick={handleAuctionClick}
                          formatTime={formatTime}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-slate-900/50 backdrop-blur-xl px-6 py-4 border border-slate-700 rounded-2xl shadow-2xl">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-6 py-3 border border-slate-600 text-sm font-semibold rounded-xl text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-6 py-3 border border-slate-600 text-sm font-semibold rounded-xl text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-300">
                          Showing <span className="font-semibold text-white">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                          <span className="font-semibold text-white">
                            {Math.min(currentPage * itemsPerPage, filteredAuctions.length)}
                          </span>{' '}
                          of <span className="font-semibold text-white">{filteredAuctions.length}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-semibold transition-all duration-200 ${
                                page === currentPage
                                  ? 'z-10 bg-blue-500/20 border-blue-500 text-blue-400'
                                  : 'bg-slate-800/60 border-slate-600 text-slate-300 hover:bg-slate-700/60'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - About Section */}
          <div className="lg:w-64">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-6 sticky top-8">
              <h3 className="text-lg font-bold text-white mb-6">About Today's Auctions</h3>
              <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
                <p className="text-sm">
                  Today's auctions feature live and upcoming vehicle sales from various locations. 
                  Live auctions are currently in progress and accepting bids.
                </p>
                <p className="text-sm">
                  Upcoming auctions are scheduled to start later today. You can view the vehicle 
                  inventory for each auction by clicking "View List".
                </p>
                <div className="space-y-3">
                  <h4 className="font-semibold text-white text-sm">Features:</h4>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      Real-time auction status
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      Live bid tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      Vehicle inventory preview
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      Location-based filtering
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      Sale type categorization
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <Link
                    to="/vehicle-finder"
                    className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors duration-200"
                  >
                    Browse All Vehicles →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auction Details Modal */}
        {showAuctionModal && selectedAuction && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-600 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-white">{selectedAuction.name}</h3>
                  <button
                    onClick={() => setShowAuctionModal(false)}
                    className="text-slate-400 hover:text-slate-200 transition-colors duration-200 p-2 hover:bg-slate-700/50 rounded-lg"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-8">
                  {/* Auction Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-semibold text-slate-400 mb-2 block">Start Time</label>
                      <p className="text-base text-white font-medium">{formatTime(selectedAuction.startTimeUtc)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-400 mb-2 block">End Time</label>
                      <p className="text-base text-white font-medium">{formatTime(selectedAuction.endTimeUtc)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-400 mb-2 block">Status</label>
                      <p className="text-base text-white font-medium">{selectedAuction.status}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-400 mb-2 block">Type</label>
                      <p className="text-base text-white font-medium">{selectedAuction.type}</p>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div>
                    <h4 className="text-xl font-bold text-white mb-6">Location Details</h4>
                    <div className="bg-slate-700/50 rounded-xl p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-slate-400" />
                        <span className="text-base text-white font-medium">{selectedAuction.location.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-slate-400" />
                        <span className="text-base text-slate-200">{selectedAuction.location.city}, {selectedAuction.location.region}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-slate-400" />
                        <span className="text-base text-slate-200">{selectedAuction.location.address}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-slate-400" />
                        <span className="text-base text-slate-200">{selectedAuction.location.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-slate-400" />
                        <span className="text-base text-slate-200">{selectedAuction.location.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Auction Stats */}
                  <div>
                    <h4 className="text-xl font-bold text-white mb-6">Auction Statistics</h4>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                        <div className="text-3xl font-bold text-blue-400 mb-2">{selectedAuction.totalCars}</div>
                        <div className="text-sm text-slate-400 font-medium">Total Vehicles</div>
                      </div>
                      <div className="text-center p-6 bg-green-500/20 border border-green-500/30 rounded-xl">
                        <div className="text-3xl font-bold text-green-400 mb-2">{selectedAuction.soldCars}</div>
                        <div className="text-sm text-slate-400 font-medium">Sold</div>
                      </div>
                      <div className="text-center p-6 bg-purple-500/20 border border-purple-500/30 rounded-xl">
                        <div className="text-3xl font-bold text-purple-400 mb-2">${selectedAuction.totalRevenue.toLocaleString()}</div>
                        <div className="text-sm text-slate-400 font-medium">Revenue</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-6 border-t border-slate-600">
                    <Link
                      to={`/auctions/${selectedAuction.id}/cars`}
                      className="flex-1 bg-blue-600 text-white text-center py-4 px-6 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      View Vehicle List
                    </Link>
                    <button
                      onClick={() => setShowAuctionModal(false)}
                      className="px-6 py-4 border border-slate-600 text-slate-200 rounded-xl hover:bg-slate-700/50 transition-all duration-200 font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaysAuctions;
