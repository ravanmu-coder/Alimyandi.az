import { apiClient } from '../lib/api';

export interface CarDetailsDto {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  color?: string;
  bodyStyle?: string;
  odometer?: number;
  odometerUnit?: string;
  fuel?: string;
  fuelType?: string;
  transmission?: string;
  driveTrain?: string;
  condition?: string;
  type?: string;
  damageType?: string;
  primaryDamage?: string;
  secondaryDamage?: string;
  titleType?: string;
  titleState?: string;
  estimatedRetailValue?: number;
  locationId?: string;
  locationName?: string;
  locationAddress?: string;
  locationCity?: string;
  imageUrls?: string[];
  thumbnailUrl?: string;
  hasKeys?: boolean;
  description?: string;
  features?: string[];
}

export const carApi = {
  // Get car details by ID
  getCarDetails: async (carId: string): Promise<CarDetailsDto> => {
    try {
      console.log(`📡 Fetching car details for ${carId}`);
      const response = await apiClient.getCar(carId);
      
      // Defensive mapping to handle different response structures
      const mappedCar: CarDetailsDto = {
        id: response.id || carId,
        make: response.make || 'Unknown',
        model: response.model || 'Unknown',
        year: Number(response.year) || 0,
        vin: response.vin || '',
        color: response.color || '',
        bodyStyle: response.bodyStyle || '',
        odometer: Number(response.odometer) || 0,
        odometerUnit: response.odometerUnit || 'miles',
        fuel: response.fuel || '',
        fuelType: response.fuelType || '',
        transmission: response.transmission || '',
        driveTrain: response.driveTrain || '',
        condition: response.condition || '',
        type: response.type || '',
        damageType: response.damageType || '',
        primaryDamage: response.primaryDamage || '',
        secondaryDamage: response.secondaryDamage || '',
        titleType: response.titleType || '',
        titleState: response.titleState || '',
        estimatedRetailValue: Number(response.estimatedRetailValue) || 0,
        locationId: response.locationId || '',
        locationName: response.locationName || '',
        locationAddress: response.locationAddress || '',
        locationCity: response.locationCity || '',
        imageUrls: response.imageUrls || response.photoUrls || [],
        thumbnailUrl: (response.imageUrls || response.photoUrls || [])[0] || response.imagePath || response.imageUrl || '/placeholder-car.jpg',
        hasKeys: Boolean(response.hasKeys),
        description: response.description || '',
        features: response.features || []
      };
      
      console.log(`✅ Successfully fetched car details for ${carId}`);
      return mappedCar;
    } catch (error) {
      console.error(`❌ Error fetching car details for ${carId}:`, error);
      
      if ((error as any)?.response?.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      
      throw new Error(`Failed to fetch car details for ${carId}`);
    }
  },

  // Get car display title
  getCarDisplayTitle: (car: CarDetailsDto): string => {
    const parts = [];
    
    if (car.year && car.year > 0) {
      parts.push(car.year.toString());
    }
    
    if (car.make && car.make !== 'Unknown') {
      parts.push(car.make);
    }
    
    if (car.model && car.model !== 'Unknown') {
      parts.push(car.model);
    }
    
    return parts.length > 0 ? parts.join(' ') : 'Unknown Vehicle';
  },

  // Format odometer reading
  formatOdometer: (car: CarDetailsDto): string => {
    if (!car.odometer || car.odometer === 0) {
      return 'N/A';
    }
    
    const formatted = car.odometer.toLocaleString();
    const unit = car.odometerUnit || 'miles';
    
    return `${formatted} ${unit}`;
  },

  // Get car condition display
  getConditionDisplay: (car: CarDetailsDto): string => {
    if (car.condition) {
      return car.condition;
    }
    
    if (car.damageType && car.damageType !== 'None') {
      return car.damageType;
    }
    
    return 'Unknown';
  },

  // Get primary car image
  getPrimaryImage: (car: CarDetailsDto): string => {
    if (car.thumbnailUrl && car.thumbnailUrl !== '/placeholder-car.jpg') {
      return car.thumbnailUrl;
    }
    
    if (car.imageUrls && car.imageUrls.length > 0) {
      return car.imageUrls[0];
    }
    
    return '/placeholder-car.jpg';
  },

  // Check if car has multiple images
  hasMultipleImages: (car: CarDetailsDto): boolean => {
    return (car.imageUrls && car.imageUrls.length > 1) || false;
  }
};
