import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseTimerReturn {
  timerSeconds: number;
  isPaused: boolean;
  resetTimer: (newSeconds: number) => void;
  togglePause: (paused: boolean) => void;
  handleTimerExpired: () => void;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  progressPercentage: number;
  formattedTime: string;
}

export const useTimer = (
  initialSeconds: number, 
  isLive: boolean,
  onTimerExpired?: () => void
): UseTimerReturn => {
  const [timerSeconds, setTimerSeconds] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastResetTimeRef = useRef<number>(Date.now());

  // Update timer when initial seconds change
  useEffect(() => {
    setTimerSeconds(initialSeconds);
    lastResetTimeRef.current = Date.now();
  }, [initialSeconds]);

  // Timer countdown effect
  useEffect(() => {
    if (timerSeconds <= 0 || isPaused || !isLive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          // Timer expired
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onTimerExpired?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerSeconds, isPaused, isLive, onTimerExpired]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const resetTimer = useCallback((newSeconds: number) => {
    setTimerSeconds(newSeconds);
    setIsPaused(false);
    lastResetTimeRef.current = Date.now();
  }, []);

  const togglePause = useCallback((paused: boolean) => {
    setIsPaused(paused);
  }, []);

  const handleTimerExpired = useCallback(() => {
    console.log('Timer expired - moving to next car');
    onTimerExpired?.();
  }, [onTimerExpired]);

  const urgencyLevel = useCallback((): 'low' | 'medium' | 'high' | 'critical' => {
    if (timerSeconds <= 10) return 'critical';
    if (timerSeconds <= 30) return 'high';
    if (timerSeconds <= 60) return 'medium';
    return 'low';
  }, [timerSeconds]);

  const progressPercentage = useCallback((): number => {
    if (initialSeconds === 0) return 100;
    return ((initialSeconds - timerSeconds) / initialSeconds) * 100;
  }, [initialSeconds, timerSeconds]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timerSeconds,
    isPaused,
    resetTimer,
    togglePause,
    handleTimerExpired,
    urgencyLevel: urgencyLevel(),
    progressPercentage: progressPercentage(),
    formattedTime: formatTime(timerSeconds)
  };
};
