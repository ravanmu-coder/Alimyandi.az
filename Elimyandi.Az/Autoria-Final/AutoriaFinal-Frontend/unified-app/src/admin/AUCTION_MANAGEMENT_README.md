# Əlimyandi.az Admin - Auction Management System

## Overview

This is a comprehensive auction management system for the Əlimyandi.az admin panel. It provides complete CRUD operations for auctions and auction cars, along with real-time lifecycle controls and debugging capabilities.

## Features

### 🎯 Core Functionality
- **Auction Management**: Complete CRUD operations for auctions
- **Vehicle Management**: Add/remove vehicles to/from auctions
- **Lifecycle Controls**: Start, end, cancel, extend auctions
- **Real-time Updates**: Live auction status and timer management
- **Car-level Actions**: Prepare, activate, end individual vehicles
- **Bidding Management**: Pre-bids, hammer prices, unsold marking

### 🔧 Technical Features
- **Real API Integration**: Uses actual backend endpoints
- **Debug Panel**: Monitor all API requests and responses
- **Configuration Management**: Dynamic API URL and auth token configuration
- **Error Handling**: Comprehensive error states and user feedback
- **Loading States**: Skeleton loaders and progress indicators
- **Responsive Design**: Works on desktop and mobile devices

## API Endpoints Used

### Auction Endpoints
- `GET /api/auction` - List all auctions
- `GET /api/auction/{id}` - Get auction details
- `POST /api/auction` - Create new auction
- `PUT /api/auction/{id}` - Update auction
- `DELETE /api/auction/{id}` - Delete auction

### Auction Lifecycle Endpoints
- `POST /api/auction/{id}/start` - Start auction
- `POST /api/auction/{id}/end` - End auction
- `POST /api/auction/{id}/cancel` - Cancel auction
- `POST /api/auction/{id}/extend` - Extend auction time
- `POST /api/auction/{id}/next-car` - Move to next car
- `POST /api/auction/{id}/set-current-car` - Set current car by lot number
- `GET /api/auction/{id}/timer` - Get auction timer

### AuctionCar Endpoints
- `GET /api/auctioncar` - List all auction cars
- `GET /api/auctioncar/{id}` - Get auction car details
- `POST /api/auctioncar` - Create auction car
- `PUT /api/auctioncar/{id}` - Update auction car
- `DELETE /api/auctioncar/{id}` - Delete auction car

### AuctionCar Lifecycle Endpoints
- `POST /api/auctioncar/{id}/prepare` - Prepare car for auction
- `POST /api/auctioncar/{id}/activate` - Activate car for bidding
- `POST /api/auctioncar/{id}/end` - End car auction
- `POST /api/auctioncar/{id}/mark-unsold` - Mark car as unsold
- `PUT /api/auctioncar/{id}/price` - Update current price
- `POST /api/auctioncar/{id}/hammer` - Set hammer price (sold)

### Query & Navigation Endpoints
- `GET /api/auctioncar/auction/{auctionId}` - Get cars for specific auction
- `GET /api/auctioncar/auction/{auctionId}/ready` - Get ready cars for auction
- `GET /api/auctioncar/lot/{lotNumber}` - Get car by lot number
- `GET /api/auctioncar/{id}/timer` - Get car timer
- `GET /api/auctioncar/{id}/pre-bids` - Get pre-bids for car
- `GET /api/auctioncar/{id}/pre-bids/highest` - Get highest bid
- `GET /api/auctioncar/{id}/stats` - Get bidding statistics

### Supporting Endpoints
- `GET /api/location` - List locations
- `GET /api/car` - List available cars

## Components

### Main Components

#### `AuctionsListPage`
- Main auction management page
- Displays auctions in a table format
- Provides access to all modals and actions
- Includes filtering, sorting, and search functionality

#### `NewAuctionModal`
- Create new auctions
- Form validation and error handling
- Location selection and scheduling
- Auction settings configuration

#### `EditAuctionModal`
- Edit existing auctions
- Pre-populated form fields
- Same validation as new auction modal

#### `DeleteAuctionModal`
- Confirmation dialog for auction deletion
- Safety checks and reason logging
- Warning about data loss

#### `AuctionDetailModal`
- Comprehensive auction overview
- Three tabs: Overview, Vehicles, Lifecycle Controls
- Real-time timer display
- Statistics and revenue tracking
- Lifecycle action buttons

#### `AddVehicleModal`
- Add vehicles to auctions
- Search and filter available cars
- Set lot numbers and reserve prices
- Bulk vehicle selection

#### `AuctionCarModal`
- Individual car management
- Three tabs: Overview, Bids, Actions
- Car-level lifecycle controls
- Price updates and hammer setting
- Bidding statistics

#### `ConfigModal`
- API configuration management
- Base URL and auth token settings
- Connection testing
- Endpoint documentation

#### `DebugPanel`
- Real-time API request monitoring
- Request/response logging
- Error tracking
- Performance metrics

## Usage

### Getting Started

1. **Configure API Settings**
   - Click the "Config" button in the auction list
   - Set your base API URL (e.g., `https://localhost:7249`)
   - Optionally set an auth token
   - Test the connection

2. **View Auctions**
   - The main page loads all auctions automatically
   - Use filters to narrow down results
   - Click "View" to see detailed auction information

3. **Create New Auction**
   - Click "New Auction" button
   - Fill in auction details
   - Set start/end times and location
   - Configure auction settings
   - Optionally add vehicles immediately

4. **Manage Auction Lifecycle**
   - Open auction details
   - Go to "Controls" tab
   - Use lifecycle buttons to start, end, cancel, or extend auctions
   - Set current car or move to next car

5. **Manage Vehicles**
   - Add vehicles using "Add Vehicle" button
   - View individual car details by clicking "View" in the cars table
   - Use car-level actions to prepare, activate, or end individual vehicles
   - Update prices and set hammer prices

6. **Debug API Calls**
   - Click "Debug" button to open the debug panel
   - Monitor all API requests in real-time
   - View request/response details
   - Track errors and performance

### Key Features

#### Real-time Updates
- Auction timers update automatically
- Status changes reflect immediately
- Live auction indicators

#### Error Handling
- Comprehensive error messages
- Network error detection
- Authentication error handling
- Validation feedback

#### Data Validation
- Required field validation
- Date/time validation
- Price validation
- Confirmation dialogs for destructive actions

## Configuration

### Environment Variables
The system uses localStorage for configuration persistence:
- `adminApiConfig`: Stores API configuration
- `authToken`: Stores authentication token

### Default Configuration
```javascript
{
  baseApiUrl: 'https://localhost:7249',
  authToken: '',
  imageBaseUrl: 'https://localhost:7249'
}
```

## Error Handling

### Common Error Scenarios
1. **Network Errors**: Connection failures, timeouts
2. **Authentication Errors**: Invalid tokens, expired sessions
3. **Validation Errors**: Missing required fields, invalid data
4. **Permission Errors**: Insufficient access rights
5. **Server Errors**: Backend service failures

### Error Recovery
- Automatic token refresh attempts
- Retry mechanisms for failed requests
- User-friendly error messages
- Graceful degradation

## Performance Considerations

### Optimization Features
- Lazy loading of modal content
- Debounced search inputs
- Efficient state management
- Minimal re-renders

### API Efficiency
- Parallel API calls where possible
- Caching of frequently accessed data
- Pagination for large datasets
- Optimistic UI updates

## Security

### Authentication
- Bearer token authentication
- Automatic token refresh
- Secure token storage
- Session management

### Data Protection
- Input sanitization
- XSS prevention
- CSRF protection
- Secure API communication

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Prerequisites
- Node.js 16+
- npm or yarn
- Modern browser with ES6+ support

### Running the Application
```bash
npm install
npm run dev
```

### Building for Production
```bash
npm run build
```

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check base URL configuration
   - Verify backend server is running
   - Check CORS settings

2. **Authentication Errors**
   - Verify auth token is valid
   - Check token expiration
   - Re-login if necessary

3. **Data Not Loading**
   - Check API endpoints are available
   - Verify data format matches expected structure
   - Check browser console for errors

4. **Modal Not Opening**
   - Check for JavaScript errors
   - Verify component imports
   - Check state management

### Debug Tools
- Use the built-in debug panel
- Check browser developer tools
- Monitor network requests
- Review console logs

## Contributing

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use Tailwind CSS for styling
- Implement proper error handling

### Testing
- Test all modal interactions
- Verify API integration
- Check responsive design
- Validate error scenarios

## License

This project is part of the Əlimyandi.az platform and follows the same licensing terms.
