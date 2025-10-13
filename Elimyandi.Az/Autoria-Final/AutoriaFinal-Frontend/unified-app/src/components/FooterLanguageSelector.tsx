import React, { useState } from 'react';
import { ChevronUp, Check } from 'lucide-react';
import Flag from 'react-world-flags';

interface FooterLanguageSelectorProps {
  currentLanguage: 'az' | 'en';
  onLanguageChange: (language: 'az' | 'en') => void;
}

const FooterLanguageSelector: React.FC<FooterLanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange
}) => {
  // State Management
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'az' | 'en'>(currentLanguage);

  // Handle language selection
  const handleLanguageSelect = (language: 'az' | 'en') => {
    setSelectedLanguage(language);
    onLanguageChange(language);
    setIsOpen(false);
  };

  // Handle mouse enter/leave for hover functionality
  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  // Get current language display info
  const getCurrentLanguageInfo = () => {
    return selectedLanguage === 'az' 
      ? { code: 'AZ', name: 'Azərbaycan' }
      : { code: 'GB', name: 'English' };
  };

  const currentLangInfo = getCurrentLanguageInfo();

  return (
    <div 
      className="relative w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <button 
        className="flex items-center space-x-2 w-full px-3 py-2 text-slate-300 hover:bg-white/10 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Flag Icon */}
        <Flag 
          code={currentLangInfo.code} 
          className="w-5 h-4 rounded-sm flex-shrink-0" 
        />
        
        {/* Language Name */}
        <span className="flex-1 text-left text-sm font-medium">
          {currentLangInfo.name}
        </span>
        
        {/* Chevron Up Icon */}
        <ChevronUp 
          className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Panel - Opens Upward */}
      {isOpen && (
        <div 
          className="absolute bottom-full left-0 mb-2 w-full bg-slate-900/50 backdrop-blur-lg border border-blue-500/50 shadow-2xl rounded-xl z-50"
          style={{
            animation: 'fadeInUp 0.2s ease-out'
          }}
        >
          {/* Azerbaijani Option */}
          <button
            onClick={() => handleLanguageSelect('az')}
            className="w-full flex items-center px-4 py-2.5 text-sm text-slate-200 hover:bg-blue-500/50 transition-all duration-200 first:rounded-t-xl"
          >
            <Flag code="AZ" className="w-5 h-4 rounded-sm mr-3 flex-shrink-0" />
            <span className="flex-1 text-left">Azərbaycan</span>
            {selectedLanguage === 'az' && (
              <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />
            )}
          </button>

          {/* Separator */}
          <div className="border-t border-blue-500/30 mx-4" />

          {/* English Option */}
          <button
            onClick={() => handleLanguageSelect('en')}
            className="w-full flex items-center px-4 py-2.5 text-sm text-slate-200 hover:bg-blue-500/50 transition-all duration-200 last:rounded-b-xl"
          >
            <Flag code="GB" className="w-5 h-4 rounded-sm mr-3 flex-shrink-0" />
            <span className="flex-1 text-left">English</span>
            {selectedLanguage === 'en' && (
              <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />
            )}
          </button>
        </div>
      )}

      {/* Custom CSS Animation */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default FooterLanguageSelector;
