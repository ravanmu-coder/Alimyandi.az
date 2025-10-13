import React, { useEffect, useCallback, useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  Type, 
  MousePointer,
  Keyboard,
  Accessibility,
  Contrast,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

// Accessibility Context
interface AccessibilityContextType {
  isReducedMotion: boolean;
  isHighContrast: boolean;
  fontSize: 'small' | 'normal' | 'large' | 'extra-large';
  isScreenReaderMode: boolean;
  announceToScreenReader: (message: string) => void;
  setFontSize: (size: 'small' | 'normal' | 'large' | 'extra-large') => void;
  toggleScreenReaderMode: () => void;
}

const AccessibilityContext = React.createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Accessibility Provider Component
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large' | 'extra-large'>('normal');
  const [isScreenReaderMode, setIsScreenReaderMode] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(motionQuery.matches);
    
    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);
    
    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(contrastQuery.matches);
    
    const handleContrastChange = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    contrastQuery.addEventListener('change', handleContrastChange);
    
    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  const toggleScreenReaderMode = useCallback(() => {
    setIsScreenReaderMode(prev => !prev);
  }, []);

  const value: AccessibilityContextType = {
    isReducedMotion,
    isHighContrast,
    fontSize,
    isScreenReaderMode,
    announceToScreenReader,
    setFontSize,
    toggleScreenReaderMode
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Accessibility Controls Component
export const AccessibilityControls: React.FC<{ className?: string }> = ({ className = '' }) => {
  const {
    fontSize,
    setFontSize,
    isScreenReaderMode,
    toggleScreenReaderMode,
    announceToScreenReader
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);

  const handleFontSizeChange = useCallback((size: 'small' | 'normal' | 'large' | 'extra-large') => {
    setFontSize(size);
    announceToScreenReader(`Font size changed to ${size}`);
  }, [setFontSize, announceToScreenReader]);

  const handleScreenReaderToggle = useCallback(() => {
    toggleScreenReaderMode();
    announceToScreenReader(
      isScreenReaderMode ? 'Screen reader mode disabled' : 'Screen reader mode enabled'
    );
  }, [toggleScreenReaderMode, isScreenReaderMode, announceToScreenReader]);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        aria-label="Accessibility controls"
        aria-expanded={isOpen}
      >
        <Accessibility className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-gray-900">Accessibility Options</h3>
            
            {/* Font Size Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <div className="flex gap-2">
                {(['small', 'normal', 'large', 'extra-large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => handleFontSizeChange(size)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      fontSize === size
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-pressed={fontSize === size}
                  >
                    {size === 'small' && <ZoomOut className="h-4 w-4" />}
                    {size === 'normal' && <Type className="h-4 w-4" />}
                    {size === 'large' && <ZoomIn className="h-4 w-4" />}
                    {size === 'extra-large' && <ZoomIn className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Screen Reader Mode */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isScreenReaderMode}
                  onChange={handleScreenReaderToggle}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Screen Reader Mode
                </span>
              </label>
            </div>

            {/* Keyboard Shortcuts Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Keyboard Shortcuts</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Space</kbd> Place bid</div>
                <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> Submit bid</div>
                <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Tab</kbd> Navigate</div>
                <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> Close modal</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Skip Link Component
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({ 
  href, 
  children 
}) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
    >
      {children}
    </a>
  );
};

// Focus Trap Component
export const FocusTrap: React.FC<{ 
  children: React.ReactNode; 
  isActive: boolean;
  onEscape?: () => void;
}> = ({ children, isActive, onEscape }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }

      if (e.key === 'Tab') {
        const container = containerRef.current;
        if (!container) return;

        const focusableElements = container.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onEscape]);

  if (!isActive) return <>{children}</>;

  return (
    <div ref={containerRef} className="focus-trap">
      {children}
    </div>
  );
};

// ARIA Live Region Component
export const AriaLiveRegion: React.FC<{ 
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive';
}> = ({ children, politeness = 'polite' }) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
};

// High Contrast Mode Styles
export const HighContrastStyles: React.FC = () => {
  const { isHighContrast } = useAccessibility();

  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    return () => {
      document.documentElement.classList.remove('high-contrast');
    };
  }, [isHighContrast]);

  return null;
};

// Reduced Motion Styles
export const ReducedMotionStyles: React.FC = () => {
  const { isReducedMotion } = useAccessibility();

  useEffect(() => {
    if (isReducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }

    return () => {
      document.documentElement.classList.remove('reduced-motion');
    };
  }, [isReducedMotion]);

  return null;
};

// Font Size Styles
export const FontSizeStyles: React.FC = () => {
  const { fontSize } = useAccessibility();

  useEffect(() => {
    const sizeClasses = {
      small: 'text-sm',
      normal: 'text-base',
      large: 'text-lg',
      'extra-large': 'text-xl'
    };

    document.documentElement.classList.remove(
      'text-sm', 'text-base', 'text-lg', 'text-xl'
    );
    document.documentElement.classList.add(sizeClasses[fontSize]);

    return () => {
      document.documentElement.classList.remove(sizeClasses[fontSize]);
    };
  }, [fontSize]);

  return null;
};

// Screen Reader Only Text
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
};

// Accessible Button Component
export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}> = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  ariaLabel,
  ariaDescribedBy
}) => {
  const { announceToScreenReader } = useAccessibility();

  const handleClick = useCallback(() => {
    if (!disabled && !loading) {
      onClick();
      if (ariaLabel) {
        announceToScreenReader(ariaLabel);
      }
    }
  }, [onClick, disabled, loading, ariaLabel, announceToScreenReader]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled || loading}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default AccessibilityProvider;
