import React from 'react';

interface LiveIndicatorProps {
  isLive: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  isLive,
  size = 'md',
  showText = false,
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-2 h-2';
      case 'lg':
        return 'w-4 h-4';
      default:
        return 'w-3 h-3';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-sm';
      default:
        return 'text-xs';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`
          ${getSizeClasses()} rounded-full
          ${isLive 
            ? 'bg-green-500 animate-pulse' 
            : 'bg-gray-400'
          }
        `}
        aria-label={isLive ? 'Live' : 'Not live'}
      />
      {showText && (
        <span
          className={`
            font-medium
            ${getTextSize()}
            ${isLive ? 'text-green-600' : 'text-gray-500'}
          `}
        >
          {isLive ? 'LIVE' : 'OFFLINE'}
        </span>
      )}
    </div>
  );
};
