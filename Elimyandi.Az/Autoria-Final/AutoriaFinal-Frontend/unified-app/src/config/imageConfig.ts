// Image configuration and utilities
export interface ImageConfig {
  baseUrl: string;
  carImagesPath: string;
  placeholderImage: string;
  maxImageSize: number;
  allowedFormats: string[];
  enableLazyLoading: boolean;
  enablePreloading: boolean;
  enableCaching: boolean;
  cacheTimeout: number;
}

// Environment-specific configuration
const getImageConfig = (): ImageConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    baseUrl: isDevelopment 
      ? 'https://localhost:7249' 
      : process.env.REACT_APP_API_BASE_URL || 'https://api.autoria.az',
    carImagesPath: '/images/cars',
    placeholderImage: isDevelopment 
      ? 'https://localhost:7249/images/cars/placeholder-car.jpg'
      : '/images/cars/placeholder-car.jpg',
    maxImageSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    enableLazyLoading: true,
    enablePreloading: isProduction,
    enableCaching: true,
    cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours
  };
};

export const imageConfig = getImageConfig();

// Image URL utilities
export const buildImageUrl = (imagePath: string): string => {
  if (!imagePath) return imageConfig.placeholderImage;
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Handle different path formats
  if (imagePath.startsWith('/images/cars/')) {
    return `${imageConfig.baseUrl}${imagePath}`;
  }
  
  if (imagePath.startsWith('images/cars/')) {
    return `${imageConfig.baseUrl}/${imagePath}`;
  }
  
  if (imagePath.startsWith('/')) {
    return `${imageConfig.baseUrl}${imagePath}`;
  }
  
  // Default: assume it's a relative path
  return `${imageConfig.baseUrl}/${imagePath}`;
};

// Process PhotoUrls from backend response
export const processPhotoUrls = (photoUrls: any): string[] => {
  if (!photoUrls) return [];
  
  let urls: string[] = [];
  
  if (Array.isArray(photoUrls)) {
    urls = photoUrls.filter((url: any) => url && url.trim() !== '');
  } else if (typeof photoUrls === 'string') {
    urls = photoUrls.split(';').filter((url: string) => url.trim() !== '');
  }
  
  return urls.map(buildImageUrl);
};

// Image validation utilities
export const validateImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

export const getImageFormat = (url: string): string | null => {
  if (!url) return null;
  
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : null;
};

export const isAllowedImageFormat = (url: string): boolean => {
  const format = getImageFormat(url);
  return format ? imageConfig.allowedFormats.includes(format) : false;
};

// Image loading utilities
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

export const preloadImages = async (urls: string[]): Promise<void> => {
  if (!imageConfig.enablePreloading) return;
  
  const preloadPromises = urls.map(url => 
    preloadImage(url).catch(error => {
      console.warn(`Failed to preload image: ${url}`, error);
    })
  );
  
  await Promise.allSettled(preloadPromises);
};

// Image caching utilities
const imageCache = new Map<string, { url: string; timestamp: number }>();

export const getCachedImageUrl = (key: string): string | null => {
  if (!imageConfig.enableCaching) return null;
  
  const cached = imageCache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > imageConfig.cacheTimeout) {
    imageCache.delete(key);
    return null;
  }
  
  return cached.url;
};

export const setCachedImageUrl = (key: string, url: string): void => {
  if (!imageConfig.enableCaching) return;
  
  imageCache.set(key, {
    url,
    timestamp: Date.now()
  });
};

// Clear expired cache entries
export const clearExpiredCache = (): void => {
  const now = Date.now();
  for (const [key, cached] of imageCache.entries()) {
    if (now - cached.timestamp > imageConfig.cacheTimeout) {
      imageCache.delete(key);
    }
  }
};

// Run cache cleanup every hour
if (imageConfig.enableCaching) {
  setInterval(clearExpiredCache, 60 * 60 * 1000);
}

export default imageConfig;
