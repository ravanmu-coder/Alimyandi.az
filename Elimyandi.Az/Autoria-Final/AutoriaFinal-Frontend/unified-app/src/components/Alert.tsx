import React, { useEffect, useState } from 'react';
import { CheckCircle2, Info, AlertCircle, Trash2, X } from 'lucide-react';

interface AlertProps {
  message: string;
  type: 'success' | 'info' | 'error' | 'removed';
  onClose: () => void;
  duration?: number;
}

const Alert: React.FC<AlertProps> = ({ 
  message, 
  type, 
  onClose, 
  duration = 4000 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 50));
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 50);

    // Auto close
    const closeTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
      clearTimeout(closeTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for exit animation
  };

  const getAlertConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle2,
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-400',
          iconColor: 'text-green-400',
          progressColor: 'bg-green-400',
          backdropBlur: 'backdrop-blur-lg'
        };
      case 'info':
        return {
          icon: Info,
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-400',
          iconColor: 'text-blue-400',
          progressColor: 'bg-blue-400',
          backdropBlur: 'backdrop-blur-lg'
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-400',
          iconColor: 'text-red-400',
          progressColor: 'bg-red-400',
          backdropBlur: 'backdrop-blur-lg'
        };
      case 'removed':
        return {
          icon: Trash2,
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-400',
          iconColor: 'text-orange-400',
          progressColor: 'bg-orange-400',
          backdropBlur: 'backdrop-blur-lg'
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-400',
          iconColor: 'text-blue-400',
          progressColor: 'bg-blue-400',
          backdropBlur: 'backdrop-blur-lg'
        };
    }
  };

  const config = getAlertConfig();
  const IconComponent = config.icon;

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm w-full">
      <div
        className={`
          ${config.bgColor} ${config.backdropBlur}
          border border-slate-600/50 ${config.borderColor}
          rounded-xl shadow-2xl overflow-hidden
          transition-all duration-300 ease-out
          ${isVisible 
            ? 'translate-x-0 opacity-100 scale-100' 
            : 'translate-x-full opacity-0 scale-95'
          }
          hover:shadow-3xl hover:scale-105
          group
        `}
      >
        {/* Progress Bar */}
        <div className="h-1 bg-slate-700/30">
          <div
            className={`h-full ${config.progressColor} transition-all duration-50 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Alert Content */}
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
            onClick={handleClose}
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
    </div>
  );
};

export default Alert;
