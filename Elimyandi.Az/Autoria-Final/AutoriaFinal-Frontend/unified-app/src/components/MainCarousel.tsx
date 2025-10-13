import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface MainCarouselProps {
  images: string[];
  videos?: string[];
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export const MainCarousel: React.FC<MainCarouselProps> = ({
  images,
  videos = [],
  className = '',
  autoPlay = false,
  autoPlayInterval = 3000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const allMedia = [...images, ...videos];
  const currentMedia = allMedia[currentIndex];
  const isCurrentVideo = currentIndex >= images.length;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % allMedia.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
  };

  const handleVideoPause = () => {
    setIsVideoPlaying(false);
  };

  // Auto-play effect
  React.useEffect(() => {
    if (isPlaying && !isVideoPlaying) {
      const interval = setInterval(nextSlide, autoPlayInterval);
      return () => clearInterval(interval);
    }
  }, [isPlaying, isVideoPlaying, autoPlayInterval]);

  if (allMedia.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-gray-500 text-2xl">📷</span>
          </div>
          <p className="text-gray-500">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Media Display */}
      <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video">
        {isCurrentVideo ? (
          <video
            key={currentMedia}
            className="w-full h-full object-cover"
            controls
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onEnded={() => setIsVideoPlaying(false)}
          >
            <source src={currentMedia} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            key={currentMedia}
            src={currentMedia}
            alt={`Vehicle image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {/* Navigation Arrows */}
        {allMedia.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Play/Pause Button */}
        {allMedia.length > 1 && (
          <button
            onClick={togglePlayPause}
            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Media Counter */}
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {allMedia.length}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {allMedia.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {allMedia.map((media, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`
                flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all
                ${index === currentIndex 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {index < images.length ? (
                <img
                  src={media}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Play className="h-4 w-4 text-gray-500" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
