/**
 * useBidHub - Bidding Actions Hook
 * 
 * ❌ KÖHNƏ: SignalR connection yaradır və event-ləri dinləyirdi
 * ✅ YENİ: Yalnız bidding actions-ları təmin edir, SignalR artıq useSignalR-də
 * 
 * Bu hook yalnız bid yerləşdirmək üçün istifadə olunur.
 * Event-lər signalRManager-də dinlənir və store avtomatik yenilənir.
 */

import { useCallback } from 'react';
import { useSignalR } from './useSignalR';
import { toast } from 'react-hot-toast';

export interface UseBidHubReturn {
  placeLiveBid: (auctionCarId: string, amount: number) => Promise<boolean>;
  placePreBid: (auctionCarId: string, amount: number) => Promise<boolean>;
  placeProxyBid: (auctionCarId: string, maxAmount: number, startAmount: number) => Promise<boolean>;
  cancelProxyBid: (auctionCarId: string) => Promise<boolean>;
  isConnected: boolean;
}

export const useBidHub = (): UseBidHubReturn => {
  // Use existing SignalR connection
  const { isConnected, invoke } = useSignalR({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7249',
    token: localStorage.getItem('authToken') || '',
    autoConnect: true,
  });

  const placeLiveBid = useCallback(async (auctionCarId: string, amount: number): Promise<boolean> => {
    if (!isConnected) {
      toast.error('Not connected to auction server');
      return false;
    }

    try {
      console.log('💰 Placing live bid:', { auctionCarId, amount });
      await invoke('PlaceBid', auctionCarId, amount);
      
      // Backend will send NewLiveBid event
      // signalRManager will update store
      // UI will auto-render
      
      toast.success(`Bid placed: $${amount.toLocaleString()}`);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to place bid:', error);
      
      // Handle validation errors
      if (error.message?.includes('minimum')) {
        toast.error(`Bid too low. ${error.message}`);
      } else if (error.message?.includes('outbid')) {
        toast.error('You have been outbid');
      } else {
        toast.error('Failed to place bid');
      }
      
      return false;
    }
  }, [isConnected, invoke]);

  const placePreBid = useCallback(async (auctionCarId: string, amount: number): Promise<boolean> => {
    if (!isConnected) {
      toast.error('Not connected to auction server');
      return false;
    }

    try {
      console.log('📝 Placing pre-bid:', { auctionCarId, amount });
      await invoke('PlacePreBid', auctionCarId, amount);
      
      // Backend will send PreBidPlaced event
      toast.success(`Pre-bid placed: $${amount.toLocaleString()}`);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to place pre-bid:', error);
      toast.error('Failed to place pre-bid');
      return false;
    }
  }, [isConnected, invoke]);

  const placeProxyBid = useCallback(async (auctionCarId: string, maxAmount: number, startAmount: number): Promise<boolean> => {
    if (!isConnected) {
      toast.error('Not connected to auction server');
      return false;
    }

    try {
      console.log('🤖 Placing proxy bid:', { auctionCarId, maxAmount, startAmount });
      await invoke('PlaceProxyBid', auctionCarId, maxAmount, startAmount);
      
      toast.success(`Proxy bid placed - Max: $${maxAmount.toLocaleString()}`);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to place proxy bid:', error);
      toast.error('Failed to place proxy bid');
      return false;
    }
  }, [isConnected, invoke]);

  const cancelProxyBid = useCallback(async (auctionCarId: string): Promise<boolean> => {
    if (!isConnected) {
      toast.error('Not connected to auction server');
      return false;
    }

    try {
      console.log('❌ Canceling proxy bid:', auctionCarId);
      await invoke('CancelProxyBid', auctionCarId);
      
      toast.success('Proxy bid cancelled');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to cancel proxy bid:', error);
      toast.error('Failed to cancel proxy bid');
      return false;
    }
  }, [isConnected, invoke]);

  return {
    placeLiveBid,
    placePreBid,
    placeProxyBid,
    cancelProxyBid,
    isConnected,
  };
};

/**
 * İSTİFADƏ NÜMUNƏSİ:
 * 
 * const { placeLiveBid, isConnected } = useBidHub();
 * 
 * const handleBid = async () => {
 *   const success = await placeLiveBid(carId, amount);
 *   if (success) {
 *     // Backend NewLiveBid eventi göndərəcək
 *     // signalRManager onu qəbul edəcək
 *     // auctionStore.updateHighestBid() çağırılacaq
 *     // UI avtomatik render olunacaq
 *   }
 * };
 * 
 * QEYD:
 * - Bu hook yalnız bid yerləşdirmək üçündür
 * - Event-ləri dinləməz (artıq signalRManager-də)
 * - Mövcud SignalR connection istifadə edir (duplikat yoxdur)
 * - Store avtomatik yenilənir (auctionStore)
 */
