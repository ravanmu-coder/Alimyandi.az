// Utility functions for using mock data in tests
import { mockAuctions, mockAuctionCreate } from './auction-mock-data';
import { mockAuctionCars, mockAuctionCarCreate } from './auction-car-mock-data';
import { mockAuctionWinners, mockAuctionWinnerCreate } from './auction-winner-mock-data';
import { mockUser, mockLoginRequest } from './auth-mock-data';
import { mockBids, mockPreBidRequest } from './bid-mock-data';
import { mockCars, mockCarCreate } from './car-mock-data';
import { mockLocations, mockLocationCreate } from './location-mock-data';

// Generate random UUID for testing
export const generateMockId = (): string => {
  return '550e8400-e29b-41d4-a716-' + Math.random().toString(16).substr(2, 12);
};

// Generate random date within a range
export const generateMockDate = (startDate: Date, endDate: Date): string => {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime).toISOString();
};

// Generate random number within a range
export const generateMockNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate random string
export const generateMockString = (length: number = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate random email
export const generateMockEmail = (): string => {
  const domains = ['example.com', 'test.com', 'mock.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${generateMockString(8)}@${domain}`;
};

// Generate random phone number
export const generateMockPhone = (): string => {
  const areaCode = generateMockNumber(200, 999);
  const exchange = generateMockNumber(200, 999);
  const number = generateMockNumber(1000, 9999);
  return `+1-${areaCode}-${exchange}-${number}`;
};

// Generate random VIN
export const generateMockVIN = (): string => {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return vin;
};

// Create mock auction with custom data
export const createMockAuction = (overrides: any = {}) => {
  return {
    id: generateMockId(),
    title: `Test Auction ${generateMockString(5)}`,
    description: `Test auction description ${generateMockString(20)}`,
    startTime: generateMockDate(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    endTime: generateMockDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
    locationId: generateMockId(),
    status: 'Ready',
    isLive: false,
    totalCars: 0,
    soldCars: 0,
    totalRevenue: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};

// Create mock auction car with custom data
export const createMockAuctionCar = (overrides: any = {}) => {
  return {
    id: generateMockId(),
    auctionId: generateMockId(),
    carId: generateMockId(),
    lotNumber: `LOT-${generateMockNumber(100, 999)}`,
    itemNumber: generateMockNumber(1, 100),
    reservePrice: generateMockNumber(10000, 100000),
    hammerPrice: null,
    currentPrice: generateMockNumber(5000, 50000),
    isReserveMet: false,
    minPreBid: generateMockNumber(100, 5000),
    winnerStatus: 'Active',
    soldPrice: null,
    lastBidTime: null,
    bidCount: 0,
    isActive: false,
    activeStartTime: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalBidsCount: 0,
    preBidsCount: 0,
    highestPreBidAmount: 0,
    highestBidAmount: 0,
    remainingTimeSeconds: 0,
    isTimeExpired: false,
    carMake: 'Test Make',
    carModel: 'Test Model',
    carYear: generateMockNumber(1990, 2024),
    carVin: generateMockVIN(),
    ...overrides
  };
};

// Create mock user with custom data
export const createMockUser = (overrides: any = {}) => {
  return {
    id: generateMockId(),
    email: generateMockEmail(),
    firstName: `Test${generateMockString(5)}`,
    lastName: `User${generateMockString(5)}`,
    phoneNumber: generateMockPhone(),
    isEmailConfirmed: true,
    roles: ['Bidder', 'User'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    ...overrides
  };
};

// Create mock car with custom data
export const createMockCar = (overrides: any = {}) => {
  const makes = ['Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Porsche'];
  const models = ['Mustang', 'Corvette', '3 Series', 'C-Class', 'A4', '911'];
  const colors = ['Red', 'Blue', 'Black', 'White', 'Silver', 'Green'];
  
  return {
    id: generateMockId(),
    make: makes[Math.floor(Math.random() * makes.length)],
    model: models[Math.floor(Math.random() * models.length)],
    year: generateMockNumber(1990, 2024),
    vin: generateMockVIN(),
    color: colors[Math.floor(Math.random() * colors.length)],
    mileage: generateMockNumber(1000, 200000),
    engine: 'V8 4.6L',
    transmission: 'Manual',
    fuelType: 'Gasoline',
    bodyType: 'Coupe',
    condition: 'Good',
    description: `Test car description ${generateMockString(50)}`,
    images: [`https://example.com/images/car-${generateMockString(5)}.jpg`],
    features: ['Air Conditioning', 'Power Steering'],
    history: {
      accidents: 0,
      owners: 1,
      serviceRecords: true,
      lastServiceDate: new Date().toISOString()
    },
    estimatedValue: {
      min: generateMockNumber(10000, 50000),
      max: generateMockNumber(50000, 100000),
      average: generateMockNumber(30000, 75000)
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};

// Create mock bid with custom data
export const createMockBid = (overrides: any = {}) => {
  return {
    id: generateMockId(),
    auctionCarId: generateMockId(),
    userId: generateMockId(),
    amount: generateMockNumber(1000, 100000),
    bidTime: new Date().toISOString(),
    isWinning: false,
    isProxy: false,
    maxAmount: null,
    createdAt: new Date().toISOString(),
    ...overrides
  };
};

// Create mock location with custom data
export const createMockLocation = (overrides: any = {}) => {
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Houston'];
  const states = ['NY', 'CA', 'IL', 'FL', 'TX'];
  const cityIndex = Math.floor(Math.random() * cities.length);
  
  return {
    id: generateMockId(),
    name: `Test Location ${generateMockString(5)}`,
    address: `${generateMockNumber(100, 9999)} Test Street`,
    city: cities[cityIndex],
    state: states[cityIndex],
    zipCode: generateMockNumber(10000, 99999).toString(),
    country: 'USA',
    phoneNumber: generateMockPhone(),
    email: generateMockEmail(),
    capacity: generateMockNumber(100, 1000),
    facilities: ['Parking', 'WiFi', 'Security'],
    coordinates: {
      latitude: generateMockNumber(25000000, 49000000) / 1000000,
      longitude: generateMockNumber(-125000000, -66000000) / 1000000
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};

// Generate array of mock data
export const generateMockArray = <T>(
  generator: () => T,
  count: number = 10
): T[] => {
  return Array.from({ length: count }, generator);
};

// Mock API response helper
export const createMockApiResponse = <T>(
  data: T,
  status: number = 200,
  message: string = 'Success'
) => {
  return {
    data,
    status,
    message,
    timestamp: new Date().toISOString()
  };
};

// Mock paginated response helper
export const createMockPaginatedResponse = <T>(
  data: T[],
  page: number = 1,
  pageSize: number = 10,
  totalCount: number = data.length
) => {
  return {
    data,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNext: page * pageSize < totalCount,
      hasPrevious: page > 1
    },
    timestamp: new Date().toISOString()
  };
};

// Mock error response helper
export const createMockErrorResponse = (
  message: string = 'An error occurred',
  status: number = 500,
  code: string = 'INTERNAL_ERROR'
) => {
  return {
    error: {
      message,
      status,
      code,
      timestamp: new Date().toISOString()
    }
  };
};
