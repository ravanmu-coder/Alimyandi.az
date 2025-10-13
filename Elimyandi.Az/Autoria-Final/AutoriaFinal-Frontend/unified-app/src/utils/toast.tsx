// react-hot-toast implementation example for production-ready toast system
// This is an alternative implementation using the popular react-hot-toast library

import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle2, Info, AlertCircle, Trash2, X } from 'lucide-react';

// Custom toast component with glassmorphism styling
const CustomToast = ({ 
  message, 
  type, 
  t 
}: { 
  message: string; 
  type: 'success' | 'info' | 'error' | 'removed';
  t: any;
}) => {
  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle2,
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-400',
          iconColor: 'text-green-400',
          progressColor: 'bg-green-400',
        };
      case 'info':
        return {
          icon: Info,
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-400',
          iconColor: 'text-blue-400',
          progressColor: 'bg-blue-400',
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-400',
          iconColor: 'text-red-400',
          progressColor: 'bg-red-400',
        };
      case 'removed':
        return {
          icon: Trash2,
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-400',
          iconColor: 'text-orange-400',
          progressColor: 'bg-orange-400',
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-400',
          iconColor: 'text-blue-400',
          progressColor: 'bg-blue-400',
        };
    }
  };

  const config = getToastConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={`
        ${config.bgColor} backdrop-blur-lg
        border border-slate-600/50 ${config.borderColor}
        rounded-xl shadow-2xl overflow-hidden
        transition-all duration-300 ease-out
        hover:shadow-3xl hover:scale-105
        group max-w-sm w-full
      `}
    >
      {/* Progress Bar */}
      <div className="h-1 bg-slate-700/30">
        <div
          className={`h-full ${config.progressColor} transition-all duration-50 ease-linear`}
          style={{ 
            width: `${(1 - t.visible) * 100}%`,
            transition: 'width 50ms linear'
          }}
        />
      </div>

      {/* Toast Content */}
      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <IconComponent 
            className={`h-5 w-5 ${config.iconColor} group-hover:scale-110 transition-transform duration-200`}
            strokeWidth="1.5"
          />
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-700/50 transition-all duration-200 hover:scale-110 group/close"
        >
          <X 
            className="h-4 w-4 text-slate-400 group-hover/close:text-slate-200 transition-colors duration-200" 
            strokeWidth="1.5"
          />
        </button>
      </div>

      {/* Subtle Glow Effect */}
      <div className={`absolute inset-0 rounded-xl ${config.bgColor} opacity-20 pointer-events-none`} />
    </div>
  );
};

// Toast notification functions
export const showToast = {
  success: (message: string) => {
    toast.custom((t) => (
      <CustomToast message={message} type="success" t={t} />
    ), {
      duration: 4000,
      position: 'top-right',
    });
  },

  error: (message: string) => {
    toast.custom((t) => (
      <CustomToast message={message} type="error" t={t} />
    ), {
      duration: 5000,
      position: 'top-right',
    });
  },

  info: (message: string) => {
    toast.custom((t) => (
      <CustomToast message={message} type="info" t={t} />
    ), {
      duration: 4000,
      position: 'top-right',
    });
  },

  removed: (message: string) => {
    toast.custom((t) => (
      <CustomToast message={message} type="removed" t={t} />
    ), {
      duration: 4000,
      position: 'top-right',
    });
  },
};

// Usage in VehicleFinder.tsx with react-hot-toast:
/*
import { showToast } from '../utils/toast';

// Replace showAlert calls with:
showToast.success('Added to Watchlist');
showToast.removed('Removed from Watchlist');
showToast.error('Error adding to watchlist');

// Add Toaster component to your main App.tsx or layout:
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div>
      <YourAppContent />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'transparent',
            boxShadow: 'none',
          },
        }}
      />
    </div>
  );
}
*/

// Alternative: Simple toast hook for custom implementation
export const useToast = () => {
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'removed') => {
    // Implementation would trigger your custom Alert component
    // This is just a placeholder for the hook pattern
    console.log(`Toast: ${type} - ${message}`);
  };

  return {
    success: (message: string) => showToast(message, 'success'),
    error: (message: string) => showToast(message, 'error'),
    info: (message: string) => showToast(message, 'info'),
    removed: (message: string) => showToast(message, 'removed'),
  };
};
