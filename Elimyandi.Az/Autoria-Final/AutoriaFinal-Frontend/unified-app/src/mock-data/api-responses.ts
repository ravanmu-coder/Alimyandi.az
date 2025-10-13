// Mock API responses for all endpoints
import { createMockApiResponse, createMockPaginatedResponse, createMockErrorResponse } from './test-utils';

// Auction API Responses
export const mockAuctionResponses = {
  // GET /api/Auction
  getAllAuctions: createMockPaginatedResponse([
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      title: "Classic Car Auction - Spring 2024",
      status: "Active",
      startTime: "2024-03-15T10:00:00Z",
      endTime: "2024-03-15T18:00:00Z",
      location: "Auction House Downtown",
      totalCars: 25,
      soldCars: 12
    }
  ]),

  // GET /api/Auction/{id}
  getAuctionById: createMockApiResponse({
    id: "550e8400-e29b-41d4-a716-446655440001",
    title: "Classic Car Auction - Spring 2024",
    description: "Premium collection of classic and vintage automobiles",
    status: "Active",
    startTime: "2024-03-15T10:00:00Z",
    endTime: "2024-03-15T18:00:00Z",
    location: {
      id: "550e8400-e29b-41d4-a716-446655440010",
      name: "Auction House Downtown",
      address: "123 Main Street, Downtown"
    },
    totalCars: 25,
    soldCars: 12,
    totalRevenue: 2500000
  }),

  // POST /api/Auction
  createAuction: createMockApiResponse({
    id: "550e8400-e29b-41d4-a716-446655440999",
    title: "New Test Auction",
    status: "Ready",
    startTime: "2024-04-01T10:00:00Z",
    endTime: "2024-04-01T18:00:00Z"
  }, 201, "Auction created successfully"),

  // GET /api/Auction/live
  getLiveAuctions: createMockApiResponse([
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      title: "Classic Car Auction - Spring 2024",
      currentCar: "1967 Ford Mustang",
      currentBid: 45000,
      timeRemaining: 1800,
      viewers: 1250
    }
  ]),

  // GET /api/Auction/active
  getActiveAuctions: createMockApiResponse([
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      title: "Classic Car Auction - Spring 2024",
      status: "Active",
      startTime: "2024-03-15T10:00:00Z",
      endTime: "2024-03-15T18:00:00Z"
    }
  ]),

  // GET /api/Auction/{id}/statistics
  getAuctionStatistics: createMockApiResponse({
    totalBids: 150,
    totalRevenue: 2500000,
    averageBidAmount: 16666.67,
    totalCars: 25,
    soldCars: 12,
    unsoldCars: 13,
    averageSellingPrice: 208333.33
  })
};

// AuctionCar API Responses
export const mockAuctionCarResponses = {
  // GET /api/AuctionCar
  getAllAuctionCars: createMockPaginatedResponse([
    {
      id: "550e8400-e29b-41d4-a716-446655440100",
      lotNumber: "LOT-001",
      carMake: "Ford",
      carModel: "Mustang",
      carYear: 1967,
      currentPrice: 55000,
      status: "Sold",
      isActive: false
    }
  ]),

  // GET /api/AuctionCar/{id}
  getAuctionCarById: createMockApiResponse({
    id: "550e8400-e29b-41d4-a716-446655440100",
    lotNumber: "LOT-001",
    carMake: "Ford",
    carModel: "Mustang",
    carYear: 1967,
    currentPrice: 55000,
    reservePrice: 50000,
    isReserveMet: true,
    bidCount: 15,
    isActive: false,
    winnerStatus: "Sold"
  }),

  // POST /api/AuctionCar
  createAuctionCar: createMockApiResponse({
    id: "550e8400-e29b-41d4-a716-446655440999",
    lotNumber: "LOT-999",
    status: "Ready"
  }, 201, "Auction car created successfully"),

  // GET /api/AuctionCar/auction/{auctionId}
  getAuctionCarsByAuction: createMockApiResponse([
    {
      id: "550e8400-e29b-41d4-a716-446655440100",
      lotNumber: "LOT-001",
      carMake: "Ford",
      carModel: "Mustang",
      currentPrice: 55000,
      status: "Sold"
    }
  ]),

  // GET /api/AuctionCar/{id}/pre-bids
  getPreBids: createMockApiResponse([
    {
      id: "550e8400-e29b-41d4-a716-446655440300",
      amount: 65000,
      maxAmount: 70000,
      bidder: "John Doe",
      createdAt: "2024-03-15T10:30:00Z"
    }
  ]),

  // GET /api/AuctionCar/{id}/stats
  getAuctionCarStats: createMockApiResponse({
    totalBids: 12,
    preBids: 5,
    liveBids: 7,
    highestBid: 68000,
    averageBid: 62000,
    timeRemaining: 180
  })
};

// Auth API Responses
export const mockAuthResponses = {
  // POST /api/Auth/register
  register: createMockApiResponse({
    userId: "550e8400-e29b-41d4-a716-446655440999",
    message: "Registration successful. Please check your email for confirmation."
  }, 201, "User registered successfully"),

  // POST /api/Auth/login
  login: createMockApiResponse({
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    refreshToken: "refresh_token_123456789",
    expiresIn: 3600,
    user: {
      id: "550e8400-e29b-41d4-a716-446655440400",
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      roles: ["Bidder", "User"]
    }
  }),

  // POST /api/Auth/login (Admin)
  loginAdmin: createMockApiResponse({
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    refreshToken: "refresh_token_admin_123456789",
    expiresIn: 3600,
    user: {
      id: "550e8400-e29b-41d4-a716-446655440401",
      email: "admin@alimyandi.az",
      firstName: "Admin",
      lastName: "User",
      roles: ["admin", "Admin"]
    }
  }),

  // POST /api/Auth/logout
  logout: createMockApiResponse({
    message: "Logged out successfully"
  }),

  // GET /api/Auth/me
  getMe: createMockApiResponse({
    id: "550e8400-e29b-41d4-a716-446655440400",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    phoneNumber: "+1234567890",
    isEmailConfirmed: true,
    roles: ["Bidder", "User"],
    createdAt: "2024-01-15T10:00:00Z"
  }),

  // GET /api/Auth/roles
  getRoles: createMockApiResponse([
    { id: "1", name: "Admin", description: "Full system access" },
    { id: "2", name: "Auctioneer", description: "Can manage auctions" },
    { id: "3", name: "Bidder", description: "Can place bids" },
    { id: "4", name: "User", description: "Basic user access" }
  ])
};

// Bid API Responses
export const mockBidResponses = {
  // POST /api/Bid/prebid
  createPreBid: createMockApiResponse({
    bidId: "550e8400-e29b-41d4-a716-446655440999",
    message: "Pre-bid placed successfully"
  }, 201, "Pre-bid created successfully"),

  // POST /api/Bid/live
  createLiveBid: createMockApiResponse({
    bidId: "550e8400-e29b-41d4-a716-446655440999",
    message: "Live bid placed successfully"
  }, 201, "Live bid created successfully"),

  // GET /api/Bid/auction-car/{auctionCarId}/history
  getBidHistory: createMockApiResponse([
    {
      id: "550e8400-e29b-41d4-a716-446655440500",
      amount: 60000,
      bidTime: "2024-03-15T11:45:00Z",
      bidder: "John Doe",
      isWinning: false
    }
  ]),

  // GET /api/Bid/my-bids
  getMyBids: createMockApiResponse([
    {
      id: "550e8400-e29b-41d4-a716-446655440500",
      auctionCarId: "550e8400-e29b-41d4-a716-446655440101",
      amount: 65000,
      bidTime: "2024-03-15T12:00:00Z",
      isWinning: false,
      carMake: "Chevrolet",
      carModel: "Corvette",
      lotNumber: "LOT-002"
    }
  ]),

  // POST /api/Bid/validate
  validateBid: createMockApiResponse({
    isValid: true,
    canBid: true,
    minimumBid: 69000,
    message: "Bid is valid"
  })
};

// Car API Responses
export const mockCarResponses = {
  // GET /api/Car
  getAllCars: createMockPaginatedResponse([
    {
      id: "550e8400-e29b-41d4-a716-446655440200",
      make: "Ford",
      model: "Mustang",
      year: 1967,
      vin: "1FAFP42X17F123456",
      color: "Red",
      condition: "Excellent"
    }
  ]),

  // GET /api/Car/{id}
  getCarById: createMockApiResponse({
    id: "550e8400-e29b-41d4-a716-446655440200",
    make: "Ford",
    model: "Mustang",
    year: 1967,
    vin: "1FAFP42X17F123456",
    color: "Red",
    mileage: 45000,
    condition: "Excellent",
    description: "Classic 1967 Ford Mustang in pristine condition"
  }),

  // POST /api/Car
  createCar: createMockApiResponse({
    id: "550e8400-e29b-41d4-a716-446655440999",
    message: "Car created successfully"
  }, 201, "Car created successfully")
};

// Location API Responses
export const mockLocationResponses = {
  // GET /api/Location
  getAllLocations: createMockApiResponse([
    {
      id: "550e8400-e29b-41d4-a716-446655440010",
      name: "Auction House Downtown",
      address: "123 Main Street, Downtown",
      city: "New York",
      state: "NY",
      capacity: 500,
      isActive: true
    }
  ]),

  // GET /api/Location/{id}
  getLocationById: createMockApiResponse({
    id: "550e8400-e29b-41d4-a716-446655440010",
    name: "Auction House Downtown",
    address: "123 Main Street, Downtown",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA",
    capacity: 500,
    facilities: ["Parking", "WiFi", "Security"]
  }),

  // POST /api/Location
  createLocation: createMockApiResponse({
    id: "550e8400-e29b-41d4-a716-446655440999",
    message: "Location created successfully"
  }, 201, "Location created successfully")
};

// Auction Winner API Responses
export const mockAuctionWinnerResponses = {
  // GET /api/auction-winners
  getAllWinners: createMockPaginatedResponse([
    {
      id: "550e8400-e29b-41d4-a716-446655440600",
      auctionCarId: "550e8400-e29b-41d4-a716-446655440100",
      winningAmount: 55000,
      status: "Confirmed",
      paymentStatus: "Paid",
      user: {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com"
      }
    }
  ]),

  // GET /api/auction-winners/my-wins
  getMyWins: createMockApiResponse([
    {
      id: "550e8400-e29b-41d4-a716-446655440600",
      winningAmount: 55000,
      status: "Confirmed",
      paymentStatus: "Paid",
      carMake: "Ford",
      carModel: "Mustang",
      lotNumber: "LOT-001"
    }
  ]),

  // POST /api/auction-winners/assign/{auctionCarId}
  assignWinner: createMockApiResponse({
    winnerId: "550e8400-e29b-41d4-a716-446655440999",
    message: "Winner assigned successfully"
  }, 201, "Winner assigned successfully")
};

// Info API Response
export const mockInfoResponse = createMockApiResponse({
  title: "Əlimyandı.az Auction API",
  version: "v1.0.0",
  status: "Healthy",
  uptime: 86400,
  endpoints: {
    total: 73,
    categories: {
      "Auction": 19,
      "AuctionCar": 25,
      "AuctionWinner": 16,
      "Auth": 8,
      "Bid": 12,
      "Car": 4,
      "Location": 4,
      "Info": 1
    }
  }
});

// Error Responses
export const mockErrorResponses = {
  // 400 Bad Request
  badRequest: createMockErrorResponse(
    "The request data is invalid",
    400,
    "BAD_REQUEST"
  ),

  // 401 Unauthorized
  unauthorized: createMockErrorResponse(
    "Authentication required",
    401,
    "UNAUTHORIZED"
  ),

  // 403 Forbidden
  forbidden: createMockErrorResponse(
    "Access denied",
    403,
    "FORBIDDEN"
  ),

  // 404 Not Found
  notFound: createMockErrorResponse(
    "Resource not found",
    404,
    "NOT_FOUND"
  ),

  // 409 Conflict
  conflict: createMockErrorResponse(
    "Resource already exists",
    409,
    "CONFLICT"
  ),

  // 422 Validation Error
  validationError: createMockErrorResponse(
    "Validation failed",
    422,
    "VALIDATION_ERROR"
  ),

  // 500 Internal Server Error
  internalError: createMockErrorResponse(
    "An internal server error occurred",
    500,
    "INTERNAL_ERROR"
  )
};
