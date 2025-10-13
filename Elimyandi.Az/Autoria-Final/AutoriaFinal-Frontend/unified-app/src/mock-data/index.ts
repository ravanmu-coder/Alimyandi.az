// Main export file for all mock data
export * from './auction-mock-data';
export * from './auction-car-mock-data';
export * from './auction-winner-mock-data';
export * from './auth-mock-data';
export * from './bid-mock-data';
export * from './car-mock-data';
export * from './location-mock-data';
export * from './info-mock-data';

// Combined mock data for easy testing
export const mockData = {
  auctions: require('./auction-mock-data').mockAuctions,
  auctionCars: require('./auction-car-mock-data').mockAuctionCars,
  auctionWinners: require('./auction-winner-mock-data').mockAuctionWinners,
  users: [require('./auth-mock-data').mockUser],
  bids: require('./bid-mock-data').mockBids,
  cars: require('./car-mock-data').mockCars,
  locations: require('./location-mock-data').mockLocations,
  apiInfo: require('./info-mock-data').mockApiInfo
};
