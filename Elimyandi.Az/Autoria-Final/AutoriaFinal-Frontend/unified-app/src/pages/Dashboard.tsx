import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { apiClient } from '../lib/api';
import { AuctionGetDto, BidGetDto, CarData } from '../types/api';
import CarPhotos from '../components/CarPhotos';
import { 
  Calendar, 
  Clock, 
  Car,
  DollarSign,
  ArrowRight,
  Sparkles,
  Eye,
  Heart,
  Plus,
  Trophy,
  X,
  Gavel,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Types for enhanced bid data
interface EnrichedBidDto extends BidGetDto {
  vehicleDetails?: any;
  isLoading?: boolean;
  error?: string;
}

interface BidStatistics {
  totalBids: number;
  activeBids: number;
  winningBids: number;
  totalBidAmount: number;
}

type TabFilter = 'all' | 'active' | 'winning' | 'outbid';

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
  const [liveAuctions, setLiveAuctions] = useState<AuctionGetDto[]>([]);
  const [bids, setBids] = useState<EnrichedBidDto[]>([]);
  const [bidStatistics, setBidStatistics] = useState<BidStatistics>({
    totalBids: 0,
    activeBids: 0,
    winningBids: 0,
    totalBidAmount: 0
  });
  const [recentlyViewedVehicles, setRecentlyViewedVehicles] = useState<CarData[]>([]);
  const [watchlistVehicles, setWatchlistVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...');
      const [live, userBids, cars] = await Promise.all([
        apiClient.getLiveAuctions(),
        apiClient.getMyBids(),
        apiClient.getCars()
      ]);
      
      console.log('Live auctions:', live);
      console.log('User bids:', userBids);
      console.log('Cars:', cars);
      
      setLiveAuctions(live || []);
      
      // Process bids
      const enrichedBids: EnrichedBidDto[] = userBids.map(bid => ({
        ...bid,
        isLoading: true
      }));
      setBids(enrichedBids);
      
      // Calculate bid statistics
      const stats = calculateBidStatistics(userBids);
      setBidStatistics(stats);
      
      // Set recently viewed vehicles (first 8 cars from upcoming auctions)
      setRecentlyViewedVehicles(cars.slice(0, 8));
      
      // Load watchlist from localStorage
      loadWatchlistData();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLiveAuctions([]);
      setBids([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBidStatistics = (userBids: BidGetDto[]): BidStatistics => {
    const totalBids = userBids.length;
    const activeBids = userBids.filter(bid => bid.isWinning && !bid.isOutbid).length;
    const winningBids = userBids.filter(bid => bid.isWinning).length;
    const totalBidAmount = userBids.reduce((sum, bid) => sum + bid.amount, 0);
    
    return {
      totalBids,
      activeBids,
      winningBids,
      totalBidAmount
    };
  };

  const loadWatchlistData = () => {
    try {
      const savedWatchlistData = localStorage.getItem('vehicleWatchlistData');
      if (savedWatchlistData) {
        const watchlistData = JSON.parse(savedWatchlistData);
        setWatchlistVehicles(watchlistData);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (bid: BidGetDto) => {
    if (bid.isWinning && !bid.isOutbid) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <Trophy className="w-3 h-3 mr-1" />
          Winning
        </span>
      );
    } else if (bid.isOutbid) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
          <X className="w-3 h-3 mr-1" />
          Outbid
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    }
  };

  const filteredBids = bids.filter(bid => {
    switch (activeTab) {
      case 'active':
        return bid.isWinning && !bid.isOutbid;
      case 'winning':
        return bid.isWinning;
      case 'outbid':
        return bid.isOutbid;
      default:
        return true;
    }
  });

  const getTabCount = (filter: TabFilter) => {
    return bids.filter(bid => {
      switch (filter) {
        case 'active':
          return bid.isWinning && !bid.isOutbid;
        case 'winning':
          return bid.isWinning;
        case 'outbid':
          return bid.isOutbid;
        default:
          return true;
      }
    }).length;
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

        {/* Active Auctions and Finances Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Active Auctions */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
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

            <div className="space-y-4">
              {liveAuctions.slice(0, 4).map(auction => (
                <div key={auction.id} className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4 hover:bg-slate-700/50 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold">{auction.name}</h3>
                      <p className="text-slate-400 text-sm">{formatDate(auction.startTimeUtc)}</p>
                    </div>
                    <Link
                      to={`/auctions/${auction.id}`}
                      className="px-3 py-1 bg-blue-600/80 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Bax
                    </Link>
                  </div>
                </div>
              ))}
              {liveAuctions.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Aktiv hərrac yoxdur</h3>
                  <p className="text-slate-400 mb-4">Hal-hazırda aktiv hərrac yoxdur.</p>
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

          {/* Finances */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <DollarSign className="h-5 w-5 mr-3 text-green-400" />
                Maliyyə
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Aylıq Xərc</span>
                  <span className="text-2xl font-bold text-green-400">
                    {formatCurrency(bidStatistics.totalBidAmount / 12)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Ümumi Xərc</span>
                  <span className="text-xl font-semibold text-white">
                    {formatCurrency(bidStatistics.totalBidAmount)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {bidStatistics.totalBids}
                  </div>
                  <div className="text-slate-400 text-sm">Ümumi Bid</div>
                </div>
                <div className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400 mb-1">
                    {bidStatistics.winningBids}
                  </div>
                  <div className="text-slate-400 text-sm">Qazanan Bid</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bids Section */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden mb-12">
          <div className="border-b border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Bid-lər</h2>
              <Link
                to="/my-bids"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center"
              >
                Hamısını gör
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            {/* Tab System */}
            <div className="flex">
              {[
                { key: 'all', label: 'Açıq Məhsullar', icon: List },
                { key: 'outbid', label: 'Outbid', icon: X },
                { key: 'winning', label: 'Qazanan', icon: Trophy },
                { key: 'active', label: 'Aktiv', icon: Clock }
              ].map((tab) => {
                const Icon = tab.icon;
                const count = getTabCount(tab.key as TabFilter);
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as TabFilter)}
                    className={`flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 relative ${
                      isActive
                        ? 'text-blue-400 bg-slate-700/50'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      isActive 
                        ? 'bg-blue-500/20 text-blue-300' 
                        : 'bg-slate-600/50 text-slate-400'
                    }`}>
                      {count}
                    </span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bid List Content */}
          <div className="p-6">
            {filteredBids.length === 0 ? (
              <div className="text-center py-16">
                <Gavel className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-3">
                  {activeTab === 'all' ? 'Hələ bid yoxdur' : `Bu kateqoriyada bid yoxdur`}
                </h3>
                <p className="text-slate-400 mb-8">
                  Bid verməyə başlayın ki, fəaliyyətinizi burada görəsiniz.
                </p>
                <Link
                  to="/all-auctions"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Hərracları gör
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBids.slice(0, 5).map((bid) => (
                  <div key={bid.id} className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4 hover:bg-slate-700/50 transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 bg-slate-600/50 rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-slate-600/50 flex items-center justify-center">
                          <Car className="h-6 w-6 text-slate-400" />
                        </div>
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-white font-semibold text-lg truncate mb-1">
                              Avtomobil #{bid.auctionCarId.slice(-4)}
                            </h4>
                            <p className="text-slate-400 text-sm mb-2">
                              {formatDate(bid.timestamp)}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-6">
                            <div className="mb-2">
                              {getStatusBadge(bid)}
                            </div>
                            <div className="text-white font-semibold">
                              Bid: {formatCurrency(bid.amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Watchlist Section */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden mb-12">
          <div className="border-b border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Eye className="h-5 w-5 mr-3 text-blue-400" />
                İzləmə Siyahısı
              </h2>
              <Link
                to="/watchlist"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center"
              >
                Hamısını gör
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            {/* Time-based Tabs */}
            <div className="flex">
              {[
                { key: 'today', label: 'Bu gün' },
                { key: 'tomorrow', label: 'Sabah' },
                { key: 'week', label: 'Bu həftə' },
                { key: 'later', label: 'Sonra' }
              ].map((tab) => {
                const isActive = tab.key === 'today'; // Default to today
                return (
                  <button
                    key={tab.key}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-200 relative ${
                      isActive
                        ? 'text-blue-400 bg-slate-700/50'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {watchlistVehicles.length === 0 ? (
              <div className="text-center py-16">
                <Eye className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-3">İzləmə siyahısı boşdur</h3>
                <p className="text-slate-400 mb-8">
                  Avtomobil tapıcısından avtomobilləri izləmə siyahısına əlavə edin.
                </p>
                <Link
                  to="/vehicle-finder"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Avtomobil tapıcısı
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {watchlistVehicles.slice(0, 5).map((vehicle) => (
                  <div key={vehicle.id} className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4 hover:bg-slate-700/50 transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 bg-slate-600/50 rounded-lg overflow-hidden">
                        <CarPhotos 
                          carId={vehicle.carId} 
                          showMultiple={false}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-white font-semibold text-lg truncate mb-1">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </h4>
                            <p className="text-slate-400 text-sm mb-2">
                              Lot #{vehicle.lotNumber || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-6">
                            <div className="text-white font-semibold mb-1">
                              {formatCurrency(vehicle.currentBid || vehicle.estimatedRetailValue || 0)}
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                              <Heart className="w-3 h-3 mr-1 fill-current" />
                              İzlənir
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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