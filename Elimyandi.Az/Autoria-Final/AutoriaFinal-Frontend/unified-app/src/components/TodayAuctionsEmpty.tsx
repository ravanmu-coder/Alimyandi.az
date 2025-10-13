import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Search, Bell, RefreshCw, ArrowRight } from 'lucide-react';

interface TodayAuctionsEmptyProps {
  onRefresh: () => void;
  onSearch: (query: string) => void;
  onCreateAlert: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const TodayAuctionsEmpty: React.FC<TodayAuctionsEmptyProps> = ({
  onRefresh,
  onSearch,
  onCreateAlert,
  isLoading = false,
  error = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Lot #, VIN, facility / city…"
                className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Auctions search"
              />
            </div>
          </form>
        </div>

        {/* Main Content */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Illustration */}
              <div className="flex-shrink-0">
                <div className="w-80 h-60 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <Calendar className="h-24 w-24 text-blue-600 mx-auto mb-4" />
                    <div className="w-32 h-2 bg-blue-200 rounded-full mx-auto mb-2"></div>
                    <div className="w-24 h-2 bg-blue-200 rounded-full mx-auto"></div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-4xl font-bold text-white mb-4">
                  Auctions Today (0)
                </h1>
                
                <h2 className="text-2xl font-semibold text-white mb-4">
                  Bu gün üçün heç bir auksion yoxdur
                </h2>
                
                <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                  Hazırda bu gündə keçiriləcək canlı auksion tapılmadı. Axtarışınızı genişləndirin və ya gündəlik aukciyaları izləmək üçün bildiriş yaradın.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    to="/auctions/calendar"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
                  >
                    <Calendar className="h-5 w-5" />
                    Auksion Təqvimi
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    to="/all-auctions"
                    className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/30 text-white rounded-xl font-medium hover:bg-white/10 transition-all duration-200"
                  >
                    <Search className="h-5 w-5" />
                    Bütün Auksionları Göstər
                  </Link>

                  <button
                    onClick={onCreateAlert}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all duration-200"
                  >
                    <Bell className="h-5 w-5" />
                    Bildiriş Yarat
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                    <p className="text-red-200 text-sm">{error}</p>
                    <button
                      onClick={onRefresh}
                      className="mt-2 text-red-300 hover:text-red-200 text-sm underline"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-white/5 border-t border-white/10">
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                Stay updated with live auction notifications
              </p>
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                aria-label="Refresh auctions"
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
