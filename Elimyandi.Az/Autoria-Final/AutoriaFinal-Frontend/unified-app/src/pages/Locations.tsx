import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Phone, Clock, ArrowRight } from 'lucide-react';
import { locationApi, LocationDetails } from '../api/locations';
import { useTranslation } from 'react-i18next';

export default function Locations() {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<LocationDetails[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load locations on component mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🏢 Loading all locations...');
        
        const locationsData = await locationApi.getLocations();
        console.log('✅ Locations loaded:', locationsData);
        
        setLocations(locationsData);
        setFilteredLocations(locationsData);
      } catch (err) {
        console.error('❌ Error loading locations:', err);
        setError('Failed to load locations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, []);

  // Filter locations based on search query (client-side)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLocations(locations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = locations.filter(location => 
      location.name?.toLowerCase().includes(query) ||
      location.city?.toLowerCase().includes(query) ||
      location.region?.toLowerCase().includes(query) ||
      location.address?.toLowerCase().includes(query)
    );

    setFilteredLocations(filtered);
  }, [searchQuery, locations]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by useEffect above
  };

  // Get location image based on location name/city
  const getLocationImage = (location: LocationDetails): string => {
    // Using high-quality stock images for auction facilities
    const imageMap: { [key: string]: string } = {
      'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=400&fit=crop&crop=center',
      'Los Angeles': 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=800&h=400&fit=crop&crop=center',
      'Chicago': 'https://images.unsplash.com/photo-1494522358652-f30e61a60313?w=800&h=400&fit=crop&crop=center',
      'Houston': 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=400&fit=crop&crop=center',
      'Phoenix': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop&crop=center',
      'Miami': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop&crop=center',
      'Dallas': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop&crop=center',
      'Atlanta': 'https://images.unsplash.com/photo-1440778303588-435521a205bc?w=800&h=400&fit=crop&crop=center',
      'Denver': 'https://images.unsplash.com/photo-1464822759844-d150baec0494?w=800&h=400&fit=crop&crop=center',
      'Seattle': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop&crop=center'
    };

    // Try to match by city first, then by name, otherwise use default
    const key = location.city || location.name || '';
    return imageMap[key] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop&crop=center';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading Skeleton */}
          <div className="animate-pulse">
            <div className="h-12 bg-slate-800 rounded-lg mb-8 w-1/3"></div>
            <div className="h-16 bg-slate-800 rounded-xl mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-2xl h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-900/20 backdrop-blur-lg border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="text-red-400 text-lg font-medium mb-4">
              {error}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Locations
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Discover our auction facilities across the country. Each location offers state-of-the-art facilities and professional services for all your automotive auction needs.
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-12">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative bg-slate-900/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-2 shadow-2xl">
              <div className="flex items-center">
                <div className="flex-shrink-0 pl-4">
                  <Search className="h-6 w-6 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search locations by name, city, or address..."
                  className="flex-1 bg-transparent border-none outline-none px-4 py-4 text-white placeholder-slate-400 text-lg"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-blue-500/25 mr-2"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results Count */}
        <div className="mb-8">
          <p className="text-slate-300 text-center">
            {filteredLocations.length === locations.length 
              ? `Showing all ${locations.length} locations`
              : `Found ${filteredLocations.length} of ${locations.length} locations`
            }
          </p>
        </div>

        {/* Locations Grid */}
        {filteredLocations.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-12 max-w-md mx-auto">
              <MapPin className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Locations Found</h3>
              <p className="text-slate-400">
                No locations match your search criteria. Try adjusting your search terms.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                className="group bg-slate-900/50 backdrop-blur-lg border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-105"
              >
                {/* Location Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getLocationImage(location)}
                    alt={`${location.name} facility`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                  
                  {/* Location Badge */}
                  <div className="absolute top-4 left-4">
                    <div className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                      {location.region || 'Location'}
                    </div>
                  </div>
                </div>

                {/* Location Content */}
                <div className="p-6">
                  {/* Location Name */}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors duration-300">
                    {location.name}
                  </h3>

                  {/* Location Details */}
                  <div className="space-y-3 mb-6">
                    {/* Address */}
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-slate-300 text-sm">
                        <div>{location.city}</div>
                        {location.address && (
                          <div className="text-slate-400">{location.address}</div>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    {location.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                        <span className="text-slate-300 text-sm">{location.phone}</span>
                      </div>
                    )}

                    {/* Hours */}
                    {location.hours && (
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-blue-400 flex-shrink-0" />
                        <span className="text-slate-300 text-sm">{location.hours}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {location.description && (
                    <p className="text-slate-400 text-sm mb-6 line-clamp-3">
                      {location.description}
                    </p>
                  )}

                  {/* Details Link */}
                  <Link
                    to={`/locations/${location.id}`}
                    className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-300 font-medium group"
                  >
                    <span>View Details</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-slate-300 mb-6">
              Contact our team to learn more about upcoming locations or special auction events in your area.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-blue-500/25"
              >
                Contact Us
              </Link>
              <Link
                to="/auctions/calendar"
                className="bg-slate-700/50 backdrop-blur-sm border border-slate-600 text-white px-8 py-3 rounded-xl hover:bg-slate-600/50 hover:border-slate-500 transition-all duration-300 font-medium"
              >
                View Auction Calendar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
