import React, { useState, useEffect } from 'react';
import { Heart, Check } from 'lucide-react';
import { useToast } from './ToastProvider';
import { watchlistApi } from '../api/watchlist';
import { useAuth } from '../hooks/useAuth';

interface WatchButtonProps {
  auctionCarId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export const WatchButton: React.FC<WatchButtonProps> = ({
  auctionCarId,
  className = '',
  size = 'md',
  variant = 'default'
}) => {
  const [isWatching, setIsWatching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      checkWatchlistStatus();
    }
  }, [auctionCarId, isAuthenticated]);

  const checkWatchlistStatus = async () => {
    try {
      const response = await watchlistApi.isInWatchlist(auctionCarId);
      setIsWatching(response.isWatching);
    } catch (error) {
      console.error('Failed to check watchlist status:', error);
    }
  };

  const handleToggleWatch = async () => {
    if (!isAuthenticated) {
      addToast({
        type: 'error',
        title: 'Login Required',
        message: 'Please log in to add items to your watchlist.'
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isWatching) {
        await watchlistApi.removeFromWatchlist(auctionCarId);
        setIsWatching(false);
        addToast({
          type: 'success',
          title: 'Removed from Watchlist',
          message: 'Item has been removed from your watchlist.'
        });
      } else {
        await watchlistApi.addToWatchlist({ auctionCarId });
        setIsWatching(true);
        addToast({
          type: 'success',
          title: 'Added to Watchlist',
          message: 'Item has been added to your watchlist.'
        });
      }
    } catch (error) {
      console.error('Failed to toggle watchlist:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update watchlist. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return isWatching
          ? 'border-green-500 text-green-500 hover:bg-green-50'
          : 'border-gray-300 text-gray-700 hover:bg-gray-50';
      case 'ghost':
        return isWatching
          ? 'text-green-500 hover:bg-green-50'
          : 'text-gray-700 hover:bg-gray-50';
      default:
        return isWatching
          ? 'bg-green-500 text-white hover:bg-green-600'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };

  return (
    <button
      onClick={handleToggleWatch}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 rounded-full font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${getSizeClasses()}
        ${getVariantClasses()}
        ${className}
      `}
      aria-label={isWatching ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : isWatching ? (
        <Check className="h-4 w-4" />
      ) : (
        <Heart className="h-4 w-4" />
      )}
      <span>
        {isWatching ? 'Watching' : 'Watch'}
      </span>
    </button>
  );
};
