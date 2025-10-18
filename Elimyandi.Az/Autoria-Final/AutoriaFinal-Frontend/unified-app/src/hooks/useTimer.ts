import { useEffect } from 'react';
import { useAuctionStore } from '../stores/auctionStore';
import * as signalR from '@microsoft/signalr';

/**
 * useTimer
 * 
 * Server-Driven Timer Hook
 * 
 * ❌ CLIENT-SIDE setInterval YOX!
 * ✅ Yalnız backend-dən gələn TimerTick event-lərini dinləyir
 * 
 * Backend hər saniyə AuctionHub vasitəsilə TimerTick göndərir:
 * - RemainingSeconds
 * - IsExpired
 * - CurrentCarLotNumber
 */

interface UseTimerProps {
  connection: signalR.HubConnection | null;
  isConnected: boolean;
}

export const useTimer = ({ connection, isConnected }: UseTimerProps) => {
  const setRemainingSeconds = useAuctionStore(state => state.setRemainingSeconds);
  const resetTimer = useAuctionStore(state => state.resetTimer);
  const remainingSeconds = useAuctionStore(state => state.remainingSeconds);

  useEffect(() => {
    if (!connection || !isConnected) return;

    console.log('⏰ [useTimer] Setting up server-driven timer listeners');

    // ========================================
    // TIMER TICK (Backend sends every second)
    // ========================================
    
    const handleTimerTick = (data: {
      auctionId?: string;
      auctionCarId?: string;
      remainingSeconds: number;
      isExpired?: boolean;
      currentCarLotNumber?: string;
    }) => {
      console.log('⏰ [TimerTick]', {
        remaining: data.remainingSeconds,
        expired: data.isExpired,
        lot: data.currentCarLotNumber
      });

      // Update store
      setRemainingSeconds(data.remainingSeconds);

      // Check if expired
      if (data.isExpired && data.remainingSeconds === 0) {
        console.log('⏱️ Timer expired - waiting for next car...');
      }
    };

    // ========================================
    // TIMER RESET (New bid arrives)
    // ========================================
    
    const handleTimerReset = (data: {
      auctionCarId: string;
      newTimerSeconds: number;
      lotNumber?: string;
    }) => {
      console.log('🔄 [AuctionTimerReset]', {
        newTime: data.newTimerSeconds,
        lot: data.lotNumber
      });

      // Reset timer in store
      resetTimer(data.newTimerSeconds);
    };

    // Register event listeners (Case-Sensitive!)
    connection.on('TimerTick', handleTimerTick);
    connection.on('AuctionTimerReset', handleTimerReset);

    console.log('✅ [useTimer] Server-driven timer listeners registered');

    // Cleanup
    return () => {
      console.log('🧹 [useTimer] Removing timer listeners');
      connection.off('TimerTick', handleTimerTick);
      connection.off('AuctionTimerReset', handleTimerReset);
    };
  }, [connection, isConnected, setRemainingSeconds, resetTimer]);

  return {
    remainingSeconds
  };
};

export default useTimer;
