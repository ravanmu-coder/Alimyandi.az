import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface PhotoGalleryProps {
  photoUrls: string[];
  vehicleName: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photoUrls, vehicleName }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const getImageUrl = (url: string) => {
    if (!url) return '/placeholder-car.jpg';
    if (url.startsWith('http')) return url;
    return `https://localhost:7249${url}`;
  };

  const nextPhoto = () => {
    if (photoUrls && photoUrls.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === photoUrls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (photoUrls && photoUrls.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? photoUrls.length - 1 : prev - 1
      );
    }
  };

  if (!photoUrls || photoUrls.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-8">
        <div className="aspect-[4/3] bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <ImageIcon className="h-16 w-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">No photos available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <ImageIcon className="h-5 w-5" />
        Vehicle Photos
      </h2>
      
      <div className="space-y-4">
        {/* Main Photo */}
        <div className="relative">
          <div className="aspect-[4/3] bg-gray-700 rounded-lg overflow-hidden">
            <img
              src={getImageUrl(photoUrls[currentPhotoIndex])}
              alt={`${vehicleName} - Photo ${currentPhotoIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-full h-full flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-white/40" />
            </div>
          </div>

          {/* Navigation Arrows */}
          {photoUrls.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Photo Counter */}
          {photoUrls.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
              {currentPhotoIndex + 1} / {photoUrls.length}
            </div>
          )}
        </div>
        
        {/* Thumbnail Slider */}
        {photoUrls.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {photoUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => setCurrentPhotoIndex(index)}
                className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden transition-all duration-200 ${
                  index === currentPhotoIndex 
                    ? 'ring-2 ring-blue-500 scale-105' 
                    : 'hover:scale-105 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={getImageUrl(url)}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-full flex items-center justify-center bg-gray-700">
                  <ImageIcon className="h-4 w-4 text-white/40" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoGallery;
