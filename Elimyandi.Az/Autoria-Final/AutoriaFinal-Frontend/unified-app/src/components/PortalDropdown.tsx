import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import Portal from './Portal';

export interface DropdownOption {
  value: string;
  label: string;
}

interface PortalDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  label?: string;
  icon?: React.ReactNode;
}

const PortalDropdown: React.FC<PortalDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  error = false,
  disabled = false,
  label,
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleToggle();
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          handleToggle();
        } else {
          const currentIndex = options.findIndex(opt => opt.value === value);
          const nextIndex = Math.min(currentIndex + 1, options.length - 1);
          onChange(options[nextIndex].value);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          handleToggle();
        } else {
          const currentIndex = options.findIndex(opt => opt.value === value);
          const prevIndex = Math.max(currentIndex - 1, 0);
          onChange(options[prevIndex].value);
        }
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Update position on scroll/resize
      const handleScroll = () => updatePosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative">
      {label && (
        <label className="block text-white font-medium mb-2">
          {icon && <span className="inline mr-2">{icon}</span>}
          {label}
        </label>
      )}
      
      <div
        ref={triggerRef}
        tabIndex={disabled ? -1 : 0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`
          w-full px-4 py-3 bg-white/20 border-2 rounded-xl text-white 
          focus:outline-none focus:border-blue-400 focus:bg-white/30 
          transition-all duration-300 cursor-pointer
          flex items-center justify-between
          ${error ? 'border-red-400' : 'border-white/30'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/25'}
          ${className}
        `}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label || placeholder}
      >
        <span className={selectedOption ? 'text-white' : 'text-blue-200'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={`h-5 w-5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </div>

      {isOpen && (
        <Portal>
          <div
            ref={dropdownRef}
            className="absolute bg-white/95 backdrop-blur-md border border-white/40 rounded-xl shadow-xl z-[9999] min-w-[180px] max-h-60 overflow-y-auto"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              pointerEvents: 'auto'
            }}
            role="listbox"
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`
                  px-4 py-3 text-sm cursor-pointer transition-colors duration-200
                  flex items-center justify-between
                  hover:bg-white/20 hover:text-blue-600
                  ${option.value === value ? 'bg-blue-500/20 text-blue-600' : 'text-gray-700'}
                `}
                role="option"
                aria-selected={option.value === value}
              >
                <span>{option.label}</span>
                {option.value === value && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </div>
            ))}
          </div>
        </Portal>
      )}
    </div>
  );
};

export default PortalDropdown;
