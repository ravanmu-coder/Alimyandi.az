import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../lib/api';
import { imageConfig, processPhotoUrls, preloadImages } from '../config/imageConfig';
import { Car, Loader2, AlertCircle, Image as ImageIcon, ZoomIn, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CarPhotosProps {
  carId: string;
  className?: string;
  showMultiple?: boolean;
  maxImages?: number;
  enableGallery?: boolean;
  enableZoom?: boolean;
  lazyLoad?: boolean;
}

interface CarPhotoData {
  photoUrls: string[];
  error?: string;
}

interface ImageModalProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ images, currentIndex, onClose, onNext, onPrev }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative max-w-7xl max-h-full p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Image */}
        <div className="relative">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
          
          {imageError ? (
            <div className="w-full h-96 bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Image failed to load</p>
              </div>
            </div>
          ) : (
            <img
              src={images[currentIndex]}
              alt={`Car image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </div>

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

const CarPhotos: React.FC<CarPhotosProps> = ({ 
  carId, 
  className = '', 
  showMultiple = false,
  maxImages = 3,
  enableGallery = false,
  lazyLoad = true
}) => {
  const [photoData, setPhotoData] = useState<CarPhotoData>({ photoUrls: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<number, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  // Enhanced URL processing with better error handling
  const processImageUrls = useCallback((carDetails: any): string[] => {
    // Use the centralized image processing utility
    const urls = processPhotoUrls(carDetails.photoUrls);
    
    // If no URLs from photoUrls, try fallback fields
    if (urls.length === 0) {
      const fallbackFields = [
        carDetails.imageUrls,
        carDetails.imagePath,
        carDetails.image,
        carDetails.imageUrl
      ];

      for (const field of fallbackFields) {
        if (field) {
          const fallbackUrls = processPhotoUrls(field);
          if (fallbackUrls.length > 0) {
            return fallbackUrls;
          }
        }
      }
    }

    return urls;
  }, []);

  useEffect(() => {
    if (carId) {
      loadCarPhotos();
    }
  }, [carId, processImageUrls]);

  const loadCarPhotos = async () => {
    try {
      setLoading(true);
      setError('');

      console.log(`🖼️ Loading photos for car ID: ${carId}`);
      const carDetails = await apiClient.getCar(carId);
      console.log('📦 Car details received:', {
        id: carDetails.id,
        make: carDetails.make,
        model: carDetails.model,
        photoUrls: carDetails.photoUrls?.length || 0
      });
      
      const processedUrls = processImageUrls(carDetails);
      console.log(`✅ Processed ${processedUrls.length} photo URLs`);
      
      // If no images found, try to create a default image URL
      if (processedUrls.length === 0) {
        const defaultImageUrl = `${imageConfig.baseUrl}/images/cars/${carId}.jpg`;
        processedUrls.push(defaultImageUrl);
        console.log('⚠️ No photos found, using default image URL');
      }
      
      setPhotoData({ photoUrls: processedUrls });

      if (processedUrls.length > 0 && imageConfig.enablePreloading) {
        preloadImages(processedUrls).catch(() => {});
      }
    } catch (error) {
      console.error(`❌ Error loading photos for car ${carId}:`, error);
      setError('Failed to load car photos');
      setPhotoData({ photoUrls: [], error: 'Failed to load car photos' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = useCallback((index: number) => {
    setImageLoadingStates(prev => ({ ...prev, [index]: false }));
  }, []);

  const handleImageError = useCallback((index: number, event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setImageLoadingStates(prev => ({ ...prev, [index]: false }));
    
    if (!img.src.includes('placeholder') && !img.src.includes('data:')) {
      img.src = imageConfig.placeholderImage;
    }
  }, []);

  const handleImageLoadStart = useCallback((index: number) => {
    setImageLoadingStates(prev => ({ ...prev, [index]: true }));
  }, []);

  const openModal = useCallback((index: number) => {
    setModalIndex(index);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const nextImage = useCallback(() => {
    setModalIndex(prev => (prev + 1) % photoData.photoUrls.length);
  }, [photoData.photoUrls.length]);

  const prevImage = useCallback(() => {
    setModalIndex(prev => (prev - 1 + photoData.photoUrls.length) % photoData.photoUrls.length);
  }, [photoData.photoUrls.length]);

  // Memoized image components for performance
  const ImageComponent = useMemo(() => {
    return React.memo(({ src, alt, className, onLoad, onError, onLoadStart, onClick }: {
      src: string;
      alt: string;
      className: string;
      onLoad: () => void;
      onError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
      onLoadStart: () => void;
      onClick?: () => void;
    }) => (
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={onLoad}
        onError={onError}
        onLoadStart={onLoadStart}
        onClick={onClick}
        loading={lazyLoad && imageConfig.enableLazyLoading ? "lazy" : "eager"}
      />
    ));
  }, [lazyLoad]);

  // Single image display (for table cells and cards)
  if (!showMultiple) {
    const firstImage = photoData.photoUrls[0];
    
    // Determine if we should use dynamic sizing or fixed sizing
    const useDynamicSizing = className.includes('w-full') || className.includes('h-full');
    const containerClasses = useDynamicSizing 
      ? `relative ${className}` 
      : `flex-shrink-0 h-12 w-16 relative ${className}`;
    
    const imageClasses = useDynamicSizing
      ? `w-full h-full object-cover transition-opacity duration-200 cursor-pointer hover:opacity-90 ${
          imageLoadingStates[0] ? 'opacity-0' : 'opacity-100'
        }`
      : `h-12 w-16 object-cover rounded-md border border-white/20 shadow-sm transition-opacity duration-200 cursor-pointer hover:opacity-90 ${
          imageLoadingStates[0] ? 'opacity-0' : 'opacity-100'
        }`;
    
    const loadingClasses = useDynamicSizing
      ? 'absolute inset-0 bg-slate-800/60 flex items-center justify-center'
      : 'absolute inset-0 h-12 w-16 bg-slate-800/60 rounded-md flex items-center justify-center border border-slate-600/50 shadow-sm';
    
    const fallbackClasses = useDynamicSizing
      ? 'w-full h-full bg-slate-800/60 flex items-center justify-center'
      : 'h-12 w-16 bg-slate-800/60 rounded-md flex items-center justify-center border border-slate-600/50 shadow-sm';
    
    const iconSize = useDynamicSizing ? 'h-8 w-8' : 'h-5 w-5';
    const spinnerSize = useDynamicSizing ? 'h-6 w-6' : 'h-4 w-4';
    
    if (loading) {
      return (
        <div className={containerClasses}>
          <div className={loadingClasses}>
            <Loader2 className={`${spinnerSize} text-slate-400 animate-spin`} />
          </div>
        </div>
      );
    }

    if (error || !firstImage) {
      return (
        <div className={containerClasses}>
          <div className={fallbackClasses}>
            <Car className={`${iconSize} text-slate-400`} />
          </div>
        </div>
      );
    }

    return (
      <div className={containerClasses}>
        {/* Loading state */}
        {imageLoadingStates[0] && (
          <div className={loadingClasses}>
            <Loader2 className={`${spinnerSize} text-slate-400 animate-spin`} />
          </div>
        )}
        
        {/* Image */}
        <ImageComponent
          src={firstImage}
          alt={`Car ${carId}`}
          className={imageClasses}
          onLoadStart={() => handleImageLoadStart(0)}
          onLoad={() => handleImageLoad(0)}
          onError={(e) => handleImageError(0, e)}
          onClick={() => enableGallery && openModal(0)}
        />
        
        {/* Zoom indicator for gallery mode */}
        {enableGallery && photoData.photoUrls.length > 0 && (
          <div className="absolute top-1 right-1 bg-slate-900/70 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity">
            <ZoomIn className="h-3 w-3" />
          </div>
        )}
        
        {/* Fallback */}
        <div 
          className={fallbackClasses}
          style={{ display: imageLoadingStates[0] ? 'flex' : 'none' }}
        >
          <Car className={`${iconSize} text-slate-400`} />
        </div>
      </div>
    );
  }

  // Multiple images display (for detailed views)
  const displayImages = photoData.photoUrls.slice(0, maxImages);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 bg-slate-800/60 rounded-lg ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-slate-400 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-400">Şəkillər yüklənir...</p>
        </div>
      </div>
    );
  }

  if (error || photoData.photoUrls.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 bg-slate-800/60 rounded-lg ${className}`}>
        <div className="text-center">
          <Car className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Şəkil mövcud deyil</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {/* Main image */}
        <div className="relative group">
          {imageLoadingStates[0] && (
            <div className="absolute inset-0 bg-slate-800/60 rounded-lg flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
            </div>
          )}
          
          <ImageComponent
            src={photoData.photoUrls[0]}
            alt={`Car ${carId} - Main`}
            className={`w-full h-64 object-cover rounded-lg border border-slate-600/50 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 ${
              imageLoadingStates[0] ? 'opacity-0' : 'opacity-100'
            } ${enableGallery ? 'hover:scale-105' : ''}`}
            onLoadStart={() => handleImageLoadStart(0)}
            onLoad={() => handleImageLoad(0)}
            onError={(e) => handleImageError(0, e)}
            onClick={() => enableGallery && openModal(0)}
          />
          
          {/* Gallery overlay */}
          {enableGallery && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-500/90 rounded-full p-2">
                <ZoomIn className="h-6 w-6 text-white" />
              </div>
            </div>
          )}
          
          {/* Fallback for main image */}
          <div 
            className="w-full h-64 bg-slate-800/60 rounded-lg flex items-center justify-center border border-slate-600/50"
            style={{ display: imageLoadingStates[0] ? 'flex' : 'none' }}
          >
            <Car className="h-12 w-12 text-slate-400" />
          </div>
        </div>

        {/* Thumbnail grid */}
        {displayImages.length > 1 && (
          <div className="grid grid-cols-3 gap-2">
            {displayImages.slice(1).map((url, index) => (
              <div key={index} className="relative group">
                {imageLoadingStates[index + 1] && (
                  <div className="absolute inset-0 bg-slate-800/60 rounded-md flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                  </div>
                )}
                
                <ImageComponent
                  src={url}
                  alt={`Car ${carId} - ${index + 2}`}
                  className={`w-full h-20 object-cover rounded-md border border-slate-600/50 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:shadow-blue-500/10 ${
                    imageLoadingStates[index + 1] ? 'opacity-0' : 'opacity-100'
                  } ${enableGallery ? 'hover:scale-105' : ''}`}
                  onLoadStart={() => handleImageLoadStart(index + 1)}
                  onLoad={() => handleImageLoad(index + 1)}
                  onError={(e) => handleImageError(index + 1, e)}
                  onClick={() => enableGallery && openModal(index + 1)}
                />
                
                {/* Gallery overlay for thumbnails */}
                {enableGallery && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-md flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-500/90 rounded-full p-1">
                      <ZoomIn className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
                
                {/* Fallback for thumbnails */}
                <div 
                  className="w-full h-20 bg-slate-800/60 rounded-md flex items-center justify-center border border-slate-600/50"
                  style={{ display: imageLoadingStates[index + 1] ? 'flex' : 'none' }}
                >
                  <Car className="h-6 w-6 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show count if there are more images */}
        {photoData.photoUrls.length > maxImages && (
          <div className="text-center">
            <p className="text-sm text-slate-400">
              +{photoData.photoUrls.length - maxImages} daha çox şəkil
            </p>
            {enableGallery && (
              <button
                onClick={() => openModal(0)}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                Bütün şəkilləri gör
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {modalOpen && enableGallery && (
        <ImageModal
          images={photoData.photoUrls}
          currentIndex={modalIndex}
          onClose={closeModal}
          onNext={nextImage}
          onPrev={prevImage}
        />
      )}
    </>
  );
};

export default CarPhotos;