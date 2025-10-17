import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Clock, AlertTriangle, Zap, Pause, Play } from 'lucide-react';

export interface LiveAuctionTimerProps {
  /** Timer duration in seconds */
  timerSeconds: number;
  /** Whether the auction is currently live */
  isLive: boolean;
  /** Whether the timer is paused */
  isPaused?: boolean;
  /** Callback when timer reaches zero */
  onTimerExpired?: () => void;
  /** Callback when timer is reset */
  onTimerReset?: (newSeconds: number) => void;
  /** Callback when timer is paused/resumed */
  onTimerToggle?: (isPaused: boolean) => void;
  /** Custom CSS classes */
  className?: string;
  /** Whether to show warning animations */
  showWarnings?: boolean;
  /** Whether to show control buttons */
  showControls?: boolean;
}

export const LiveAuctionTimer: React.FC<LiveAuctionTimerProps> = ({
  timerSeconds,
  isLive,
  isPaused = false,
  onTimerExpired,
  onTimerReset,
  onTimerToggle,
  className = '',
  showWarnings = true,
  showControls = false
}) => {
  // Use server-authoritative time directly - no local countdown
  const currentSeconds = timerSeconds;
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastResetTime, setLastResetTime] = useState(Date.now());
  const prevSecondsRef = useRef(timerSeconds);

  // Update last reset time when timer increases (reset detected)
  useEffect(() => {
    if (timerSeconds > prevSecondsRef.current) {
      setLastResetTime(Date.now());
    }
    prevSecondsRef.current = timerSeconds;
  }, [timerSeconds]);

  // Detect timer expiration and trigger animation
  useEffect(() => {
    if (timerSeconds === 0 && prevSecondsRef.current > 0) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        onTimerExpired?.();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [timerSeconds, onTimerExpired]);

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate urgency level
  const getUrgencyLevel = useCallback((): 'low' | 'medium' | 'high' | 'critical' => {
    if (currentSeconds <= 10) return 'critical';
    if (currentSeconds <= 30) return 'high';
    if (currentSeconds <= 60) return 'medium';
    return 'low';
  }, [currentSeconds]);

  // Get urgency styling
  const getUrgencyStyles = useCallback(() => {
    const urgency = getUrgencyLevel();
    
    switch (urgency) {
      case 'critical':
        return {
          container: 'bg-red-500/20 border-red-500/50 shadow-red-500/20',
          text: 'text-red-300',
          icon: 'text-red-400',
          pulse: 'animate-pulse',
          glow: 'shadow-red-500/50'
        };
      case 'high':
        return {
          container: 'bg-orange-500/20 border-orange-500/50 shadow-orange-500/20',
          text: 'text-orange-300',
          icon: 'text-orange-400',
          pulse: 'animate-pulse',
          glow: 'shadow-orange-500/50'
        };
      case 'medium':
        return {
          container: 'bg-yellow-500/20 border-yellow-500/50 shadow-yellow-500/20',
          text: 'text-yellow-300',
          icon: 'text-yellow-400',
          pulse: '',
          glow: 'shadow-yellow-500/50'
        };
      default:
        return {
          container: 'bg-blue-500/20 border-blue-500/50 shadow-blue-500/20',
          text: 'text-blue-300',
          icon: 'text-blue-400',
          pulse: '',
          glow: 'shadow-blue-500/50'
        };
    }
  }, [getUrgencyLevel]);

  // Calculate progress percentage
  const progressPercentage = useCallback(() => {
    if (timerSeconds === 0) return 100;
    return ((timerSeconds - currentSeconds) / timerSeconds) * 100;
  }, [timerSeconds, currentSeconds]);

  // Handle timer reset
  const handleReset = useCallback(() => {
    setCurrentSeconds(timerSeconds);
    setLastResetTime(Date.now());
    onTimerReset?.(timerSeconds);
  }, [timerSeconds, onTimerReset]);

  // Handle timer toggle
  const handleToggle = useCallback(() => {
    onTimerToggle?.(!isPaused);
  }, [isPaused, onTimerToggle]);

  const urgencyStyles = getUrgencyStyles();
  const urgencyLevel = getUrgencyLevel();
  const progress = progressPercentage();

  return (
    <div className={`relative ${className}`}>
      {/* Main Timer Display */}
      <div className={`
        backdrop-blur-xl border rounded-2xl p-6 shadow-2xl transition-all duration-500
        ${urgencyStyles.container}
        ${isAnimating ? 'scale-105' : ''}
        ${showWarnings && urgencyLevel === 'critical' ? urgencyStyles.pulse : ''}
      `}>
        
        {/* Timer Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className={`h-6 w-6 ${urgencyStyles.icon}`} />
            <h3 className={`text-lg font-semibold ${urgencyStyles.text}`}>
              Auction Timer
            </h3>
          </div>
          
          {/* Status Badge */}
          <div className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${isLive ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'}
          `}>
            {isLive ? 'LIVE' : 'PAUSED'}
          </div>
        </div>

        {/* Timer Circle */}
        <div className="relative flex items-center justify-center mb-4">
          <div className="relative">
            {/* Progress Ring */}
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              {/* Background Circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-white/10"
              />
              {/* Progress Circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                className={`transition-all duration-1000 ease-out ${
                  urgencyLevel === 'critical' ? 'text-red-400' :
                  urgencyLevel === 'high' ? 'text-orange-400' :
                  urgencyLevel === 'medium' ? 'text-yellow-400' :
                  'text-blue-400'
                }`}
                style={{
                  filter: urgencyLevel === 'critical' ? 'drop-shadow(0 0 10px currentColor)' : 'none'
                }}
              />
            </svg>
            
            {/* Timer Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`
                  text-3xl font-mono font-bold transition-all duration-300
                  ${urgencyStyles.text}
                  ${isAnimating ? 'scale-110' : ''}
                `}>
                  {formatTime(currentSeconds)}
                </div>
                <div className="text-xs text-white/60 mt-1">
                  {urgencyLevel === 'critical' ? 'FINAL CALL' :
                   urgencyLevel === 'high' ? 'ENDING SOON' :
                   urgencyLevel === 'medium' ? 'ENDING' : 'TIME REMAINING'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timer Controls */}
        {showControls && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleToggle}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                ${isPaused 
                  ? 'bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/30' 
                  : 'bg-orange-600/20 text-orange-300 border border-orange-500/30 hover:bg-orange-600/30'
                }
              `}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              )}
            </button>
            
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-all duration-300"
            >
              <Zap className="h-4 w-4" />
              Reset
            </button>
          </div>
        )}

        {/* Warning Messages */}
        {showWarnings && (
          <div className="mt-4">
            {urgencyLevel === 'critical' && (
              <div className="flex items-center gap-2 text-red-300 text-sm font-medium animate-pulse">
                <AlertTriangle className="h-4 w-4" />
                <span>FINAL CALL - Auction ending!</span>
              </div>
            )}
            
            {urgencyLevel === 'high' && (
              <div className="flex items-center gap-2 text-orange-300 text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                <span>Auction ending soon - Place your bid!</span>
              </div>
            )}
            
            {urgencyLevel === 'medium' && (
              <div className="flex items-center gap-2 text-yellow-300 text-sm">
                <Clock className="h-4 w-4" />
                <span>Less than 1 minute remaining</span>
              </div>
            )}
          </div>
        )}

        {/* Timer Statistics */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4 text-xs text-white/60">
            <div>
              <div className="font-medium">Started</div>
              <div>{new Date(lastResetTime).toLocaleTimeString()}</div>
            </div>
            <div>
              <div className="font-medium">Progress</div>
              <div>{Math.round(progress)}% complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Warning (for critical state) */}
      {showWarnings && urgencyLevel === 'critical' && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
          <AlertTriangle className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  );
};

export default LiveAuctionTimer;
