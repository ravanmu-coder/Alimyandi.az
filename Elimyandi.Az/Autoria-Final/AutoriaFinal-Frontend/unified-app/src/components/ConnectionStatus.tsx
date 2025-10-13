import React, { useState } from 'react';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  XCircle
} from 'lucide-react';

export interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  lastError?: string;
  retryCount?: number;
  onReconnect?: () => void;
  className?: string;
  showDetails?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting,
  isReconnecting,
  lastError,
  retryCount = 0,
  onReconnect,
  className = '',
  showDetails = false
}) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const getStatusIcon = () => {
    if (isConnecting) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (isReconnecting) {
      return <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />;
    }
    if (isConnected) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isReconnecting) return 'Reconnecting...';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (isConnecting) return 'text-blue-600';
    if (isReconnecting) return 'text-orange-600';
    if (isConnected) return 'text-green-600';
    return 'text-red-600';
  };

  const getBackgroundColor = () => {
    if (isConnecting) return 'bg-blue-50 border-blue-200';
    if (isReconnecting) return 'bg-orange-50 border-orange-200';
    if (isConnected) return 'bg-green-50 border-green-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Status Indicator */}
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300
        ${getBackgroundColor()}
      `}>
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        
        {/* Retry Count */}
        {retryCount > 0 && (
          <span className="text-xs text-gray-500">
            ({retryCount} retries)
          </span>
        )}

        {/* Reconnect Button */}
        {!isConnected && !isConnecting && !isReconnecting && onReconnect && (
          <button
            onClick={onReconnect}
            className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
            title="Reconnect"
          >
            <RefreshCw className="h-3 w-3 text-gray-600" />
          </button>
        )}

        {/* Error Details Toggle */}
        {lastError && showDetails && (
          <button
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
            title="Show error details"
          >
            <AlertCircle className="h-3 w-3 text-red-500" />
          </button>
        )}
      </div>

      {/* Error Details */}
      {showErrorDetails && lastError && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg shadow-lg z-10">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-red-800 mb-1">
                Connection Error
              </div>
              <div className="text-xs text-red-700">
                {lastError}
              </div>
              {onReconnect && (
                <button
                  onClick={onReconnect}
                  className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
            <button
              onClick={() => setShowErrorDetails(false)}
              className="p-1 hover:bg-red-200 rounded transition-colors"
            >
              <XCircle className="h-3 w-3 text-red-500" />
            </button>
          </div>
        </div>
      )}

      {/* Connection Quality Indicator */}
      {isConnected && (
        <div className="flex items-center gap-1 mt-1">
          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-500 ml-1">Excellent</span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;