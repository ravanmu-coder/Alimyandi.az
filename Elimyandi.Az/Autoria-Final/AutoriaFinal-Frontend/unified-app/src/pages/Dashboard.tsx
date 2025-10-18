import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { apiClient } from '../lib/api';
import { AuctionGetDto, CarData } from '../types/api';
import CarPhotos from '../components/CarPhotos';
import { 
  Calendar, 
  Clock, 
  Car,
  ArrowRight,
  Sparkles,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin
} from 'lucide-react';

// Location interface
interface LocationDetails {
  id: string;
  name: string;
  city: string;
  address: string;
}

// Auction with location details
interface AuctionWithLocation extends AuctionGetDto {
  locationDetails?: LocationDetails;
}

// Enhanced Presentation Slider Component
function PresentationSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const slides = [
    {
      id: 1,
      image: '/images/baku-car-market-aerial.jpg',
      title: 'Bakı Avtomobil Bazarı',
      subtitle: 'Hündürlükdən görünüş',
      description: 'Dinamik və müasir avtomobil bazarının panoramik görünüşü',
      overlay: false
    },
    {
      id: 2,
      image: '/images/modern-cars-auction.jpg',
      title: 'Süni İntellekt Gücü ilə Axtarışlarınızı Asanlaşdırırıq',
      subtitle: 'AI ilə Gücləndirilmiş Axtarış',
      description: 'Doğru avtomobili saniyələr içində tapın',
      overlay: true,
      highlight: true
    },
    {
      id: 3,
      image: '/images/auction-action.jpg',
      title: 'Canlı Hərrac Təcrübəsi',
      subtitle: 'Aksiyada',
      description: 'Hərrac prosesinin dinamik və cəlbedici görünüşü',
      overlay: false
    },
    {
      id: 4,
      image: '/images/car-interior-modern.jpg',
      title: 'Müasir Avtomobil İnteryeri',
      subtitle: 'Premium Təcrübə',
      description: 'Yüksək keyfiyyətli və rahat sürücü təcrübəsi',
      overlay: false
    }
  ];

  // Auto-rotation effect
  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isHovered, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div 
      className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden mb-8 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slider Container */}
      <div className="relative aspect-[16/6] overflow-hidden">
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-105'
            }`}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${slide.image})`,
                filter: 'brightness(0.7) contrast(1.1)'
              }}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80" />
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-4xl px-8">
                <h2 className={`text-4xl font-bold mb-4 transition-all duration-500 ${
                  slide.highlight 
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 animate-pulse' 
                    : 'text-white'
                }`}>
                  {slide.title}
                </h2>
                <p className="text-xl text-blue-200 mb-4 font-medium">
                  {slide.subtitle}
                </p>
                <p className="text-lg text-slate-300">
                  {slide.description}
                </p>
                
                {/* Special AI Highlight for slide 2 */}
                {slide.highlight && (
                  <div className="mt-6 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl">
                    <Sparkles className="h-5 w-5 mr-2 text-blue-400 animate-pulse" />
                    <span className="text-blue-200 font-medium">AI Texnologiyası</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-slate-800/60 backdrop-blur-sm border border-white/20 rounded-full p-3 text-white hover:bg-slate-700/80 hover:border-blue-400/50 transition-all duration-300 opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-slate-800/60 backdrop-blur-sm border border-white/20 rounded-full p-3 text-white hover:bg-slate-700/80 hover:border-blue-400/50 transition-all duration-300 opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-blue-400 scale-125'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [liveAuctions, setLiveAuctions] = useState<AuctionWithLocation[]>([]);
  const [recentlyViewedVehicles, setRecentlyViewedVehicles] = useState<CarData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh every 30 seconds to keep data current - same as AllAuctions
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        console.log('🔄 Auto-refreshing dashboard data...');
        loadDashboardData();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isLoading]);

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Loading dashboard data...');
      setIsLoading(true);
      
      // Load all data including locations - same as AllAuctions
      const [allAuctions, allLocations, cars] = await Promise.all([
        apiClient.getAuctions(),
        apiClient.getLocations(),
        apiClient.getCars()
      ]);
      
      console.log(`📊 Loaded ${allAuctions.length} auctions and ${allLocations.length} locations`);
      console.log('Cars:', cars);
      
      // Create location lookup map for efficient access
      const locationMap = new Map();
      allLocations.forEach((location: any) => {
        locationMap.set(location.id, location);
      });
      
      // Filter for active and upcoming auctions only
      // STATUS-BASED FILTERING: Only 'live' and 'upcoming' auctions
      const now = new Date();
      const filteredAuctions = allAuctions.filter(auction => {
        const status = auction.status?.toLowerCase();
        const startTime = new Date(auction.startTimeUtc);
        const endTime = new Date(auction.endTimeUtc);
        
        // Primary filter: Check status field first
        // Accept only 'live', 'upcoming', 'running', 'active', 'scheduled' status
        const validStatuses = ['live', 'upcoming', 'running', 'active', 'scheduled'];
        const hasValidStatus = status && validStatuses.includes(status);
        
        // Secondary filters for additional validation:
        // 1. Include if auction is currently live (isLive = true OR status = 'live'/'running'/'active')
        const isCurrentlyLive = auction.isLive || status === 'live' || status === 'running' || status === 'active';
        
        // 2. Include if auction is upcoming (status = 'upcoming'/'scheduled' OR start time in future)
        const isUpcoming = status === 'upcoming' || status === 'scheduled' || startTime > now;
        
        // 3. Exclude if auction has ended (current time > end time)
        const hasNotEnded = now <= endTime;
        
        // Final decision: Must have valid status AND (be live OR upcoming) AND not ended
        return hasValidStatus && (isCurrentlyLive || isUpcoming) && hasNotEnded;
      });
      
      // Log filtering results for debugging
      const liveCount = filteredAuctions.filter(a => a.isLive || a.status?.toLowerCase() === 'live' || a.status?.toLowerCase() === 'running' || a.status?.toLowerCase() === 'active').length;
      const upcomingCount = filteredAuctions.filter(a => {
        const status = a.status?.toLowerCase();
        return (status === 'upcoming' || status === 'scheduled') && !a.isLive;
      }).length;
      
      console.log(`✅ Filtered to ${filteredAuctions.length} active/future auctions:`);
      console.log(`   📍 Live/Running: ${liveCount}`);
      console.log(`   📅 Upcoming/Scheduled: ${upcomingCount}`);
      console.log(`   🔍 Status breakdown:`, filteredAuctions.map(a => ({
        name: a.name,
        status: a.status,
        isLive: a.isLive,
        startTime: a.startTimeUtc
      })));
      
      // Sort by start time (ascending) - nearest auction first
      const sortedAuctions = filteredAuctions.sort((a, b) => {
        const timeA = new Date(a.startTimeUtc).getTime();
        const timeB = new Date(b.startTimeUtc).getTime();
        return timeA - timeB;
      });
      
      // Enrich auctions with location details using the lookup map
      const auctionsWithLocations: AuctionWithLocation[] = sortedAuctions.map(auction => {
        const locationDetails = locationMap.get(auction.locationId);
        
        return {
          ...auction,
          locationDetails: locationDetails ? {
            id: locationDetails.id,
            name: locationDetails.name || '',
            city: locationDetails.city || '',
            address: locationDetails.address || ''
          } : {
            id: auction.locationId,
            name: auction.locationName || 'Unknown Location',
            city: '',
            address: ''
          }
        };
      });
      
      console.log(`🎯 Final result: ${auctionsWithLocations.length} auctions ready for display`);
      setLiveAuctions(auctionsWithLocations);
      
      // Set recently viewed vehicles (first 8 cars from upcoming auctions)
      setRecentlyViewedVehicles(cars.slice(0, 8));
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setLiveAuctions([]);
    } finally {
      setIsLoading(false);
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format location display - same as AllAuctions
  const formatLocation = (auction: AuctionWithLocation) => {
    if (auction.locationDetails) {
      const { address, city, name } = auction.locationDetails;
      if (city) {
        return city;
      } else if (address) {
        return address;
      } else if (name) {
        return name;
      }
    }
    return auction.locationName || 'TBD';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700/50 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                  <div className="h-4 bg-slate-600/50 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-slate-600/50 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-indigo-900/80 to-slate-900/90"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Xoş gəlmisiniz, {user?.user?.firstName || user?.user?.email?.split('@')[0]}!
              </h1>
              <p className="text-slate-300 text-lg">
                Bu gün hərraclarınızda nələr baş verir
              </p>
            </div>
            <Link
              to="/ai-valuation"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 group"
            >
              <Sparkles className="h-5 w-5 mr-2 group-hover:animate-pulse" />
              AI ilə Qiymətləndir
            </Link>
          </div>

          {/* Enhanced Presentation Slider */}
          <PresentationSlider />
        </div>

        {/* Active Auctions Table - Full Width */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden mb-12">
          <div className="border-b border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                Aktiv Hərraclar
              </h2>
              <Link 
                to="/all-auctions" 
                className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center"
              >
                Hamısını gör
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <p className="text-slate-400 text-sm">Canlı və yaxınlaşan avtomobil hərraclarını kəşf edin</p>
          </div>

          <div className="p-6">
            {liveAuctions.length > 0 ? (
              <>
                {/* Table Header - Compact */}
                <div className="flex items-center gap-4 px-3 py-2 mb-2 bg-slate-700/20 rounded-lg border border-slate-600/30">
                  <div className="w-16 flex-shrink-0">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Vaxt</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Hərrac</span>
                  </div>
                  <div className="w-24 flex-shrink-0 text-center">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Status</span>
                  </div>
                  <div className="w-24 flex-shrink-0 text-right">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Əməliyyat</span>
                  </div>
                </div>

                {/* Table Rows - Compact */}
                <div className="space-y-2">
                  {liveAuctions.slice(0, 8).map((auction) => (
                    <div
                      key={auction.id}
                      className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-lg p-3 hover:bg-slate-700/50 hover:border-blue-400/30 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        {/* Time Column - Compact */}
                        <div className="w-16 flex-shrink-0">
                          <div className="text-center">
                            <div className="text-sm font-bold text-white">
                              {new Date(auction.startTimeUtc).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </div>
                            <div className="text-xs text-slate-400">
                              {new Date(auction.startTimeUtc).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Auction Info Column - Flexible */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate mb-1">
                            {auction.name || 'Hərrac'}
                          </h3>
                          <div className="flex items-center space-x-3 text-xs text-slate-400">
                            <div className="flex items-center space-x-1">
                            
                              <span className="truncate">{formatLocation(auction)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Car className="h-3 w-3 text-purple-400" />
                              <span>{auction.totalCarsCount || 0} maşın</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Column - Compact */}
                        <div className="w-24 flex-shrink-0">
                          <div className="flex justify-center">
                            {auction.isLive ? (
                              <div className="inline-flex items-center space-x-1 bg-red-500/20 border border-red-500/30 rounded-full px-2 py-1">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-red-300 font-medium text-xs">Live</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center space-x-1 bg-blue-500/20 border border-blue-500/30 rounded-full px-2 py-1">
                                <Clock className="h-3 w-3 text-blue-400" />
                                <span className="text-blue-300 text-xs">Gələcək</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions Column - Compact */}
                        <div className="w-24 flex-shrink-0">
                          <div className="flex items-center justify-end space-x-1">
                            <Link
                              to={`/auctions/${auction.id}`}
                              className="w-7 h-7 bg-transparent hover:bg-slate-600/30 border border-slate-500/30 rounded-lg flex items-center justify-center transition-all duration-200 hover:border-blue-400/50"
                              title="Bax"
                            >
                              <Eye className="h-3.5 w-3.5 text-blue-400" />
                            </Link>
                            <Link
                              to={`/auctions/${auction.id}/join`}
                              className={`px-2 py-1 rounded-lg transition-all duration-200 text-xs font-semibold ${
                                auction.isLive
                                  ? 'bg-green-500/80 hover:bg-green-500 text-white'
                                  : 'bg-blue-500/80 hover:bg-blue-500 text-white'
                              }`}
                              title={auction.isLive ? 'Canlıya qoşul' : 'Qoşul'}
                            >
                              {auction.isLive ? 'Qoşul' : 'Gir'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <Link 
                  to="/all-auctions" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Bütün hərracları gör
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recently Viewed Section */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="border-b border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Clock className="h-5 w-5 mr-3 text-orange-400" />
                Bu Yaxınlarda Baxılanlar
              </h2>
              <Link
                to="/vehicle-finder"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center"
              >
                Hamısını gör
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentlyViewedVehicles.map((vehicle) => (
                <div key={vehicle.id} className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-lg overflow-hidden hover:bg-slate-700/50 transition-all duration-200 hover:scale-105">
                  <div className="aspect-[4/3] bg-slate-600/50 overflow-hidden">
                    <CarPhotos 
                      carId={vehicle.id} 
                      showMultiple={false}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-lg mb-2">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-green-400 font-semibold">
                        {formatCurrency(vehicle.estimatedRetailValue || 0)}
                      </span>
                      <button className="text-slate-400 hover:text-blue-400 transition-colors">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}