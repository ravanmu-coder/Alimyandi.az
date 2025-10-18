import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { useTranslation } from 'react-i18next';
import FooterLanguageSelector from './FooterLanguageSelector';
import ConnectionStatus from './ConnectionStatus';
import {
  User,
  Menu,
  X,
  ChevronDown,
  Plus,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle,
  LogOut as LogOutIcon,
  Check,
  BrainCircuit
} from 'lucide-react';
import { useState, useRef } from 'react';
import Flag from 'react-world-flags';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdowns, setShowDropdowns] = useState({
    inventory: false,
    auctions: false,
    support: false,
    vehicle: false
  });
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to Vehicle Finder with search query
      navigate(`/vehicle-finder?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const toggleDropdown = (dropdownName: 'inventory' | 'auctions' | 'support' | 'vehicle') => {
    setShowDropdowns(prev => ({
      ...prev,
      [dropdownName]: !prev[dropdownName]
    }));
  };

  const handleProfileMouseEnter = () => {
    setIsProfileDropdownOpen(true);
  };

  const handleProfileMouseLeave = () => {
    setIsProfileDropdownOpen(false);
  };

  const handleLanguageMouseEnter = () => {
    setIsLanguageDropdownOpen(true);
  };

  const handleLanguageMouseLeave = () => {
    setIsLanguageDropdownOpen(false);
  };

  const handleLanguageChange = (newLanguage: 'az' | 'en') => {
    i18n.changeLanguage(newLanguage);
    setIsLanguageDropdownOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Hide navbar for auth pages (login, register, forgot-password, reset-password, confirm-email)
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password', '/confirm-email'];
  const isAuthPage = authPages.includes(location.pathname);
  
  // If user is not authenticated OR on auth pages, show auth layout without navbar
  if (!isAuthenticated || isAuthPage) {
    // For auth pages, show only the content without navbar and footer
    if (isAuthPage) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        {children}
      </div>
    );
  }

    // For non-authenticated users (not on auth pages), show full layout
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        {/* Public Navigation */}
        <nav className="bg-card-gradient backdrop-blur-md border-b border-brand-blue/20 shadow-xl relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-12">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center space-x-3 group">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                    <img src="/logo-icon.svg" alt="Əlimyandı.az logo" className="h-6 w-6" aria-label="Əlimyandı.az" />
                  </div>
                  <span className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors duration-300">{t('nav.logo')}</span>
                </Link>
              </div>
              
              {/* Search Bar */}
              <div className="flex-1 max-w-2xl mx-8">
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('nav.search.placeholder')}
                      className="w-full bg-white/25 border border-white/40 rounded-xl px-4 py-2.5 text-white placeholder-blue-200 focus:bg-white/35 focus:border-blue-400 focus:outline-none transition-all duration-300 shadow-lg"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-blue-500/25"
                    >
                      {t('nav.search.button')}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Side */}
              <div className="flex items-center space-x-4">
                {/* Language Selector */}
                <div className="relative">
                  <select
                    value={i18n.language}
                    onChange={(e) => i18n.changeLanguage(e.target.value as 'az' | 'en')}
                    className="bg-white/25 border border-white/40 rounded-lg px-3 py-1.5 text-white text-sm focus:bg-white/35 focus:border-blue-400 focus:outline-none transition-all duration-300 shadow-lg"
                  >
                    <option value="az" className="bg-slate-800 text-white">{t('language.azerbaijani')}</option>
                    <option value="en" className="bg-slate-800 text-white">{t('language.english')}</option>
                  </select>
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center space-x-3">
                  <Link
                    to="/register"
                    className="bg-white/25 border border-white/40 text-white px-4 py-2 rounded-lg hover:bg-white/35 hover:border-blue-400 transition-all duration-300 text-sm font-medium shadow-lg"
                  >
                    {t('nav.register')}
                  </Link>
                  <Link
                    to="/login"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-blue-500/25"
                  >
                    {t('nav.login')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Public Secondary Navigation */}
        <nav className="bg-gradient-to-r from-white/8 to-white/5 backdrop-blur-md border-b border-white/15 relative z-[999999]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-10">
              {/* Main Menu */}
              <div className="hidden md:flex items-center space-x-6">
                <Link to="/how-it-works" className="text-white/85 hover:text-blue-200 transition-colors duration-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-white/10">
                  {t('menu.howItWorks')}
                </Link>
                
                {/* Inventory Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('inventory')}
                    className="flex items-center text-white/85 hover:text-blue-200 transition-colors duration-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-white/10"
                  >
                    {t('menu.inventory')}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>
                  {showDropdowns.inventory && (
                    <div className="absolute top-full left-0 mt-2 w-52 bg-white/25 backdrop-blur-md border border-white/40 rounded-xl shadow-xl z-[99999]">
                      <div className="py-2">
                        <Link to="/vehicle-finder" className="block px-4 py-2.5 text-sm text-white hover:bg-white/15 hover:text-blue-200 transition-colors duration-300">
                          {t('dropdown.vehicleFinder')}
                        </Link>
                        <Link to="/sales-list" className="block px-4 py-2.5 text-sm text-white hover:bg-white/15 hover:text-blue-200 transition-colors duration-300">
                          {t('dropdown.salesList')}
                        </Link>
                        <Link to="/watchlist" className="block px-4 py-2.5 text-sm text-white hover:bg-white/15 hover:text-blue-200 transition-colors duration-300">
                          Watchlist
                        </Link>
                        <Link to="/todays-auctions" className="block px-4 py-2.5 text-sm text-white hover:bg-white/15 hover:text-blue-200 transition-colors duration-300">
                          Today's Auctions
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Auctions Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('auctions')}
                    className="flex items-center text-white/85 hover:text-blue-200 transition-colors duration-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-white/10"
                  >
                    {t('menu.auctions')}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>
                  {showDropdowns.auctions && (
                    <div className="absolute top-full left-0 mt-2 w-52 bg-white/25 backdrop-blur-md border border-white/40 rounded-xl shadow-xl z-[99999]">
                      <div className="py-2">
                        <Link to="/todays-auctions" className="block px-4 py-2.5 text-sm text-white hover:bg-white/15 hover:text-blue-200 transition-colors duration-300">
                          {t('dropdown.todaysAuction')}
                        </Link>
                        <Link to="/auctions/calendar" className="block px-4 py-2.5 text-sm text-white hover:bg-white/15 hover:text-blue-200 transition-colors duration-300">
                          {t('dropdown.auctionsCalendar')}
                        </Link>
                        <Link to="/all-auctions" className="block px-4 py-2.5 text-sm text-white hover:bg-white/15 hover:text-blue-200 transition-colors duration-300">
                          {t('dropdown.AllAuctions')}
                        </Link>
                       
                      </div>
                    </div>
                  )}
                </div>

                {/* Locations */}
                <Link to="/locations" className="text-white/85 hover:text-blue-200 transition-colors duration-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-white/10">
                  {t('menu.locations')}
                </Link>

                {/* Services & Support Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('support')}
                    className="flex items-center text-white/85 hover:text-blue-200 transition-colors duration-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-white/10"
                  >
                    {t('menu.services')}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>
                  {showDropdowns.support && (
                    <div className="absolute top-full left-0 mt-2 w-52 bg-white/25 backdrop-blur-md border border-white/40 rounded-xl shadow-xl z-[99999]">
                      <div className="py-2">
                        <Link to="/about-us" className="block px-4 py-2.5 text-sm text-white hover:bg-white/15 hover:text-blue-200 transition-colors duration-300">
                          {t('dropdown.aboutUs')}
                        </Link>
                        <Link to="/sell-your-car" className="block px-4 py-2.5 text-sm text-white hover:bg-white/15 hover:text-blue-200 transition-colors duration-300">
                          {t('dropdown.sellYourCar')}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white/85 hover:text-blue-200 transition-colors duration-300 p-2 rounded-lg hover:bg-white/10"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          {/* Connection Status */}
          <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <ConnectionStatus showDetails={false} />
            </div>
          </div>
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-white/8 to-white/5 backdrop-blur-md border-t border-white/20 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Logo and Language */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-lg">
                    <img src="/logo-icon.svg" alt="Əlimyandı.az logo" className="h-6 w-6" aria-label="Əlimyandı.az" />
                  </div>
                  <span className="text-xl font-bold text-white">{t('nav.logo')}</span>
                </div>
                <FooterLanguageSelector 
                  currentLanguage={i18n.language as 'az' | 'en'}
                  onLanguageChange={(lang) => i18n.changeLanguage(lang)}
                />
              </div>

              {/* Get to Know Us */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{t('footer.getToKnowUs')}</h3>
                <div className="space-y-3">
                  <Link to="/about-us" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.aboutUs')}
                  </Link>
                  <Link to="/careers" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.careers')}
                  </Link>
                  <Link to="/news" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.news')}
                  </Link>
                </div>
              </div>

              {/* Auctions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{t('footer.auctions')}</h3>
                <div className="space-y-3">
                  <Link to="/todays-auctions" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.todaysAuctions')}
                  </Link>
                  <Link to="/auctions/calendar" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.auctionsCalendar')}
                  </Link>
                  <Link to="/all-auctions" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('dropdown.AllAuctions')}
                  </Link>
                  <Link to="/auctions/night" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.nightSales')}
                  </Link>
                  <Link to="/auctions/bank" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.bankCars')}
                  </Link>
                  <Link to="/auctions/rental" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.rentalAuctions')}
                  </Link>
                  <Link to="/auctions/wholesale" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.wholesaleAuctions')}
                  </Link>
                  <Link to="/auctions/featured" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.featuredCars')}
                  </Link>
                </div>
              </div>

              {/* Support */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{t('footer.support')}</h3>
                <div className="space-y-3">
                  <Link to="/help" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.helpCenter')}
                  </Link>
                  <Link to="/glossary" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.glossary')}
                  </Link>
                  <Link to="/resources" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.resourceCenter')}
                  </Link>
                  <Link to="/licensing" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.licensingHelp')}
                  </Link>
                  <Link to="/videos" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.videos')}
                  </Link>
                  <Link to="/membership" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.membershipFees')}
                  </Link>
                  <Link to="/mobile" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.mobileApps')}
                  </Link>
                  <Link to="/guide" className="block text-white/75 hover:text-blue-200 transition-colors duration-300 text-sm">
                    {t('footer.newMemberGuide')}
                  </Link>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="mt-10 pt-8 border-t border-white/20">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <span className="text-white/75 text-sm font-medium">{t('footer.contactUs')}:</span>
                  <div className="flex items-center space-x-4">
                    <a href="#" className="text-white/75 hover:text-blue-200 transition-colors duration-300 p-2 rounded-lg hover:bg-white/10">
                      <Facebook className="h-5 w-5" />
                    </a>
                    <a href="#" className="text-white/75 hover:text-blue-200 transition-colors duration-300 p-2 rounded-lg hover:bg-white/10">
                      <Instagram className="h-5 w-5" />
                    </a>
                    <a href="#" className="text-white/75 hover:text-blue-200 transition-colors duration-300 p-2 rounded-lg hover:bg-white/10">
                      <Youtube className="h-5 w-5" />
                    </a>
                    <a href="#" className="text-white/75 hover:text-blue-200 transition-colors duration-300 p-2 rounded-lg hover:bg-white/10">
                      <Linkedin className="h-5 w-5" />
                    </a>
                    <a href="#" className="text-white/75 hover:text-blue-200 transition-colors duration-300 p-2 rounded-lg hover:bg-white/10">
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  </div>
                </div>
                <div className="text-white/75 text-sm">
                  {t('footer.copyright')}
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Main Navigation - Advanced Glassmorphism */}
      <nav className="bg-gradient-to-b from-slate-900/80 to-slate-900/70 backdrop-blur-xl border-b border-white/10 shadow-2xl relative z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                  <img src="/logo-icon.svg" alt="Əlimyandı.az logo" className="h-6 w-6" aria-label="Əlimyandı.az" />
                </div>
                <span className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors duration-300">{t('nav.logo')}</span>
              </Link>
            </div>

            {/* Search Bar - Minimalist Glassmorphism */}
            <div className="flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('nav.search.placeholder')}
                    className="w-full bg-transparent border-b-2 border-white/20 rounded-none px-4 py-2.5 text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-all duration-300 group-focus-within:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500/80 to-blue-600/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-blue-500/30 opacity-0 group-focus-within:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <div 
                className="relative"
                ref={languageDropdownRef}
                onMouseEnter={handleLanguageMouseEnter}
                onMouseLeave={handleLanguageMouseLeave}
              >
                <button className="flex items-center space-x-2 text-slate-300 hover:text-white hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.2)] rounded-lg px-3 py-2 transition-all duration-300 ease-in-out hover:bg-white/5">
                  <Flag code={i18n.language === 'az' ? 'AZ' : 'GB'} className="w-5 h-4 rounded-sm" />
                  <span className="text-sm font-medium">
                    {i18n.language === 'az' ? 'Azərbaycan' : 'English'}
                  </span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isLanguageDropdownOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {/* Language Dropdown */}
                <div
                  className={`absolute right-0 top-full mt-2 w-52 transition-all duration-300 ease-in-out ${
                    isLanguageDropdownOpen 
                      ? 'opacity-100 visible transform scale-100' 
                      : 'opacity-0 invisible transform scale-95'
                  }`}
                  style={{
                    background: 'linear-gradient(to right, rgba(15, 23, 42, 0.8), rgba(30, 58, 138, 0.8), rgba(59, 130, 246, 0.8))',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    zIndex: 99999
                  }}
                >
                  <button
                    onClick={() => handleLanguageChange('az')}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-blue-400 hover:to-indigo-400 transition-all duration-200 first:rounded-t-lg"
                  >
                    <Flag code="AZ" className="w-5 h-4 rounded-sm mr-3" />
                    <span className="flex-1">Azərbaycan</span>
                    {i18n.language === 'az' && <Check className="h-4 w-4 text-blue-400" />}
                  </button>
                  <div 
                    className="border-t border-blue-400/30"
                    style={{ borderTopWidth: '1px' }}
                  />
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-blue-400 hover:to-indigo-400 transition-all duration-200 last:rounded-b-lg"
                  >
                    <Flag code="GB" className="w-5 h-4 rounded-sm mr-3" />
                    <span className="flex-1">English</span>
                    {i18n.language === 'en' && <Check className="h-4 w-4 text-blue-400" />}
                  </button>
                </div>
              </div>

              {/* User Menu */}
              <div 
                className="relative" 
                ref={profileDropdownRef}
                onMouseEnter={handleProfileMouseEnter}
                onMouseLeave={handleProfileMouseLeave}
              >
                <div className="flex items-center space-x-2 cursor-pointer hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.2)] rounded-lg px-3 py-2 transition-all duration-300 ease-in-out hover:bg-white/5">
                  <User className="h-5 w-5 text-slate-300 group-hover:text-white transition-colors duration-300" />
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors duration-300">
                    Hi, {user?.user?.firstName || user?.user?.email}
                  </span>
                </div>

                {/* Profile Dropdown */}
                <div
                  className={`absolute right-0 top-full mt-2 w-52 transition-all duration-300 ease-in-out ${
                    isProfileDropdownOpen 
                      ? 'opacity-100 visible transform scale-100' 
                      : 'opacity-0 invisible transform scale-95'
                  }`}
                  style={{
                    background: 'linear-gradient(to right, rgba(15, 23, 42, 0.8), rgba(30, 58, 138, 0.8), rgba(59, 130, 246, 0.8))',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    zIndex: 99999
                  }}
                >
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-blue-400 hover:to-indigo-400 transition-all duration-200 first:rounded-t-lg"
                  >
                    <User className="h-4 w-4 mr-2 text-white" />
                    {user?.user?.firstName || user?.user?.email} — Profile
                  </button>
                  <div 
                    className="border-t border-blue-400/30"
                    style={{ borderTopWidth: '1px' }}
                  />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-blue-400 hover:to-indigo-400 transition-all duration-200 last:rounded-b-lg"
                  >
                    <LogOutIcon className="h-4 w-4 mr-2 text-white" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Secondary Navigation - Advanced Glassmorphism */}
      <nav className="relative bg-gradient-to-b from-slate-900/60 to-slate-900/40 backdrop-blur-xl border-b border-white/5 shadow-2xl z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Role Indicator - Enhanced Glassmorphism */}
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-500/30 to-blue-600/20 backdrop-blur-sm border border-blue-400/40 rounded-xl px-4 py-2 shadow-[0_8px_32px_rgba(59,130,246,0.2)]">
                <span className="text-sm font-medium text-blue-200">
                  {(() => {
                    // Get user roles from token
                    const roles = user?.user?.roles;

                    if (!roles || roles.length === 0) {
                      return t('role.member'); // Default to Member if no roles
                    }
                    
                    // Get the first role (highest priority)
                    const primaryRole = roles[0];
                    
                    // Map role to translation key
                    const roleMap: { [key: string]: string } = {
                      'Admin': 'role.admin',
                      'admin': 'role.admin',
                      'Seller': 'role.seller',
                      'seller': 'role.seller',
                      'Member': 'role.member',
                      'member': 'role.member'
                    };
                    
                    // Return translated role or fallback to member
                    return t(roleMap[primaryRole] || 'role.member');
                  })()}
                </span>
              </div>
            </div>

            {/* Main Menu - Moving Pill Effect */}
            <div className="hidden md:flex items-center space-x-2">
              <Link 
                to="/" 
                className="relative text-slate-300 hover:text-white transition-all duration-300 ease-in-out text-sm font-medium px-4 py-2 rounded-full group"
              >
                <span className="relative z-10">{t('menu.dashboard')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-blue-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out ring-1 ring-white/20"></div>
              </Link>

              {/* AI Valuation */}
              <Link 
                to="/ai-valuation" 
                className="relative text-slate-300 hover:text-white transition-all duration-300 ease-in-out text-sm font-medium px-4 py-2 rounded-full group flex items-center"
              >
                <BrainCircuit className="h-4 w-4 mr-1.5 relative z-10" />
                <span className="relative z-10">AI</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-blue-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out ring-1 ring-white/20"></div>
              </Link>
              
              {/* Inventory Dropdown */}
              <div className="relative group z-40">
                <button className="relative flex items-center text-slate-300 hover:text-white transition-all duration-300 ease-in-out text-sm font-medium px-4 py-2 rounded-full group">
                  <span className="relative z-10">{t('menu.inventory')}</span>
                  <ChevronDown className="h-4 w-4 ml-1 relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-blue-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out ring-1 ring-white/20"></div>
                </button>
                <div className="absolute top-full left-0 mt-3 w-56 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                  <div className="py-3">
                    <Link to="/vehicle-finder" className="block px-4 py-3 text-sm text-slate-300 hover:text-white transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-500/10 relative group rounded-xl mx-2">
                      {t('dropdown.vehicleFinder')}
                    </Link>
                    <Link to="/sales-list" className="block px-4 py-3 text-sm text-slate-300 hover:text-white transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-500/10 relative group rounded-xl mx-2">
                      {t('dropdown.salesList')}
                    </Link>
                    <Link to="/watchlist" className="block px-4 py-3 text-sm text-slate-300 hover:text-white transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-500/10 relative group rounded-xl mx-2">
                      Watchlist
                    </Link>
                  </div>
                </div>
              </div>

              {/* Auctions Dropdown */}
              <div className="relative group z-40">
                <button className="relative flex items-center text-slate-300 hover:text-white transition-all duration-300 ease-in-out text-sm font-medium px-4 py-2 rounded-full group">
                  <span className="relative z-10">{t('menu.auctions')}</span>
                  <ChevronDown className="h-4 w-4 ml-1 relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-blue-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out ring-1 ring-white/20"></div>
                </button>
                <div className="absolute top-full left-0 mt-3 w-56 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                  <div className="py-3">
                    <Link to="/todays-auctions" className="block px-4 py-3 text-sm text-slate-300 hover:text-white transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-500/10 relative group rounded-xl mx-2">
                      {t('dropdown.todaysAuction')}
                    </Link>
                    <Link to="/auctions/calendar" className="block px-4 py-3 text-sm text-slate-300 hover:text-white transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-500/10 relative group rounded-xl mx-2">
                      {t('dropdown.auctionsCalendar')}
                    </Link>
                    <Link to="/all-auctions" className="block px-4 py-3 text-sm text-slate-300 hover:text-white transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-500/10 relative group rounded-xl mx-2">
                      {t('dropdown.AllAuctions')}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Bids Dropdown */}
              <div className="relative group z-40">
                <button className="relative flex items-center text-slate-300 hover:text-white transition-all duration-300 ease-in-out text-sm font-medium px-4 py-2 rounded-full group">
                  <span className="relative z-10">{t('menu.bids')}</span>
                  <ChevronDown className="h-4 w-4 ml-1 relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-blue-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out ring-1 ring-white/20"></div>
                </button>
                <div className="absolute top-full left-0 mt-3 w-56 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                  <div className="py-3">
                    <Link to="/my-bids" className="block px-4 py-3 text-sm text-slate-300 hover:text-white transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-500/10 relative group rounded-xl mx-2">
                      {t('dropdown.myBids')}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Vehicle Dropdown (Only for Sellers) */}
              {(() => {
                const roles = user?.user?.roles;
                const isSeller = roles && roles.includes('Seller');
                return isSeller && (
                  <div className="relative group z-40">
                    <button className="relative flex items-center text-slate-300 hover:text-white transition-all duration-300 ease-in-out text-sm font-medium px-4 py-2 rounded-full group">
                      <span className="relative z-10">Vehicle</span>
                      <ChevronDown className="h-4 w-4 ml-1 relative z-10" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-blue-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out ring-1 ring-white/20"></div>
                    </button>
                    <div className="absolute top-full left-0 mt-3 w-56 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                      <div className="py-3">
                        <Link to="/add-vehicle" className="block px-4 py-3 text-sm text-slate-300 hover:text-white transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-500/10 relative group rounded-xl mx-2">
                          <Plus className="h-4 w-4 mr-2 inline" />
                          Add Vehicle
                        </Link>
                        <Link to="/my-vehicles" className="block px-4 py-3 text-sm text-slate-300 hover:text-white transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-500/10 relative group rounded-xl mx-2">
                          My Vehicle
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Locations */}
              <Link 
                to="/locations" 
                className="relative text-slate-300 hover:text-white transition-all duration-300 ease-in-out text-sm font-medium px-4 py-2 rounded-full group"
              >
                <span className="relative z-10">{t('menu.locations')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-blue-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out ring-1 ring-white/20"></div>
              </Link>

              {/* Services & Support Dropdown */}
              <div className="relative group z-40">
                <button className="relative flex items-center text-slate-300 hover:text-white transition-all duration-300 ease-in-out text-sm font-medium px-4 py-2 rounded-full group">
                  <span className="relative z-10">{t('menu.services')}</span>
                  <ChevronDown className="h-4 w-4 ml-1 relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-blue-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out ring-1 ring-white/20"></div>
                </button>
                <div className="absolute top-full left-0 mt-3 w-56 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                  <div className="py-3">
                    <Link to="/about-us" className="block px-4 py-3 text-sm text-slate-300 hover:text-white transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-500/10 relative group rounded-xl mx-2">
                      {t('dropdown.aboutUs')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white/85 hover:text-blue-200 transition-colors duration-300 p-2 rounded-lg hover:bg-white/10"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - Advanced Glassmorphism */}
      <footer className="relative mt-auto bg-gradient-to-t from-slate-900/80 to-slate-900/70 backdrop-blur-xl border-t border-white/10 shadow-2xl">
        {/* Subtle Glow Effect */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Logo and Language */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-lg">
                    <img src="/logo-icon.svg" alt="Əlimyandı.az logo" className="h-6 w-6" aria-label="Əlimyandı.az" />
                  </div>
                  <span className="text-xl font-bold text-white">{t('nav.logo')}</span>
                </div>
                <div className="relative">
                  <FooterLanguageSelector
                    currentLanguage={i18n.language as 'az' | 'en'}
                    onLanguageChange={(lang) => i18n.changeLanguage(lang)}
                  />
                </div>
              </div>

            {/* Get to Know Us */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white text-shadow-sm">{t('footer.getToKnowUs')}</h3>
              <div className="space-y-3">
                <Link to="/about-us" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.aboutUs')}
                </Link>
                <Link to="/careers" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.careers')}
                </Link>
                <Link to="/news" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.news')}
                </Link>
              </div>
            </div>

            {/* Auctions */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white text-shadow-sm">{t('footer.auctions')}</h3>
              <div className="space-y-3">
                <Link to="/todays-auctions" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.todaysAuctions')}
                </Link>
                <Link to="/auctions/calendar" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.auctionsCalendar')}
                </Link>
                <Link to="/all-auctions" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('dropdown.AllAuctions')}
                </Link>
                <Link to="/auctions/night" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.nightSales')}
                </Link>
                <Link to="/auctions/bank" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.bankCars')}
                </Link>
                <Link to="/auctions/rental" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.rentalAuctions')}
                </Link>
                <Link to="/auctions/wholesale" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.wholesaleAuctions')}
                </Link>
                <Link to="/auctions/featured" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.featuredCars')}
                </Link>
              </div>
                </div>

            {/* Support */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white text-shadow-sm">{t('footer.support')}</h3>
              <div className="space-y-3">
                <Link to="/help" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.helpCenter')}
                </Link>
                <Link to="/glossary" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.glossary')}
                </Link>
                <Link to="/resources" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.resourceCenter')}
                </Link>
                <Link to="/licensing" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.licensingHelp')}
                </Link>
                <Link to="/videos" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.videos')}
                </Link>
                <Link to="/membership" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.membershipFees')}
                </Link>
                <Link to="/mobile" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.mobileApps')}
                </Link>
                <Link to="/guide" className="block text-slate-300 hover:text-white transition-all duration-300 text-sm relative group pl-4">
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                  {t('footer.newMemberGuide')}
                </Link>
              </div>
            </div>
          </div>

          {/* Social Media Links - Glassmorphism */}
          <div className="mt-10 pt-8 border-t border-white/10 relative z-10">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <span className="text-slate-300 text-sm font-medium">{t('footer.contactUs')}:</span>
                  <div className="flex items-center space-x-3">
                    <a href="#" className="relative bg-slate-800/40 backdrop-blur-sm border border-white/10 rounded-full p-3 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] group">
                      <Facebook className="h-5 w-5" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    </a>
                    <a href="#" className="relative bg-slate-800/40 backdrop-blur-sm border border-white/10 rounded-full p-3 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] group">
                      <Instagram className="h-5 w-5" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    </a>
                    <a href="#" className="relative bg-slate-800/40 backdrop-blur-sm border border-white/10 rounded-full p-3 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] group">
                      <Youtube className="h-5 w-5" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    </a>
                    <a href="#" className="relative bg-slate-800/40 backdrop-blur-sm border border-white/10 rounded-full p-3 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] group">
                      <Linkedin className="h-5 w-5" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    </a>
                    <a href="#" className="relative bg-slate-800/40 backdrop-blur-sm border border-white/10 rounded-full p-3 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] group">
                      <MessageCircle className="h-5 w-5" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    </a>
                  </div>
              </div>
              <div className="text-slate-500 text-xs">
                {t('footer.copyright')}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}