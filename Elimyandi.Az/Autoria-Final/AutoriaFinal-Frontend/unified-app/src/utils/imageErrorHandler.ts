// Image error handling and debugging utilities
export interface ImageError {
  type: 'load' | 'network' | 'format' | 'size' | 'timeout';
  message: string;
  url: string;
  timestamp: number;
  context?: any;
}

export interface ImageDebugInfo {
  url: string;
  loadTime: number;
  size: { width: number; height: number };
  format: string;
  cached: boolean;
  errors: ImageError[];
}

class ImageErrorHandler {
  private errors: ImageError[] = [];
  private debugInfo: Map<string, ImageDebugInfo> = new Map();
  private maxErrors = 100; // Keep only last 100 errors

  // Log an image error
  logError(type: ImageError['type'], message: string, url: string, context?: any): void {
    const error: ImageError = {
      type,
      message,
      url,
      timestamp: Date.now(),
      context
    };

    this.errors.push(error);
    
    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    console.warn(`Image Error [${type}]:`, message, { url, context });
  }

  // Get all errors
  getErrors(): ImageError[] {
    return [...this.errors];
  }

  // Get errors by type
  getErrorsByType(type: ImageError['type']): ImageError[] {
    return this.errors.filter(error => error.type === type);
  }

  // Get recent errors (last N minutes)
  getRecentErrors(minutes: number = 5): ImageError[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.errors.filter(error => error.timestamp > cutoff);
  }

  // Clear all errors
  clearErrors(): void {
    this.errors = [];
  }

  // Log debug info for an image
  logDebugInfo(url: string, info: Partial<ImageDebugInfo>): void {
    const existing = this.debugInfo.get(url) || {
      url,
      loadTime: 0,
      size: { width: 0, height: 0 },
      format: '',
      cached: false,
      errors: []
    };

    this.debugInfo.set(url, { ...existing, ...info });
  }

  // Get debug info for an image
  getDebugInfo(url: string): ImageDebugInfo | undefined {
    return this.debugInfo.get(url);
  }

  // Get all debug info
  getAllDebugInfo(): ImageDebugInfo[] {
    return Array.from(this.debugInfo.values());
  }

  // Clear debug info
  clearDebugInfo(): void {
    this.debugInfo.clear();
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    byType: Record<ImageError['type'], number>;
    recent: number;
    topUrls: Array<{ url: string; count: number }>;
  } {
    const byType = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<ImageError['type'], number>);

    const urlCounts = this.errors.reduce((acc, error) => {
      acc[error.url] = (acc[error.url] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUrls = Object.entries(urlCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([url, count]) => ({ url, count }));

    return {
      total: this.errors.length,
      byType,
      recent: this.getRecentErrors().length,
      topUrls
    };
  }
}

// Global error handler instance
export const imageErrorHandler = new ImageErrorHandler();

// Image loading utilities with error handling
export const loadImageWithErrorHandling = (
  url: string,
  options: {
    timeout?: number;
    retries?: number;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<HTMLImageElement> => {
  const { timeout = 10000, retries = 3, onProgress } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const startTime = Date.now();
    let retryCount = 0;

    const attemptLoad = () => {
      const timeoutId = setTimeout(() => {
        imageErrorHandler.logError('timeout', `Image load timeout after ${timeout}ms`, url);
        reject(new Error(`Image load timeout: ${url}`));
      }, timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        const loadTime = Date.now() - startTime;
        
        // Log successful load
        imageErrorHandler.logDebugInfo(url, {
          loadTime,
          size: { width: img.naturalWidth, height: img.naturalHeight },
          format: url.split('.').pop()?.toLowerCase() || 'unknown',
          cached: img.complete && img.naturalWidth !== 0
        });

        if (onProgress) onProgress(100);
        resolve(img);
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        retryCount++;
        
        if (retryCount < retries) {
          imageErrorHandler.logError('network', `Image load failed, retrying (${retryCount}/${retries})`, url);
          setTimeout(attemptLoad, 1000 * retryCount); // Exponential backoff
        } else {
          imageErrorHandler.logError('load', `Image load failed after ${retries} retries`, url);
          reject(new Error(`Failed to load image: ${url}`));
        }
      };

      img.src = url;
    };

    attemptLoad();
  });
};

// Batch image loading with error handling
export const loadImagesWithErrorHandling = async (
  urls: string[],
  options: {
    concurrency?: number;
    timeout?: number;
    retries?: number;
    onProgress?: (loaded: number, total: number) => void;
  } = {}
): Promise<{ successful: HTMLImageElement[]; failed: string[] }> => {
  const { concurrency = 5, timeout = 10000, retries = 3, onProgress } = options;
  
  const results: { successful: HTMLImageElement[]; failed: string[] } = {
    successful: [],
    failed: []
  };

  let loaded = 0;
  const total = urls.length;

  // Process URLs in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (url) => {
      try {
        const img = await loadImageWithErrorHandling(url, { timeout, retries });
        results.successful.push(img);
        loaded++;
        if (onProgress) onProgress(loaded, total);
        return { success: true, url };
      } catch (error) {
        results.failed.push(url);
        loaded++;
        if (onProgress) onProgress(loaded, total);
        return { success: false, url };
      }
    });

    await Promise.allSettled(batchPromises);
  }

  return results;
};

// Image validation with error reporting
export const validateImage = (url: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!url) {
    errors.push('URL is empty');
    return { valid: false, errors };
  }

  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      errors.push('Invalid protocol');
    }
  } catch {
    errors.push('Invalid URL format');
  }

  const allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const format = url.split('.').pop()?.toLowerCase();
  if (!format || !allowedFormats.includes(format)) {
    errors.push(`Unsupported format: ${format || 'unknown'}`);
  }

  return { valid: errors.length === 0, errors };
};

// Debug mode utilities
export const enableImageDebugMode = (): void => {
  // Override console methods to capture image-related logs
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    if (args.some(arg => typeof arg === 'string' && arg.includes('image'))) {
      imageErrorHandler.logError('load', args.join(' '), 'unknown');
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    if (args.some(arg => typeof arg === 'string' && arg.includes('image'))) {
      imageErrorHandler.logError('load', args.join(' '), 'unknown');
    }
    originalError.apply(console, args);
  };
};

// Export debug information for development
export const getImageDebugReport = (): string => {
  const stats = imageErrorHandler.getErrorStats();
  const recentErrors = imageErrorHandler.getRecentErrors();
  const debugInfo = imageErrorHandler.getAllDebugInfo();

  return `
Image Debug Report
==================
Total Errors: ${stats.total}
Recent Errors (5min): ${stats.recent}
Errors by Type: ${JSON.stringify(stats.byType, null, 2)}
Top Problematic URLs: ${JSON.stringify(stats.topUrls, null, 2)}
Recent Errors: ${JSON.stringify(recentErrors, null, 2)}
Debug Info: ${JSON.stringify(debugInfo, null, 2)}
  `.trim();
};

// Development helper to log debug report
export const logImageDebugReport = (): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(getImageDebugReport());
  }
};

export default imageErrorHandler;
