import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Clock, 
  List,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { AuctionGetDto } from '../types/api';

interface AuctionWithLocation extends AuctionGetDto {
  location?: any; // Using any since LocationGetDto doesn't exist
  status: 'live' | 'ended' | 'upcoming';
  timeSlot: string;
  daysUntilAuction?: number;
  startTime?: Date;
  endTime?: Date;
}

interface CalendarCell {
  timeSlot: string;
  day: string;
  date: string;
  auctions: AuctionWithLocation[];
}

const AuctionCalendar: React.FC = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<AuctionWithLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [cityFilter, setCityFilter] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);
  const [hoveredCell, setHoveredCell] = useState<{ timeSlot: string; day: string } | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Time slots for the calendar
  const timeSlots = [
    '05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
    '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM'
  ];

  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing auction calendar data...');
      loadData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Refresh data when currentWeek changes
  useEffect(() => {
    if (auctions.length > 0) {
      // Re-process auctions for the new week/month
      console.log('Re-processing auctions for new period:', currentWeek);
    }
  }, [currentWeek, viewMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Loading auction calendar data from API...');
      
      // Load locations and auctions in parallel
      const [locationsData, auctionsData] = await Promise.all([
        apiClient.getLocations(),
        apiClient.getAuctions()
      ]);
      
      console.log('Locations loaded:', locationsData);
      console.log('Auctions loaded:', auctionsData);
      
      setLocations(locationsData);
      
      // Extract unique regions from locations
      const uniqueRegions = [...new Set(locationsData.map(loc => loc.region).filter(Boolean))];
      setRegions(['All', ...uniqueRegions]);
      console.log('Available regions:', uniqueRegions);
      
      // Process auctions with enhanced data
      const processedAuctions = auctionsData.map(auction => {
        const location = locationsData.find(loc => loc.id === auction.locationId);
        const now = new Date();
        const startTime = new Date(auction.startTimeUtc);
        const endTime = new Date(auction.endTimeUtc);
        
        // Determine auction status
        let status: 'live' | 'ended' | 'upcoming' = 'upcoming';
        if (now >= startTime && now <= endTime) {
          status = 'live';
        } else if (now > endTime) {
          status = 'ended';
        }
        
        // Get time slot based on start time
        const timeSlot = getTimeSlot(startTime);
        
        // Calculate days until auction
        const daysUntilAuction = Math.ceil((startTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...auction,
          location,
          status,
          timeSlot,
          daysUntilAuction,
          startTime,
          endTime
        };
      });
      
      // Sort auctions by start time
      processedAuctions.sort((a, b) => new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime());
      
      setAuctions(processedAuctions);
      console.log('Processed auctions:', processedAuctions);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      // Set empty arrays on error
      setLocations([]);
      setAuctions([]);
      setRegions(['All']);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSlot = (date: Date): string => {
    const hours = date.getHours();
    
    // Find the closest time slot
    const timeSlotIndex = timeSlots.findIndex(slot => {
      const slotTime = new Date();
      const [time, period] = slot.split(' ');
      const [hour, minute] = time.split(':');
      slotTime.setHours(parseInt(hour) + (period === 'PM' && hour !== '12' ? 12 : 0));
      slotTime.setMinutes(parseInt(minute));
      
      return slotTime.getHours() >= hours;
    });
    
    return timeSlotIndex >= 0 ? timeSlots[timeSlotIndex] : timeSlots[0];
  };

  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    
    return weekDates;
  };

  // Calendar navigation functions
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentWeek);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentWeek(newMonth);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    startOfWeek.setDate(diff);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      weekDates.push(weekDate);
    }
    return weekDates;
  };

  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Start from Monday
    
    const dates = [];
    const current = new Date(startDate);
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())); // End on Sunday
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const getCalendarCells = (): CalendarCell[] => {
    const weekDates = viewMode === 'week' ? getWeekDates(currentWeek) : getCurrentWeekDates();
    const cells: CalendarCell[] = [];
    
    timeSlots.forEach(timeSlot => {
      daysOfWeek.forEach((day, dayIndex) => {
        const date = weekDates[dayIndex];
        const dateString = date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        // Filter auctions for this time slot and day
        const dayAuctions = auctions.filter(auction => {
          if (!auction.location) return false;
          
          const auctionDate = new Date(auction.startTimeUtc);
          const isSameDay = auctionDate.toDateString() === date.toDateString();
          const isSameTimeSlot = auction.timeSlot === timeSlot;
          
          // Apply filters
          const matchesRegion = selectedRegion === 'All' || auction.location.region === selectedRegion;
          const matchesCity = cityFilter === '' || 
            auction.location.city.toLowerCase().includes(cityFilter.toLowerCase());
          const matchesStatus = !showOnlyActive || auction.status === 'live';
          
          return isSameDay && isSameTimeSlot && matchesRegion && matchesCity && matchesStatus;
        });
        
        cells.push({
          timeSlot,
          day,
          date: dateString,
          auctions: dayAuctions
        });
      });
    });
    
    return cells;
  };

  const getStatusIcon = (status: 'live' | 'ended' | 'upcoming') => {
    switch (status) {
      case 'live':
        return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>;
      case 'ended':
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      case 'upcoming':
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-slate-500 rounded-full"></div>;
    }
  };

  const getStatusColor = (status: 'live' | 'ended' | 'upcoming') => {
    switch (status) {
      case 'live':
        return 'text-green-400';
      case 'ended':
        return 'text-red-400';
      case 'upcoming':
        return 'text-blue-400';
      default:
        return 'text-slate-400';
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

  const calendarCells = getCalendarCells();
  const weekDates = getCurrentWeekDates();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Loading auction calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">Auction Calendar</h1>
              <p className="text-slate-300 mt-2 text-lg">
                {viewMode === 'week' ? 'Weekly' : 'Monthly'} auction schedule by location and time
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/todays-auctions"
                className="flex items-center gap-2 px-4 py-2 bg-green-600/90 text-white rounded-lg hover:bg-green-700 transition-all duration-200 hover:shadow-lg hover:scale-105 backdrop-blur-sm border border-green-500/50"
              >
                <List className="h-4 w-4" />
                Today's Auctions
              </Link>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 backdrop-blur-sm border border-white/20"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
          
          {/* Calendar Navigation */}
          <div className="mt-6 bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex bg-slate-800/60 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                      viewMode === 'week'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                      viewMode === 'month'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Month
                  </button>
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewMode === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
                    className="p-2 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
                    title={`Previous ${viewMode}`}
                  >
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={goToToday}
                    className="px-3 py-1 text-sm font-medium text-blue-400 hover:text-blue-300 transition-all duration-200"
                  >
                    Today
                  </button>
                  
                  <button
                    onClick={() => viewMode === 'week' ? navigateWeek('next') : navigateMonth('next')}
                    className="p-2 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
                    title={`Next ${viewMode}`}
                  >
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Current Period Display */}
              <div className="text-right">
                <div className="text-lg font-semibold text-white">
                  {viewMode === 'week' 
                    ? `${getWeekDates(currentWeek)[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${getWeekDates(currentWeek)[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : currentWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  }
                </div>
                <div className="text-sm text-slate-400">
                  {auctions.length} auction{auctions.length !== 1 ? 's' : ''} scheduled
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Horizontal Filters */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex items-center gap-4 flex-1">
                {/* Region Filter */}
                <div className="min-w-32">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Region
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-slate-200 bg-slate-800/60"
                  >
                    {regions.map(region => (
                      <option key={region} value={region} className="bg-slate-800 text-slate-200">{region}</option>
                    ))}
                  </select>
                </div>

                {/* City Filter */}
                <div className="min-w-48">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    City
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      placeholder="Search by city..."
                      className="w-full pl-10 pr-3 py-2 text-sm border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-slate-200 placeholder-slate-400 bg-slate-800/60"
                    />
                  </div>
                </div>

                {/* Status Filter Toggle */}
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={showOnlyActive}
                        onChange={(e) => setShowOnlyActive(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-10 h-5 rounded-full transition-all duration-200 ${
                        showOnlyActive ? 'bg-green-500' : 'bg-slate-600'
                      }`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                          showOnlyActive ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`}></div>
                      </div>
                    </div>
                    <span className="ml-3 text-sm text-slate-300">Show only active auctions</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                {/* Header */}
                <thead>
                  <tr className="bg-slate-800/60">
                    <th className="px-3 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider w-20">
                      Time
                    </th>
                    {daysOfWeek.map((day, index) => (
                      <th key={day} className="px-3 py-3 text-center text-sm font-semibold text-slate-400 uppercase tracking-wider min-w-32">
                        <div>
                          <div className="font-semibold text-sm">{day}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {weekDates[index].toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {timeSlots.map((timeSlot, timeIndex) => (
                    <tr key={timeSlot} className="border-b border-slate-700">
                      {/* Time Column */}
                      <td className="px-3 py-3 text-sm font-medium text-slate-300 bg-slate-800/40 sticky left-0 z-10">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {timeSlot}
                        </div>
                      </td>

                      {/* Day Columns */}
                      {daysOfWeek.map((day) => {
                        const cell = calendarCells.find(
                          c => c.timeSlot === timeSlot && c.day === day
                        );
                        
                        return (
                          <td
                            key={`${timeSlot}-${day}`}
                            className="px-3 py-3 text-sm border-r border-slate-700 min-w-32"
                            onMouseEnter={() => setHoveredCell({ timeSlot, day })}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            {cell && cell.auctions.length > 0 ? (
                              <div className="space-y-2">
                                {cell.auctions.map((auction, auctionIndex) => (
                                  <div key={`${auction.id}-${auctionIndex}`} className="group">
                                    <Link
                                      to={`/auctions/${auction.id}/cars`}
                                      className="block p-2 rounded-lg hover:bg-slate-800/50 transition-all duration-200"
                                    >
                                      <div className="flex items-start gap-2">
                                        {getStatusIcon(auction.status)}
                                        <div className="flex-1 min-w-0">
                                          <div className={`font-medium text-sm ${getStatusColor(auction.status)} truncate`}>
                                            {auction.location?.city || 'Unknown City'}
                                          </div>
                                          <div className="text-xs text-slate-400 truncate">
                                            {auction.location?.addressLine1 || 'No address'}
                                          </div>
                                          <div className="flex items-center justify-between mt-1">
                                            <div className="text-xs text-slate-500">
                                              {auction.location?.region || 'Unknown Region'}
                                            </div>
                                            {auction.status === 'live' && (
                                              <div className="text-xs text-green-400 font-medium animate-pulse">
                                                LIVE
                                              </div>
                                            )}
                                            {auction.status === 'upcoming' && auction.daysUntilAuction !== undefined && (
                                              <div className="text-xs text-blue-400">
                                                {auction.daysUntilAuction === 0 ? 'Today' : 
                                                 auction.daysUntilAuction === 1 ? 'Tomorrow' : 
                                                 `${auction.daysUntilAuction}d`}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </Link>
                                    
                                    {/* Enhanced Tooltip */}
                                    {hoveredCell?.timeSlot === timeSlot && hoveredCell?.day === day && (
                                      <div className="absolute z-20 mt-2 p-4 bg-slate-800/90 backdrop-blur-xl text-white text-sm rounded-xl shadow-2xl max-w-xs border border-slate-600">
                                        <div className="font-semibold text-white">{auction.location?.city}</div>
                                        <div className="text-slate-300">{auction.location?.addressLine1}</div>
                                        <div className="text-slate-300">{auction.location?.region}</div>
                                        <div className="mt-3 space-y-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-slate-400">Status:</span>
                                            <span className={`font-medium ${
                                              auction.status === 'live' ? 'text-green-400' :
                                              auction.status === 'ended' ? 'text-red-400' :
                                              'text-blue-400'
                                            }`}>
                                              {auction.status === 'live' ? '🔴 LIVE' :
                                               auction.status === 'ended' ? '⏹️ ENDED' :
                                               '⏰ UPCOMING'}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-slate-400">Start:</span>
                                            <span className="text-white">{formatTime(auction.startTimeUtc)}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-slate-400">End:</span>
                                            <span className="text-white">{formatTime(auction.endTimeUtc)}</span>
                                          </div>
                                          {auction.status === 'upcoming' && auction.daysUntilAuction !== undefined && (
                                            <div className="flex items-center gap-2">
                                              <span className="text-slate-400">In:</span>
                                              <span className="text-blue-400 font-medium">
                                                {auction.daysUntilAuction === 0 ? 'Today' : 
                                                 auction.daysUntilAuction === 1 ? 'Tomorrow' : 
                                                 `${auction.daysUntilAuction} days`}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-slate-500 text-sm text-center py-2">
                                No auctions
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend and About Section */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-4">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Status Legend */}
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-3">Status Legend</h3>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-slate-300">Live Auctions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-slate-300">Ended Auctions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-slate-300">Upcoming Auctions</span>
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-3">About Auction Calendar</h3>
                <div className="space-y-2 text-sm text-slate-400">
                  <p>
                    The Auction Calendar provides a comprehensive view of all scheduled auctions 
                    organized by time and location. Each cell shows auctions happening at specific 
                    times and days.
                  </p>
                  <p>
                    Use the filters to narrow down by region, city, or auction status. 
                    Click on any auction to view its vehicle inventory.
                  </p>
                  <div className="pt-2 border-t border-slate-700">
                    <Link
                      to="/todays-auctions"
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      View Today's Auctions →
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

export default AuctionCalendar;
