import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Maximize2,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface CarPhoto {
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  isVideo?: boolean;
}

interface VehicleCarouselProps {
  carId: string;
  photos?: CarPhoto[];
  className?: string;
  autoPlay?: boolean;
  showThumbnails?: boolean;
  showControls?: boolean;
  onPhotoClick?: (photo: CarPhoto, index: number) => void;
}

export const VehicleCarousel: React.FC<VehicleCarouselProps> = ({
  carId,
  photos = [],
  className = '',
  autoPlay = false,
  showThumbnails = true,
  showControls = true,
  onPhotoClick
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [carPhotos, setCarPhotos] = useState<CarPhoto[]>(photos);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load car photos from API if not provided
  useEffect(() => {
    if (carId && photos.length === 0) {
      loadCarPhotos();
    } else {
      setCarPhotos(photos);
    }
  }, [carId, photos]);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && carPhotos.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % carPhotos.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, carPhotos.length]);

  const loadCarPhotos = async () => {
    if (!carId) return;

    setLoading(true);
    setError(null);

    try {
      // Import apiClient dynamically to avoid circular dependencies
      const { apiClient } = await import('../lib/api');
      const carData = await apiClient.getCar(carId);
      
      console.log('Car data received:', carData);

      // Extract photos from various possible fields
      let extractedPhotos: CarPhoto[] = [];

      // Priority 1: photos array
      if (carData.photos && Array.isArray(carData.photos)) {
        extractedPhotos = carData.photos.map((photo: any) => ({
          url: photo.url || photo.thumbnailUrl || photo,
          thumbnailUrl: photo.thumbnailUrl || photo.url || photo,
          alt: photo.alt || `Car photo`,
          isVideo: photo.isVideo || false
        }));
      }
      // Priority 2: photoUrls field
      else if (carData.photoUrls) {
        const photoUrls = Array.isArray(carData.photoUrls) 
          ? carData.photoUrls 
          : carData.photoUrls.split(';').filter((url: string) => url.trim() !== '');
        
        extractedPhotos = photoUrls.map((url: string) => ({
          url: url.trim(),
          thumbnailUrl: url.trim(),
          alt: `Car photo`,
          isVideo: false
        }));
      }
      // Priority 3: imageUrls field
      else if (carData.imageUrls && Array.isArray(carData.imageUrls)) {
        extractedPhotos = carData.imageUrls.map((url: string) => ({
          url: url,
          thumbnailUrl: url,
          alt: `Car photo`,
          isVideo: false
        }));
      }
      // Priority 4: thumbnailUrl field
      else if (carData.thumbnailUrl) {
        extractedPhotos = [{
          url: carData.thumbnailUrl,
          thumbnailUrl: carData.thumbnailUrl,
          alt: `Car thumbnail`,
          isVideo: false
        }];
      }

      // Convert relative URLs to absolute URLs
      const processedPhotos = extractedPhotos.map(photo => ({
        ...photo,
        url: buildImageUrl(photo.url),
        thumbnailUrl: photo.thumbnailUrl ? buildImageUrl(photo.thumbnailUrl) : undefined
      }));

      console.log('Processed photos:', processedPhotos);
      setCarPhotos(processedPhotos);

    } catch (err: any) {
      console.error('Failed to load car photos:', err);
      setError(err.message || 'Failed to load car photos');
      setCarPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const buildImageUrl = (url: string): string => {
    if (!url) return '';
    
    // If it's already an absolute URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Remove leading slash if present
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    
    // Build full URL with base URL
    const baseUrl = 'https://localhost:7249';
    return `${baseUrl}/${cleanUrl}`;
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set([...prev, index]));
  };

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set([...prev, index]));
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + carPhotos.length) % carPhotos.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carPhotos.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMainImageClick = () => {
    if (onPhotoClick && carPhotos[currentIndex]) {
      onPhotoClick(carPhotos[currentIndex], currentIndex);
    }
  };

  const retryLoadPhotos = () => {
    loadCarPhotos();
  };

  // Show loading state
  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading car photos...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && carPhotos.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Failed to load car photos</p>
          <button
            onClick={retryLoadPhotos}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show no photos state
  if (carPhotos.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No photos available</p>
        </div>
      </div>
    );
  }

  const currentPhoto = carPhotos[currentIndex];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image Display */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
        {/* Main Image */}
        <div 
          className="w-full h-full flex items-center justify-center cursor-pointer"
          onClick={handleMainImageClick}
        >
          {loadedImages.has(currentIndex) && !imageErrors.has(currentIndex) ? (
            <img
              src={currentPhoto.url}
              alt={currentPhoto.alt || `Car photo ${currentIndex + 1}`}
              className="w-full h-full object-contain"
              onError={() => handleImageError(currentIndex)}
            />
          ) : imageErrors.has(currentIndex) ? (
            <div className="text-center p-8">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">Failed to load image</p>
            </div>
          ) : (
            <div className="text-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">Loading...</p>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        {showControls && carPhotos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Play/Pause Button */}
        {showControls && carPhotos.length > 1 && (
          <button
            onClick={togglePlayPause}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        )}

        {/* Fullscreen Button */}
        {onPhotoClick && (
          <button
            onClick={handleMainImageClick}
            className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}

        {/* Image Counter */}
        {carPhotos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {carPhotos.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {showThumbnails && carPhotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {carPhotos.map((photo, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                index === currentIndex 
                  ? 'border-blue-500' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {loadedImages.has(index) && !imageErrors.has(index) ? (
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.alt || `Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                />
              ) : imageErrors.has(index) ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-gray-400" />
                </div>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && carPhotos.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          <span className="text-yellow-700 text-sm">
            Some photos failed to load. {error}
          </span>
          <button
            onClick={retryLoadPhotos}
            className="ml-auto text-yellow-700 hover:text-yellow-800 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
