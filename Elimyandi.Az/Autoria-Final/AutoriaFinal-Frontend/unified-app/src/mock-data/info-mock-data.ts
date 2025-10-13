// Mock data for Info endpoint
export const mockApiInfo = {
  title: "Əlimyandı.az Auction API",
  description: "API for auction management system",
  version: "v1.0.0",
  environment: "Development",
  buildNumber: "2024.03.15.1",
  buildDate: "2024-03-15T10:00:00Z",
  uptime: 86400,
  status: "Healthy",
  features: [
    "Auction Management",
    "Car Management",
    "Bidding System",
    "User Authentication",
    "Payment Processing",
    "Real-time Updates",
    "WebSocket Support"
  ],
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
  },
  database: {
    status: "Connected",
    version: "PostgreSQL 14.5",
    uptime: 86400
  },
  cache: {
    status: "Connected",
    type: "Redis",
    uptime: 86400
  },
  externalServices: {
    paymentGateway: "Connected",
    emailService: "Connected",
    smsService: "Connected",
    websocketService: "Connected"
  },
  limits: {
    rateLimit: "1000 requests per hour",
    maxFileSize: "10MB",
    maxBidAmount: 10000000,
    maxAuctionDuration: 8
  },
  contact: {
    support: "support@autoria.com",
    technical: "tech@autoria.com",
    documentation: "https://docs.autoria.com"
  }
};
