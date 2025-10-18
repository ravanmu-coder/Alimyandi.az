import React, { useEffect, useState } from 'react';
import { Gavel, Loader2 } from 'lucide-react';

interface DynamicBidButtonProps {
  // Next bid amount to display and place
  nextBidAmount: number;
  
  // Remaining seconds for timer animation
  remainingSeconds: number;
  
  // Timer duration for calculating progress (typically auction timer duration)
  timerDuration: number;
  
  // Is the button currently disabled
  isDisabled: boolean;
  
  // Is a bid currently being placed
  isPlacing: boolean;
  
  // Callback when button is clicked
  onBid: (amount: number) => void;
  
  // Optional: Currency symbol
  currencySymbol?: string;
}

/**
 * DynamicBidButton - Copart-inspired dynamic bid button
 * 
 * Features:
 * - Large, circular button showing next possible bid amount
 * - Visual countdown indicator (circular progress)
 * - Automatically updates when new bids arrive
 * - Disabled states for various scenarios
 * - Loading state during bid placement
 */
export const DynamicBidButton: React.FC<DynamicBidButtonProps> = ({
  nextBidAmount,
  remainingSeconds,
  timerDuration,
  isDisabled,
  isPlacing,
  onBid,
  currencySymbol = '$'
}) => {
  const [displaySeconds, setDisplaySeconds] = useState(remainingSeconds);
  
  // Sync display seconds with prop changes
  useEffect(() => {
    setDisplaySeconds(remainingSeconds);
  }, [remainingSeconds]);
  
  // Calculate progress percentage (0-100)
  // When timer resets, progress starts at 100 and decreases to 0
  const progress = timerDuration > 0 
    ? (displaySeconds / timerDuration) * 100 
    : 0;
  
  // Determine urgency level based on remaining time
  const getUrgencyLevel = (): 'normal' | 'caution' | 'warning' | 'critical' => {
    if (displaySeconds <= 5) return 'critical';
    if (displaySeconds <= 10) return 'warning';
    if (displaySeconds <= 30) return 'caution';
    return 'normal';
  };
  
  const urgency = getUrgencyLevel();
  
  // Color schemes based on urgency
  const colorSchemes = {
    normal: {
      bg: 'from-green-500 to-green-600',
      hoverBg: 'hover:from-green-600 hover:to-green-700',
      ring: 'ring-green-500/50',
      progress: 'stroke-green-400',
      glow: 'shadow-green-500/50'
    },
    caution: {
      bg: 'from-yellow-500 to-yellow-600',
      hoverBg: 'hover:from-yellow-600 hover:to-yellow-700',
      ring: 'ring-yellow-500/50',
      progress: 'stroke-yellow-400',
      glow: 'shadow-yellow-500/50'
    },
    warning: {
      bg: 'from-orange-500 to-orange-600',
      hoverBg: 'hover:from-orange-600 hover:to-orange-700',
      ring: 'ring-orange-500/50',
      progress: 'stroke-orange-400',
      glow: 'shadow-orange-500/50'
    },
    critical: {
      bg: 'from-red-500 to-red-600',
      hoverBg: 'hover:from-red-600 hover:to-red-700',
      ring: 'ring-red-500/50',
      progress: 'stroke-red-400',
      glow: 'shadow-red-500/50'
    }
  };
  
  const colors = colorSchemes[urgency];
  
  // Calculate stroke-dashoffset for circular progress
  // Circle circumference = 2 * π * r, where r = 90 (radius of our circle)
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Handle button click
  const handleClick = () => {
    if (!isDisabled && !isPlacing) {
      onBid(nextBidAmount);
    }
  };
  
  // Format amount with thousands separator
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-US');
  };
  
  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Button Container with Timer Circle */}
      <div className="relative">
        {/* SVG Circular Progress Indicator */}
        <svg 
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
          viewBox="0 0 200 200"
        >
          {/* Background Circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
          />
          
          {/* Progress Circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={`${colors.progress} transition-all duration-1000 ease-linear`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        
        {/* Main Bid Button */}
        <button
          onClick={handleClick}
          disabled={isDisabled || isPlacing}
          className={`
            relative w-48 h-48 rounded-full
            bg-gradient-to-br ${colors.bg} ${colors.hoverBg}
            text-white font-bold
            transform transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            ${!isDisabled && !isPlacing ? `hover:scale-105 active:scale-95 shadow-2xl ${colors.glow}` : ''}
            ${!isDisabled && !isPlacing ? `ring-4 ${colors.ring}` : ''}
            flex flex-col items-center justify-center
            backdrop-blur-xl
          `}
          title={
            isPlacing 
              ? 'Placing bid...' 
              : isDisabled 
                ? 'Bidding is currently unavailable' 
                : `Click to bid ${currencySymbol}${formatAmount(nextBidAmount)}`
          }
        >
          {isPlacing ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin mb-2" />
              <span className="text-sm font-semibold">Placing...</span>
            </>
          ) : (
            <>
              <Gavel className="h-8 w-8 mb-2" />
              <div className="text-3xl font-black">
                {currencySymbol}{formatAmount(nextBidAmount)}
              </div>
              <div className="text-sm font-semibold mt-1 opacity-90">
                BID NOW!
              </div>
            </>
          )}
        </button>
        
        {/* Timer Display Badge */}
        {!isPlacing && displaySeconds > 0 && (
          <div 
            className={`
              absolute -top-2 -right-2 
              bg-slate-900/90 backdrop-blur-sm
              border-2 ${urgency === 'critical' || urgency === 'warning' ? 'border-red-500' : 'border-white/30'}
              rounded-full px-3 py-1
              ${urgency === 'critical' ? 'animate-pulse' : ''}
            `}
          >
            <div className={`text-xs font-bold ${
              urgency === 'critical' ? 'text-red-400' : 
              urgency === 'warning' ? 'text-orange-400' : 
              urgency === 'caution' ? 'text-yellow-400' : 
              'text-green-400'
            }`}>
              {Math.floor(displaySeconds / 60)}:{(displaySeconds % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}
      </div>
      
      {/* Helper Text */}
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-400">
          {isDisabled 
            ? 'Auction not active' 
            : isPlacing 
              ? 'Submitting your bid...'
              : 'Click button to place bid'
          }
        </p>
        {!isDisabled && !isPlacing && (
          <p className="text-xs text-slate-500 mt-1">
            Next bid amount will update automatically
          </p>
        )}
      </div>
    </div>
  );
};

export default DynamicBidButton;

