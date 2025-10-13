import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
  onExpire?: () => void;
  showSeconds?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function CountdownTimer({ 
  targetDate, 
  onExpire,
  showSeconds = true,
  size = 'medium'
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft(prev => {
          if (!prev.isExpired) {
            onExpire?.();
          }
          return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isExpired: true
          };
        });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isExpired: false
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'text-sm',
          number: 'text-lg font-bold',
          label: 'text-xs'
        };
      case 'large':
        return {
          container: 'text-lg',
          number: 'text-3xl font-bold',
          label: 'text-sm'
        };
      default:
        return {
          container: 'text-base',
          number: 'text-2xl font-bold',
          label: 'text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const getUrgencyColor = () => {
    const totalMinutes = timeLeft.days * 24 * 60 + timeLeft.hours * 60 + timeLeft.minutes;
    
    if (timeLeft.isExpired) return 'text-red-600';
    if (totalMinutes < 5) return 'text-red-500';
    if (totalMinutes < 30) return 'text-orange-500';
    if (totalMinutes < 60) return 'text-yellow-600';
    return 'text-gray-700';
  };

  const urgencyColor = getUrgencyColor();
  const shouldPulse = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes < 5;

  if (timeLeft.isExpired) {
    return (
      <div className={`flex items-center space-x-2 ${sizeClasses.container} text-red-600`}>
        <Clock className="h-5 w-5" />
        <span className="font-semibold">EXPIRED</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${sizeClasses.container} ${urgencyColor} ${shouldPulse ? 'animate-pulse' : ''}`}>
      <Clock className="h-5 w-5" />
      <div className="flex items-center space-x-1">
        {timeLeft.days > 0 && (
          <>
            <div className="text-center">
              <div className={sizeClasses.number}>{timeLeft.days}</div>
              <div className={`${sizeClasses.label} text-gray-500`}>
                {timeLeft.days === 1 ? 'day' : 'days'}
              </div>
            </div>
            <span className="mx-1">:</span>
          </>
        )}
        
        <div className="text-center">
          <div className={sizeClasses.number}>
            {timeLeft.hours.toString().padStart(2, '0')}
          </div>
          <div className={`${sizeClasses.label} text-gray-500`}>hours</div>
        </div>
        
        <span className="mx-1">:</span>
        
        <div className="text-center">
          <div className={sizeClasses.number}>
            {timeLeft.minutes.toString().padStart(2, '0')}
          </div>
          <div className={`${sizeClasses.label} text-gray-500`}>min</div>
        </div>
        
        {showSeconds && (
          <>
            <span className="mx-1">:</span>
            <div className="text-center">
              <div className={sizeClasses.number}>
                {timeLeft.seconds.toString().padStart(2, '0')}
              </div>
              <div className={`${sizeClasses.label} text-gray-500`}>sec</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}