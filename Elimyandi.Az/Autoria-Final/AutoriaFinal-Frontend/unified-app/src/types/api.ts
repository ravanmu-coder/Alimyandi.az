// Auth types
export interface AuthResponseDto {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

export interface RegisterDto {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

// Auction types
export interface AuctionGetDto {
  id: string;
  name?: string;
  startTimeUtc: string;
  endTimeUtc: string;
  status: string;
  startPrice?: number;
  isLive: boolean;
  currentCarLotNumber?: string;
  totalCarsCount: number;
  carsWithPreBidsCount: number;
  locationId: string;
  locationName?: string;
  soldCarsCount?: number;
  unsoldCarsCount?: number;
  totalRevenue?: number;
}

export interface AuctionDetailDto {
  id: string;
  name?: string;
  startTimeUtc: string;
  endTimeUtc: string;
  status: string;
  minBidIncrement: number;
  startPrice?: number;
  timerSeconds: number;
  currentCarLotNumber?: string;
  isLive: boolean;
  extendedCount: number;
  maxCarDurationMinutes: number;
  currentCarStartTime?: string;
  createdByUserId?: string;
  createdAt: string;
  updatedAt?: string;
  totalCarsCount: number;
  carsWithPreBidsCount: number;
  soldCarsCount: number;
  unsoldCarsCount: number;
  totalSalesAmount: number;
  locationId: string;
  locationName?: string;
  auctionCars?: AuctionCarGetDto[];
}

export interface AuctionTimerInfo {
  auctionId: string;
  isLive: boolean;
  timerSeconds: number;
  currentCarLotNumber?: string;
  currentCarStartTime?: string;
}

// AuctionCar types
export interface AuctionCarGetDto {
  id: string;
  auctionId: string;
  carId: string;
  lotNumber?: string;
  currentPrice: number;
  minPreBid: number;
  winnerStatus?: string;
  isActive: boolean;
  bidCount?: number;
  lastBidTime?: string;
  isReserveMet?: boolean;
  reservePrice?: number;
  carMake?: string;
  carModel?: string;
  carYear?: number;
  carImage?: string;
  carVin?: string;
  carOdometer?: number;
  carCondition?: string;
  carType?: string;
  carDamageType?: string;
  carLocation?: string;
  auctionName?: string;
  auctionStartTime?: string;
  auctionEndTime?: string;
}

export interface AuctionCarDetailDto {
  id: string;
  auctionId: string;
  carId: string;
  lotNumber?: string;
  currentPrice: number;
  minPreBid: number;
  winnerStatus?: string;
  isActive: boolean;
  bidCount?: number;
  lastBidTime?: string;
  isReserveMet?: boolean;
  reservePrice?: number;
  car: CarDto;
  auction: AuctionGetDto;
  bids?: BidGetDto[];
}

// Car types
export interface CarDto {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  odometer: number;
  condition: string;
  type: string;
  damageType: string;
  color?: string;
  engine?: string;
  transmission?: string;
  fuelType?: string;
  driveType?: string;
  cylinders?: number;
  doors?: number;
  seats?: number;
  imageUrls?: string[];
  description?: string;
  features?: string[];
  locationId: string;
  location?: LocationDto;
}

// Location types
export interface LocationDto {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  address: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

// Bid types
export interface BidGetDto {
  id: string;
  auctionCarId: string;
  userId: string;
  amount: number;
  bidType: string;
  timestamp: string;
  isWinning: boolean;
  isOutbid: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface BidDetailDto {
  id: string;
  auctionCarId: string;
  userId: string;
  amount: number;
  bidType: string;
  timestamp: string;
  isWinning: boolean;
  isOutbid: boolean;
  maxAmount?: number;
  incrementAmount?: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  auctionCar?: AuctionCarGetDto;
}

export interface PlaceLiveBidRequest {
  auctionCarId: string;
  amount: number;
}

export interface PlacePreBidRequest {
  auctionCarId: string;
  amount: number;
}

export interface PlaceProxyBidRequest {
  auctionCarId: string;
  maxAmount: number;
  incrementAmount: number;
}

export interface BidValidationResult {
  isValid: boolean;
  message?: string;
  minimumBid?: number;
  maximumBid?: number;
}

// Vehicle Search types
export interface VehicleSearchParams {
  make?: string;
  model?: string;
  year?: number;
  condition?: string;
  damageType?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  vin?: string;
  lotNumber?: string;
  page?: number;
  pageSize?: number;
  type?: string;
  minYear?: number;
  maxYear?: number;
  minOdometer?: number;
  maxOdometer?: number;
}

export interface VehicleSearchResult {
  vehicles: CarData[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Car data from GET /api/car endpoint
export interface CarData {
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
  ownerId?: string;
  ownerUsername?: string;
  createdAt?: string;
  updatedAt?: string;
  photoUrls?: string[];
  imagePath?: string;
  image?: string;
  imageUrl?: string;
  hasKeys?: boolean;
}

export interface VehicleSearchItem {
  id: string;
  auctionId: string;
  carId: string;
  lotNumber: string;
  currentPrice: number;
  minPreBid: number;
  winnerStatus: string;
  isActive: boolean;
  bidCount: number;
  lastBidTime: string;
  isReserveMet: boolean;
  reservePrice: number;
  carMake: string;
  carModel: string;
  carYear: number;
  carImage: string;
  carVin: string;
  carOdometer: number;
  carCondition: string;
  carType: string;
  carDamageType: string;
  carLocation: string;
  auctionName: string;
  auctionStartTime: string;
  auctionEndTime: string;
}

export interface VehicleFilters {
  conditions: string[];
  types: string[];
  damageTypes: string[];
  makes: string[];
  models: string[];
  locations: string[];
}

// Auction Winner types
export interface AuctionWinnerDto {
  id: string;
  auctionCarId: string;
  userId: string;
  winningBidId: string;
  winningAmount: number;
  paymentDueDate: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentDate?: string;
  isConfirmed: boolean;
  isRejected: boolean;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  auctionCar?: AuctionCarGetDto;
  winningBid?: BidDetailDto;
}

// User Profile types
export interface IUserProfile {
  id: string;
  userName?: string;
  email?: string;
  emailConfirmed: boolean;
  roles?: string[];
  createdAt: string;
  lastLoginAt?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  isActive: boolean;
  fullName?: string;
  age?: number;
  primaryRole?: string;
  isAdmin: boolean;
  isSeller: boolean;
  bio?: string;
  city?: string;
  country?: string;
  timeZone?: string;
  allowMarketing?: boolean;
  preferredLanguage?: string;
  passwordChangedAt?: string;
}

export interface IUpdateUserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  bio?: string;
  city?: string;
  country?: string;
  timeZone?: string;
  allowMarketing?: boolean;
  preferredLanguage?: string;
}

// Info types
export interface InfoDto {
  version: string;
  environment: string;
  buildDate: string;
  features: string[];
  limits: {
    maxBidAmount: number;
    maxProxyBidAmount: number;
    maxAuctionDuration: number;
    maxCarsPerAuction: number;
  };
}