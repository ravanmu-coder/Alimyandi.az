import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  MapPin, 
  ExternalLink,
  Info,
  ArrowRight,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuth } from '../hooks/useAuth';


interface AuctionSale {
  id: string;
  saleTime: string;
  saleName: string;
  region: string;
  saleType: string;
  saleHighlights: string[];
  currentSale: string;
  nextSale: string;
  futureSaleStatus: 'Upcoming' | 'Live' | 'Completed' | 'Cancelled';
  location: string;
  totalCars: number;
  soldCars: number;
  totalRevenue: number;
  isLive: boolean;
}

interface SalesListFilters {
  searchQuery: string;
  region: string;
  status: 'all' | 'live' | 'upcoming';
}

type SortField = 'saleTime' | 'saleName' | 'region' | 'saleType' | 'currentSale';
type SortDirection = 'asc' | 'desc';

const SalesList: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<AuctionSale[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SalesListFilters>({
    searchQuery: '',
    region: '',
    status: 'all'
  });
  const [sortField, setSortField] = useState<SortField>('saleTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Role-based access control
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const roles = user?.user?.roles;
    const isMember = roles && roles.includes('Member');
    const isSeller = roles && roles.includes('Seller');
    
    if (!isMember && !isSeller) {
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Load data on component mount
  useEffect(() => {
    if (isAuthenticated && (user?.user?.roles?.includes('Member') || user?.user?.roles?.includes('Seller'))) {
      loadSalesData();
    }
  }, [isAuthenticated, user]);

  // Reload data when status filter changes
  useEffect(() => {
    loadSalesData();
  }, [filters.status]);

  const loadSalesData = async () => {
    setLoading(true);
    try {
      console.log('Loading sales data with filter:', filters.status);
      
      let salesData: any[] = [];
      
      // Load data based on status filter
      switch (filters.status) {
        case 'live':
          salesData = await apiClient.getLiveSalesList();
          break;
        case 'upcoming':
          salesData = await apiClient.getUpcomingSalesList();
          break;
        case 'all':
        default:
          salesData = await apiClient.getSalesList();
          break;
      }
      
      setAuctions(salesData);

      // Load regions
      const regionsData = await apiClient.getRegions();
      setRegions(regionsData);

      console.log(`Loaded ${salesData.length} auctions for status: ${filters.status}`);
    } catch (error) {
      console.error('Error loading sales data:', error);
      setAuctions([]);
      setRegions([]);
    } finally {
      setLoading(false);
    }
  };



  const handleFilterChange = (field: keyof SalesListFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Live': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'Upcoming': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'Completed': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'Cancelled': return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const filteredAuctions = auctions.filter(auction => {
    const matchesRegion = !filters.region || auction.region === filters.region;
    const matchesSearch = !filters.searchQuery || 
      auction.saleName.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      auction.location.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      auction.region.toLowerCase().includes(filters.searchQuery.toLowerCase());

    return matchesRegion && matchesSearch;
  });

  const sortedAuctions = [...filteredAuctions].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'saleTime' || sortField === 'currentSale') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else {
      aValue = aValue?.toString().toLowerCase() || '';
      bValue = bValue?.toString().toLowerCase() || '';
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const paginatedAuctions = sortedAuctions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAuctions.length / itemsPerPage);

  const handleAuctionClick = (auction: AuctionSale) => {
    navigate(`/auction/${auction.id}`);
  };

  const handleCurrentSaleClick = (auction: AuctionSale) => {
    navigate(`/auction/${auction.id}/cars`);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-8 sm:px-8 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {filters.status === 'live' ? 'Live Auctions' : 
             filters.status === 'upcoming' ? 'Upcoming Auctions' : 
             'All Auctions'}
          </h1>
          <p className="text-slate-400">
            {filters.status === 'live' ? 'Browse and join live auctions' : 
             filters.status === 'upcoming' ? 'Browse and filter upcoming auctions' : 
             'Browse and filter all auctions (live and upcoming)'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Filters */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Status Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value as 'all' | 'live' | 'upcoming')}
                      className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer appearance-none"
                    >
                      <option value="all" className="bg-slate-800 text-slate-200">All Auctions</option>
                      <option value="live" className="bg-slate-800 text-slate-200">Live Auctions</option>
                      <option value="upcoming" className="bg-slate-800 text-slate-200">Upcoming Auctions</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Region Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Region
                  </label>
                  <div className="relative">
                    <select
                      value={filters.region}
                      onChange={(e) => handleFilterChange('region', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer appearance-none"
                    >
                      <option value="" className="bg-slate-800 text-slate-200">All Regions</option>
                      {regions.map(region => (
                        <option key={region} value={region} className="bg-slate-800 text-slate-200">
                          {region}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Search Box */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by location or region..."
                      value={filters.searchQuery}
                      onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-4 py-3 pl-12 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:shadow-md hover:scale-105 placeholder-slate-400"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth="1.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th 
                            className="px-3 py-4 text-left text-sm font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800/50 transition-all duration-200"
                            onClick={() => handleSort('saleTime')}
                          >
                            <div className="flex items-center gap-2">
                              SALE TIME
                              {sortField === 'saleTime' && (
                                sortDirection === 'asc' ? <SortAsc className="h-4 w-4 text-blue-400" strokeWidth="1.5" /> : <SortDesc className="h-4 w-4 text-blue-400" strokeWidth="1.5" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-3 py-4 text-left text-sm font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800/50 transition-all duration-200"
                            onClick={() => handleSort('saleName')}
                          >
                            <div className="flex items-center gap-2">
                              SALE NAME
                              {sortField === 'saleName' && (
                                sortDirection === 'asc' ? <SortAsc className="h-4 w-4 text-blue-400" strokeWidth="1.5" /> : <SortDesc className="h-4 w-4 text-blue-400" strokeWidth="1.5" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-3 py-4 text-left text-sm font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800/50 transition-all duration-200"
                            onClick={() => handleSort('region')}
                          >
                            <div className="flex items-center gap-2">
                              REGION
                              {sortField === 'region' && (
                                sortDirection === 'asc' ? <SortAsc className="h-4 w-4 text-blue-400" strokeWidth="1.5" /> : <SortDesc className="h-4 w-4 text-blue-400" strokeWidth="1.5" />
                              )}
                            </div>
                          </th>
                          <th className="px-3 py-4 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">
                            HIGHLIGHTS
                          </th>
                          <th 
                            className="px-3 py-4 text-left text-sm font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800/50 transition-all duration-200"
                            onClick={() => handleSort('currentSale')}
                          >
                            <div className="flex items-center gap-2">
                              CURRENT SALE
                              {sortField === 'currentSale' && (
                                sortDirection === 'asc' ? <SortAsc className="h-4 w-4 text-blue-400" strokeWidth="1.5" /> : <SortDesc className="h-4 w-4 text-blue-400" strokeWidth="1.5" />
                              )}
                            </div>
                          </th>
                          <th className="px-3 py-4 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">
                            NEXT SALE
                          </th>
                          <th className="px-3 py-4 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">
                            STATUS
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAuctions.map((auction) => (
                          <tr 
                            key={auction.id}
                            className="hover:bg-slate-800/50 hover:-translate-y-px cursor-pointer transition-all duration-200 border-b border-slate-700 active:scale-[0.99] group"
                            onClick={() => handleAuctionClick(auction)}
                          >
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors duration-200" strokeWidth="1.5" />
                                <div>
                                  <div className="text-sm font-medium text-slate-200">{formatDate(auction.saleTime)}</div>
                                  <div className="text-sm text-slate-400">{formatTime(auction.saleTime)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors duration-200">{auction.saleName}</div>
                              <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                                <MapPin className="h-3 w-3" strokeWidth="1.5" />
                                {auction.location}
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-200">
                              {auction.region}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-2">
                                {auction.saleHighlights.slice(0, 2).map((highlight, idx) => (
                                  <span 
                                    key={idx}
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-md hover:scale-105 ${
                                      highlight.toLowerCase().includes('exotic') ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                      highlight.toLowerCase().includes('luxury') ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                      highlight.toLowerCase().includes('classic') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    }`}
                                  >
                                    {highlight}
                                  </span>
                                ))}
                                {auction.saleHighlights.length > 2 && (
                                  <span className="text-xs text-slate-400">+{auction.saleHighlights.length - 2}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCurrentSaleClick(auction);
                                }}
                                className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105"
                              >
                                {formatDate(auction.currentSale)}
                                <ExternalLink className="h-3 w-3" strokeWidth="1.5" />
                              </button>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-200">
                              {formatDate(auction.nextSale)}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-md hover:scale-105 ${getStatusColor(auction.futureSaleStatus)}`}>
                                {auction.futureSaleStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-slate-900/50 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-t border-slate-700">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-lg text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md hover:scale-105"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-lg text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md hover:scale-105"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-slate-400">
                            Showing{' '}
                            <span className="font-medium text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span>
                            {' '}to{' '}
                            <span className="font-medium text-slate-200">
                              {Math.min(currentPage * itemsPerPage, filteredAuctions.length)}
                            </span>
                            {' '}of{' '}
                            <span className="font-medium text-slate-200">{filteredAuctions.length}</span>
                            {' '}results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-slate-600 bg-slate-800/60 text-sm font-medium text-slate-400 hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md hover:scale-105"
                            >
                              Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const pageNum = i + 1;
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-105 ${
                                    currentPage === pageNum
                                      ? 'z-10 bg-blue-500/20 border-blue-500 text-blue-400 shadow-sm'
                                      : 'bg-slate-800/60 border-slate-600 text-slate-400 hover:bg-slate-700/60'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-slate-600 bg-slate-800/60 text-sm font-medium text-slate-400 hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md hover:scale-105"
                            >
                              Next
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* About Sales List Panel */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <Info className="h-5 w-5 text-blue-400" strokeWidth="1.5" />
                <h3 className="text-lg font-semibold text-slate-200">
                  {filters.status === 'live' ? 'About Live Auctions' : 
                   filters.status === 'upcoming' ? 'About Upcoming Auctions' : 
                   'About All Auctions'}
                </h3>
              </div>
              
              <div className="space-y-6 text-sm text-slate-400">
                <p className="leading-relaxed">
                  {filters.status === 'live' ? 'Shows all currently live auctions that you can join and bid on.' : 
                   filters.status === 'upcoming' ? 'Shows all future auctions scheduled to take place.' : 
                   'Shows all auctions including live and upcoming. Filter by status, region and search by location.'}
                </p>
                
                <div>
                  <h4 className="font-semibold text-slate-200 mb-3">What You'll See:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong className="text-slate-200">Sale Time:</strong> When auction starts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong className="text-slate-200">Sale Name:</strong> Auction name and location</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong className="text-slate-200">Region:</strong> Geographic region</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong className="text-slate-200">Highlights:</strong> Special features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong className="text-slate-200">Current Sale:</strong> Click to view cars</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-3">Features:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{filters.status === 'live' ? 'Live auctions only' : 
                         filters.status === 'upcoming' ? 'Upcoming auctions only' : 
                         'All auctions (live & upcoming)'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Status filtering (Live/Upcoming/All)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Region filtering</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Search by location</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Sortable columns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Mobile-responsive</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 border-t border-slate-700">
                  <h4 className="font-semibold text-slate-200 mb-4">Quick Links:</h4>
                  <div className="space-y-3">
                    <Link 
                      to="/vehicle-finder" 
                      className="flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-all duration-200 hover:scale-105 text-sm group"
                    >
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" strokeWidth="1.5" />
                      Vehicle Finder
                    </Link>
                    <Link 
                      to="/todays-auctions" 
                      className="flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-all duration-200 hover:scale-105 text-sm group"
                    >
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" strokeWidth="1.5" />
                      Today's Auctions
                    </Link>
                    <Link 
                      to="/auctions/calendar" 
                      className="flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-all duration-200 hover:scale-105 text-sm group"
                    >
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" strokeWidth="1.5" />
                      Auction Calendar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesList;
