import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Mail, 
  ArrowLeft, 
  Calendar,
  Car,
  Search,
  ChevronRight,
  ExternalLink,
  ChevronLeft,
  Globe,
  Building
} from 'lucide-react';
import { locationApi, LocationDetails } from '../api/locations';
import { apiClient } from '../lib/api';
import { AuctionGetDto } from '../types/api';

interface LocationAuction extends AuctionGetDto {
  timeCategory: 'live' | 'today' | 'upcoming';
  formattedTime: string;
}

export default function LocationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [location, setLocation] = useState<LocationDetails | null>(null);
  const [filteredAuctions, setFilteredAuctions] = useState<LocationAuction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const AUCTIONS_PER_PAGE = 10;
  
  // Vehicle Finder Form State
  const [vehicleFilters, setVehicleFilters] = useState({
    make: '',
    model: '',
    year: '',
    condition: '',
    location: ''
  });

  // Filter auctions to show only today and tomorrow
  const filterAuctionsByDate = (auctionsData: LocationAuction[]): LocationAuction[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    return auctionsData.filter(auction => {
      const auctionStart = new Date(auction.startTimeUtc);
      const auctionDate = new Date(auctionStart.getFullYear(), auctionStart.getMonth(), auctionStart.getDate());
      
      // Include auctions that start today or tomorrow
      return auctionDate >= today && auctionDate < dayAfterTomorrow;
    });
  };

  // Get paginated auctions for current page
  const getPaginatedAuctions = (): LocationAuction[] => {
    const startIndex = (currentPage - 1) * AUCTIONS_PER_PAGE;
    const endIndex = startIndex + AUCTIONS_PER_PAGE;
    return filteredAuctions.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredAuctions.length / AUCTIONS_PER_PAGE);

  // Load location details and auctions
  useEffect(() => {
    const loadLocationData = async () => {
      if (!id) {
        setError('Location ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`🏢 Loading location details for ID: ${id}`);
        
        // Load location details and auctions in parallel
        const [locationData, auctionsData] = await Promise.all([
          locationApi.getLocation(id),
          apiClient.getAuctionsByLocation(id)
        ]);
        
        console.log('✅ Location data loaded:', locationData);
        console.log('✅ Auctions data loaded:', auctionsData);
        
        setLocation(locationData);
        
        // Pre-fill location filter with current location
        setVehicleFilters(prev => ({
          ...prev,
          location: locationData.name || locationData.city || ''
        }));
        
        // Process auctions and categorize them
        const processedAuctions = auctionsData.map(auction => {
          const now = new Date();
          const startTime = new Date(auction.startTimeUtc);
          const endTime = new Date(auction.endTimeUtc);
          
          let timeCategory: 'live' | 'today' | 'upcoming' = 'upcoming';
          let formattedTime = '';
          
          // Determine time category
          if (auction.isLive && now >= startTime && now <= endTime) {
            timeCategory = 'live';
            formattedTime = 'Live Now';
          } else if (startTime.toDateString() === now.toDateString()) {
            timeCategory = 'today';
            formattedTime = startTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            });
          } else {
            timeCategory = 'upcoming';
            formattedTime = startTime.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
          
          return {
            ...auction,
            timeCategory,
            formattedTime
          } as LocationAuction;
        });
        
        // Sort auctions: Live first, then today, then upcoming
        const sortedAuctions = processedAuctions.sort((a, b) => {
          const order = { live: 0, today: 1, upcoming: 2 };
          if (order[a.timeCategory] !== order[b.timeCategory]) {
            return order[a.timeCategory] - order[b.timeCategory];
          }
          // Within same category, sort by start time
          return new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime();
        });
        
        // Filter auctions to show only today and tomorrow
        const filtered = filterAuctionsByDate(sortedAuctions);
        setFilteredAuctions(filtered);
        
        // Reset to first page when data changes
        setCurrentPage(1);
        
      } catch (err) {
        console.error('❌ Error loading location data:', err);
        setError('Failed to load location details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadLocationData();
  }, [id]);

  const handleVehicleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build query parameters
    const params = new URLSearchParams();
    Object.entries(vehicleFilters).forEach(([key, value]) => {
      if (value.trim()) {
        params.append(key, value.trim());
      }
    });
    
    // Navigate to vehicle finder with filters
    navigate(`/vehicle-finder?${params.toString()}`);
  };

  const getLocationImage = (location: LocationDetails): string => {
    const imageMap: { [key: string]: string } = {
      'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&h=600&fit=crop&crop=center',
      'Los Angeles': 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=1200&h=600&fit=crop&crop=center',
      'Chicago': 'https://images.unsplash.com/photo-1494522358652-f30e61a60313?w=1200&h=600&fit=crop&crop=center',
      'Houston': 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=1200&h=600&fit=crop&crop=center',
      'Phoenix': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop&crop=center',
      'Miami': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop&crop=center',
      'Dallas': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=600&fit=crop&crop=center',
      'Atlanta': 'https://images.unsplash.com/photo-1440778303588-435521a205bc?w=1200&h=600&fit=crop&crop=center',
      'Denver': 'https://images.unsplash.com/photo-1464822759844-d150baec0494?w=1200&h=600&fit=crop&crop=center',
      'Seattle': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=600&fit=crop&crop=center'
    };

    const key = location.city || location.name || '';
    return imageMap[key] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop&crop=center';
  };

  const getAuctionStatusBadge = (auction: LocationAuction) => {
    switch (auction.timeCategory) {
      case 'live':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
            <div className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></div>
            Live Now
          </span>
        );
      case 'today':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
            Today
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Tomorrow
          </span>
        );
      default:
        return null;
    }
  };

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-center space-x-2 mt-8 pt-6 border-t border-slate-700">
        {/* Previous Button */}
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800/50 disabled:hover:border-slate-600"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-slate-500">...</span>
              ) : (
                <button
                  onClick={() => setCurrentPage(page as number)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'bg-slate-800/50 backdrop-blur-sm border border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800/50 disabled:hover:border-slate-600"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded-lg mb-8 w-32"></div>
            <div className="h-64 bg-slate-800 rounded-2xl mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 h-96 bg-slate-800 rounded-2xl"></div>
              <div className="lg:col-span-2 h-96 bg-slate-800 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="min-h-screen bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-900/20 backdrop-blur-lg border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="text-red-400 text-lg font-medium mb-4">
              {error || 'Location not found'}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/locations')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium"
              >
                Back to Locations
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-slate-700/50 backdrop-blur-sm border border-slate-600 text-white px-6 py-3 rounded-lg hover:bg-slate-600/50 hover:border-slate-500 transition-all duration-300 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const paginatedAuctions = getPaginatedAuctions();

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/locations')}
          className="inline-flex items-center space-x-2 text-slate-300 hover:text-white transition-colors duration-300 mb-8 group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
          <span>Back to Locations</span>
        </button>

        {/* Hero Section */}
        <div className="relative mb-12">
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
            <img
              src={getLocationImage(location)}
              alt={`${location.name} facility`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent"></div>
            
            {/* Location Info Overlay */}
            <div className="absolute inset-0 flex items-end">
              <div className="p-8">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  {location.name}
                </h1>
                <div className="flex items-center space-x-4 text-slate-200">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>{location.city}</span>
                  </div>
                  {location.region && (
                    <div className="bg-blue-500/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                      {location.region}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Location Information & Vehicle Finder */}
          <div className="lg:col-span-1 space-y-8">
            {/* Enhanced Location Information Card */}
            <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Building className="h-6 w-6 mr-2 text-blue-400" />
                {location.name || 'Location Information'}
              </h2>
              
              <div className="space-y-4">
                {/* Full Address */}
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
                  <div className="text-slate-300">
                    <div className="font-medium">
                      {[
                        location.address,
                        location.city,
                        location.region
                      ].filter(Boolean).join(', ')}
                    </div>
                    {/* Postal Code and Country */}
                    <div className="text-sm text-slate-400 mt-1">
                      {[
                        (location as any).postalCode || (location as any).zipCode,
                        (location as any).country
                      ].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>

                {/* Phone */}
                {location.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <a 
                      href={`tel:${location.phone}`}
                      className="text-slate-300 hover:text-blue-300 transition-colors duration-300"
                    >
                      {location.phone}
                    </a>
                  </div>
                )}

                {/* Email */}
                {location.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <a 
                      href={`mailto:${location.email}`}
                      className="text-slate-300 hover:text-blue-300 transition-colors duration-300"
                    >
                      {location.email}
                    </a>
                  </div>
                )}

                {/* Hours */}
                {location.hours && (
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
                    <div className="text-slate-300 text-sm">
                      {location.hours}
                    </div>
                  </div>
                )}

                {/* Website/Online Services */}
                {(location as any).website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <a 
                      href={(location as any).website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-300 hover:text-blue-300 transition-colors duration-300"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>

              {/* Description */}
              {location.description && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {location.description}
                  </p>
                </div>
              )}

              {/* Additional Location Details */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {(location as any).latitude && (location as any).longitude && (
                    <div>
                      <div className="text-slate-400">Coordinates</div>
                      <div className="text-slate-300 font-mono text-xs">
                        {(location as any).latitude}, {(location as any).longitude}
                      </div>
                    </div>
                  )}
                  {location.auctionJoinDate && (
                    <div>
                      <div className="text-slate-400">Member Since</div>
                      <div className="text-slate-300">
                        {new Date(location.auctionJoinDate).getFullYear()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vehicle Finder Card */}
            <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Car className="h-6 w-6 mr-2 text-blue-400" />
                Vehicle Finder
              </h2>
              
              <form onSubmit={handleVehicleSearch} className="space-y-4">
                {/* Make */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Make
                  </label>
                  <input
                    type="text"
                    value={vehicleFilters.make}
                    onChange={(e) => setVehicleFilters(prev => ({ ...prev, make: e.target.value }))}
                    placeholder="e.g., BMW, Mercedes"
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={vehicleFilters.model}
                    onChange={(e) => setVehicleFilters(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g., X5, C-Class"
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    value={vehicleFilters.year}
                    onChange={(e) => setVehicleFilters(prev => ({ ...prev, year: e.target.value }))}
                    placeholder="e.g., 2020"
                    min="1990"
                    max="2024"
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                  />
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Condition
                  </label>
                  <select
                    value={vehicleFilters.condition}
                    onChange={(e) => setVehicleFilters(prev => ({ ...prev, condition: e.target.value }))}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors duration-300"
                  >
                    <option value="">All Conditions</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="salvage">Salvage</option>
                  </select>
                </div>

                {/* Location (Pre-filled) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={vehicleFilters.location}
                    onChange={(e) => setVehicleFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-blue-500/25 flex items-center justify-center space-x-2"
                >
                  <Search className="h-5 w-5" />
                  <span>Search Vehicles</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Today & Tomorrow Auctions */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Calendar className="h-6 w-6 mr-2 text-blue-400" />
                  Today & Tomorrow Auctions
                </h2>
                {filteredAuctions.length > 0 && (
                  <div className="text-sm text-slate-400">
                    Showing {filteredAuctions.length} auction{filteredAuctions.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {filteredAuctions.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Auctions Today or Tomorrow</h3>
                  <p className="text-slate-400 mb-6">
                    There are currently no auctions scheduled for today or tomorrow at this location.
                  </p>
                  <Link
                    to="/auctions/calendar"
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium"
                  >
                    <Calendar className="h-5 w-5" />
                    <span>View All Auctions</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedAuctions.map((auction) => (
                    <div
                      key={auction.id}
                      className="bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-white group-hover:text-blue-200 transition-colors duration-300">
                              {auction.name || 'Auction'}
                            </h3>
                            {getAuctionStatusBadge(auction)}
                          </div>
                          <p className="text-slate-400 text-sm">
                            {auction.formattedTime}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">
                            {auction.totalCarsCount || 0}
                          </div>
                          <div className="text-xs text-slate-400">Total Cars</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">
                            {auction.soldCarsCount || 0}
                          </div>
                          <div className="text-xs text-slate-400">Sold</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-400">
                            {(auction.totalCarsCount || 0) - (auction.soldCarsCount || 0)}
                          </div>
                          <div className="text-xs text-slate-400">Available</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">
                            ${(auction.totalRevenue || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-400">Revenue</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">
                          {auction.timeCategory === 'live' && (
                            <span className="text-red-400 font-medium">🔴 Live Auction</span>
                          )}
                          {auction.timeCategory === 'today' && (
                            <span className="text-orange-400 font-medium">📅 Starting Today</span>
                          )}
                          {auction.timeCategory === 'upcoming' && (
                            <span className="text-blue-400 font-medium">🗓️ Tomorrow</span>
                          )}
                        </div>
                        
                        <Link
                          to={`/auctions/${auction.id}`}
                          className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-300 font-medium group"
                        >
                          <span>View Sale List</span>
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </Link>
                      </div>
                    </div>
                  ))}

                  {/* Pagination Controls */}
                  <PaginationControls />

                  {/* View All Auctions Link */}
                  <div className="text-center pt-6">
                    <Link
                      to="/auctions/calendar"
                      className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-300 font-medium group"
                    >
                      <span>View All Auctions</span>
                      <ExternalLink className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
