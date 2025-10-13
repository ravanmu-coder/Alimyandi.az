import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { AuctionGetDto } from '../types/api';
import AuctionCard from '../components/AuctionCard';
import { Search, Filter, Calendar, Clock, CheckCircle, X } from 'lucide-react';

type FilterType = 'all' | 'live' | 'upcoming' | 'active' | 'ended';

export default function Auctions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [auctions, setAuctions] = useState<AuctionGetDto[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<AuctionGetDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filters = [
    { key: 'all', label: 'All Auctions', icon: Calendar },
    { key: 'live', label: 'Live', icon: Clock },
    { key: 'upcoming', label: 'Upcoming', icon: Calendar },
    { key: 'active', label: 'Active', icon: CheckCircle },
  ] as const;

  useEffect(() => {
    const filterParam = searchParams.get('filter') as FilterType;
    if (filterParam && filters.find(f => f.key === filterParam)) {
      setActiveFilter(filterParam);
    }
    loadAuctions();
  }, [searchParams]);

  useEffect(() => {
    filterAuctions();
  }, [auctions, searchTerm, activeFilter]);

  const loadAuctions = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAuctions();
      
      // Filter out ended/completed auctions by default
      const activeAuctions = data.filter(auction => {
        const status = auction.status?.toLowerCase();
        const startTime = new Date(auction.startTimeUtc);
        const now = new Date();
        
        // Include if status is "Running" or if start time is in the future
        return (auction.isLive || status === 'running') || startTime > now;
      });
      
      setAuctions(activeAuctions);
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAuctions = () => {
    let filtered = [...auctions];

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(auction => {
        const status = auction.status?.toLowerCase();
        const startTime = new Date(auction.startTimeUtc);
        const now = new Date();
        
        switch (activeFilter) {
          case 'live':
            return auction.isLive || status === 'running';
          case 'upcoming':
            return startTime > now && !auction.isLive && status !== 'running';
          case 'active':
            return auction.isLive || status === 'running' || status === 'active';
          case 'ended':
            return status === 'ended' || status === 'completed';
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(auction =>
        (auction.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (auction.locationName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAuctions(filtered);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    const newSearchParams = new URLSearchParams(searchParams);
    if (filter === 'all') {
      newSearchParams.delete('filter');
    } else {
      newSearchParams.set('filter', filter);
    }
    setSearchParams(newSearchParams);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Auctions</h1>
          <p className="text-gray-600">Discover and bid on amazing vehicle auctions</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          {/* Search */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search auctions by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  onClick={() => handleFilterChange(filter.key)}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {filter.label}
                  {filter.key !== 'all' && (
                    <span className="ml-2 bg-white px-2 py-0.5 rounded-full text-xs">
                      {auctions.filter(auction => {
                        const status = auction.status?.toLowerCase();
                        const startTime = new Date(auction.startTimeUtc);
                        const now = new Date();
                        
                        switch (filter.key) {
                          case 'live':
                            return auction.isLive || status === 'running';
                          case 'upcoming':
                            return startTime > now && !auction.isLive && status !== 'running';
                          case 'active':
                            return auction.isLive || status === 'running' || status === 'active';
                          default:
                            return false;
                        }
                      }).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredAuctions.length} auction{filteredAuctions.length !== 1 ? 's' : ''} found
            </h2>
            {searchTerm && (
              <div className="text-sm text-gray-600">
                Results for "<span className="font-medium">{searchTerm}</span>"
              </div>
            )}
          </div>
        </div>

        {/* Auctions Grid */}
        {filteredAuctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No auctions found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? `No auctions match your search "${searchTerm}"`
                : `No auctions match the selected filter "${filters.find(f => f.key === activeFilter)?.label}"`
              }
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveFilter('all');
                setSearchParams(new URLSearchParams());
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}