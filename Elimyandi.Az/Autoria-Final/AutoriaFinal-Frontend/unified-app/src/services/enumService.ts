import { useState, useEffect, useCallback } from 'react';

// Types for enum metadata
export interface EnumMapping {
  [key: string]: string; // numeric key -> label
}

export interface EnumMetadata {
  [enumName: string]: EnumMapping;
}

export interface EnumUiConfig {
  color: string;
  bgColor: string;
  textColor: string;
}

export interface EnumUiMapping {
  [enumName: string]: {
    [value: string]: EnumUiConfig;
  };
}

// Cache configuration
const CACHE_KEY = 'enum-metadata';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Default fallback mappings (in case backend is unavailable)
const FALLBACK_ENUMS: EnumMetadata = {
  AuctionStatus: {
    '0': 'Draft',
    '1': 'Scheduled', 
    '2': 'Running',
    '3': 'Ended',
    '4': 'Cancelled',
    '5': 'Settled'
  },
  BidStatus: {
    '0': 'Placed',
    '1': 'Retracted', 
    '2': 'Invalidated'
  },
  BidType: {
    '1': 'Regular',
    '2': 'PreBid',
    '3': 'ProxyBid',
    '4': 'AutoBid'
  },
  CarCondition: {
    '0': 'Naməlum',
    '1': 'İşləyir və Sürülür',
    '2': 'Mühərrik Başlatma Proqramı',
    '3': 'Təkmilləşdirilmiş',
    '4': 'Stasionar'
  },
  DamageType: {
    '0': 'Naməlum',
    '1': 'Ön Hissə',
    '2': 'Arxa Hissə',
    '3': 'Yan Tərəf',
    '4': 'Kiçik Batıq/Cızıqlar',
    '5': 'Normal Aşınma',
    '6': 'Hər Tərəfli',
    '7': 'Dolu',
    '8': 'Vandalizm',
    '9': 'Su/Sel',
    '10': 'Yanma',
    '11': 'Mexaniki',
    '12': 'Dam',
    '13': 'Alt Hissə'
  },
  DriveTrain: {
    '0': 'Naməlum',
    '1': 'Ön Təkər',
    '2': 'Arxa Təkər',
    '3': 'Tam Ötürücü',
    '4': 'Dörd Təkər'
  },
  FuelType: {
    '0': 'Naməlum',
    '1': 'Benzin',
    '2': 'Dizel',
    '3': 'Hibrid',
    '4': 'Elektrik',
    '5': 'LPG',
    '6': 'CNG',
    '7': 'Digər'
  },
  TitleType: {
    '0': 'Naməlum',
    '1': 'Təmiz',
    '2': 'Salvage',
    '3': 'Təmir Edilməz',
    '4': 'Məhv Sertifikatı',
    '5': 'Yenidən Qurulmuş',
    '6': 'Zibil'
  },
  Transmission: {
    '0': 'Naməlum',
    '1': 'Avtomatik',
    '2': 'Mexaniki',
    '3': 'CVT'
  }
};

// UI color mappings for different enum values
const ENUM_UI_MAPPING: EnumUiMapping = {
  AuctionStatus: {
    '0': { color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    '1': { color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    '2': { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    '3': { color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    '4': { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    '5': { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' }
  },
  BidStatus: {
    '0': { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    '1': { color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
    '2': { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' }
  },
  BidType: {
    '1': { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    '2': { color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    '3': { color: 'indigo', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' },
    '4': { color: 'cyan', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800' }
  },
  CarCondition: {
    '0': { color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    '1': { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    '2': { color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    '3': { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    '4': { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' }
  },
  DamageType: {
    '0': { color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    '1': { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    '2': { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    '3': { color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
    '4': { color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    '5': { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    '6': { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    '7': { color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    '8': { color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    '9': { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    '10': { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    '11': { color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
    '12': { color: 'indigo', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' },
    '13': { color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
  },
  DriveTrain: {
    '0': { color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    '1': { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    '2': { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    '3': { color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    '4': { color: 'indigo', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' }
  },
  FuelType: {
    '0': { color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    '1': { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    '2': { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    '3': { color: 'emerald', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800' },
    '4': { color: 'cyan', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800' },
    '5': { color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    '6': { color: 'indigo', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' },
    '7': { color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' }
  },
  TitleType: {
    '0': { color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    '1': { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    '2': { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    '3': { color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
    '4': { color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    '5': { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    '6': { color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' }
  },
  Transmission: {
    '0': { color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    '1': { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    '2': { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    '3': { color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' }
  }
};

// Cache management
const getCachedEnums = (): EnumMetadata | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn('Failed to parse cached enum data:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const setCachedEnums = (data: EnumMetadata): void => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache enum data:', error);
  }
};

// Main enum service hook
export const useEnums = () => {
  const [enums, setEnums] = useState<EnumMetadata>(FALLBACK_ENUMS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const loadEnums = useCallback(async (forceRefresh = false) => {
    // Check cache first unless forcing refresh
    if (!forceRefresh) {
      const cached = getCachedEnums();
      if (cached) {
        console.log('Enums loaded from cache');
        setEnums(cached);
        setError(null);
        return cached;
      }
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Using fallback enum mappings (no API endpoints available)');
      
      // Since backend doesn't have enum endpoints, use fallback mappings directly
      setEnums(FALLBACK_ENUMS);
      setCachedEnums(FALLBACK_ENUMS);
      setLastFetch(new Date());
      setError('Using fallback data - API endpoints not available');
      
      return FALLBACK_ENUMS;
    } catch (err: any) {
      console.error('Failed to load enums:', err);
      
      // Use cached data if available, otherwise fallback
      const cached = getCachedEnums();
      if (cached) {
        console.log('Using cached enums due to error');
        setEnums(cached);
        setError('Using cached data - API unavailable');
      } else {
        console.log('Using fallback enums due to error');
        setEnums(FALLBACK_ENUMS);
        setError('API unavailable - using fallback data');
      }
      
      return cached || FALLBACK_ENUMS;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load enums on mount
  useEffect(() => {
    loadEnums();
  }, [loadEnums]);

  return {
    enums,
    loading,
    error,
    lastFetch,
    refresh: () => loadEnums(true)
  };
};

// Utility functions for enum operations
export const getEnumLabel = (
  enumName: string, 
  value: number | string, 
  enums: EnumMetadata = FALLBACK_ENUMS
): string => {
  const stringValue = String(value);
  const enumMapping = enums[enumName];
  
  if (!enumMapping) {
    console.warn(`getEnumLabel: Enum "${enumName}" not found`);
    return `Unknown (${stringValue})`;
  }
  
  const label = enumMapping[stringValue];
  if (!label) {
    console.warn(`getEnumLabel: Missing mapping for ${enumName}:${stringValue}`);
    return `Unknown (${stringValue})`;
  }
  
  return label;
};

export const getEnumUiConfig = (
  enumName: string,
  value: number | string
): EnumUiConfig => {
  const stringValue = String(value);
  const uiMapping = ENUM_UI_MAPPING[enumName];
  
  if (!uiMapping) {
    return { color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  }
  
  const config = uiMapping[stringValue];
  if (!config) {
    return { color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  }
  
  return config;
};

export const getEnumBadgeClasses = (
  enumName: string,
  value: number | string
): string => {
  const config = getEnumUiConfig(enumName, value);
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`;
};

// Helper function to get all enum values for a specific enum
export const getEnumValues = (
  enumName: string,
  enums: EnumMetadata = FALLBACK_ENUMS
): Array<{ value: string; label: string }> => {
  const enumMapping = enums[enumName];
  if (!enumMapping) return [];
  
  return Object.entries(enumMapping).map(([value, label]) => ({
    value,
    label
  }));
};

// Helper function to check if an enum value exists
export const isValidEnumValue = (
  enumName: string,
  value: number | string,
  enums: EnumMetadata = FALLBACK_ENUMS
): boolean => {
  const stringValue = String(value);
  const enumMapping = enums[enumName];
  return enumMapping ? stringValue in enumMapping : false;
};

// Export the UI mapping for direct access if needed
export { ENUM_UI_MAPPING };
