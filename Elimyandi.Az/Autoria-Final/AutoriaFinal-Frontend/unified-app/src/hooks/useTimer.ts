import { useCallback } from 'react';
import { useAuctionStore } from '../stores/auctionStore';

/**
 * Server-Authoritative Timer Hook
 * 
 * ❌ KÖHNƏ: Local interval ilə timer sayırdı
 * ✅ YENİ: Server-dən gələn TimerTick event-lərinə arxalanır
 * 
 * Timer yalnız serverdə işləyir və hər saniyə TimerTick eventi göndərir.
 * Bu hook sadəcə store-dan timer dəyərini oxuyur və UI üçün format edir.
 */

export interface UseTimerReturn {
  timerSeconds: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  progressPercentage: number;
  formattedTime: string;
  isRunning: boolean;
}

export const useTimer = (
  maxSeconds: number = 300 // Default 5 minutes for progress calculation
): UseTimerReturn => {
  // Read from store (server-authoritative)
  const remainingSeconds = useAuctionStore(state => state.remainingSeconds);
  const isLive = useAuctionStore(state => state.isLive);

  const urgencyLevel = useCallback((): 'low' | 'medium' | 'high' | 'critical' => {
    if (remainingSeconds <= 10) return 'critical';
    if (remainingSeconds <= 30) return 'high';
    if (remainingSeconds <= 60) return 'medium';
    return 'low';
  }, [remainingSeconds]);

  const progressPercentage = useCallback((): number => {
    if (maxSeconds === 0) return 100;
    const elapsed = maxSeconds - remainingSeconds;
    return Math.min(100, Math.max(0, (elapsed / maxSeconds) * 100));
  }, [maxSeconds, remainingSeconds]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timerSeconds: remainingSeconds,
    urgencyLevel: urgencyLevel(),
    progressPercentage: progressPercentage(),
    formattedTime: formatTime(remainingSeconds),
    isRunning: isLive && remainingSeconds > 0,
  };
};

/**
 * İSTİFADƏ NÜMUNƏSİ:
 * 
 * const { timerSeconds, formattedTime, urgencyLevel, isRunning } = useTimer(300);
 * 
 * <div className={`timer ${urgencyLevel}`}>
 *   {formattedTime}
 * </div>
 * 
 * QEYD:
 * - Timer backend-dən TimerTick event-i ilə yenilənir (hər saniyə)
 * - AuctionTimerReset event-i timer-i sıfırlayır (yeni bid zamanı)
 * - Heç bir local setInterval/setTimeout yoxdur
 * - Bütün userlər eyni timer görürlər (sinxron)
 */
