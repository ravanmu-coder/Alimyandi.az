# Join Auction Components

This directory contains all the components for the Join Auction feature, which allows users to participate in live auctions with real-time updates.

## Components

### Core Components

#### `AuctionJoinPage`
The main page component that orchestrates the entire auction experience.

**Features:**
- Real-time SignalR connection for live updates
- Main carousel for vehicle images/videos
- Lot information display
- Bid panel with validation
- Upcoming lots list
- Location modal
- Watchlist integration

**Usage:**
```tsx
// Route: /auctions/:auctionId/join
<AuctionJoinPage />
```

#### `MainCarousel`
Displays vehicle images and videos with navigation controls.

**Props:**
- `images: string[]` - Array of image URLs
- `videos?: string[]` - Array of video URLs
- `autoPlay?: boolean` - Enable auto-play
- `autoPlayInterval?: number` - Auto-play interval in ms

**Features:**
- Thumbnail navigation
- Play/pause controls
- Video support
- Responsive design

#### `LotInfoCard`
Displays detailed vehicle information in a structured format.

**Props:**
- `lotNumber: string` - Lot number
- `itemNumber: number` - Item number
- `vin: string` - Vehicle VIN
- `odometer: number` - Mileage
- `damageType: string` - Damage description
- `estimatedValue: number` - Estimated value
- `titleType: string` - Title status
- `keysStatus: string` - Keys availability
- Plus additional vehicle details

**Features:**
- Color-coded status badges
- Formatted numbers and prices
- Responsive grid layout

#### `BidPanel`
Handles bid placement with validation and real-time updates.

**Props:**
- `auctionCarId: string` - Current lot ID
- `currentPrice: number` - Current highest bid
- `minBidIncrement: number` - Minimum bid increment
- `isActive: boolean` - Auction status
- `isReserveMet: boolean` - Reserve status
- `reservePrice?: number` - Reserve price
- `bidCount: number` - Number of bids
- `lastBidTime?: string` - Last bid timestamp
- `onBidPlaced?: (bid) => void` - Bid success callback

**Features:**
- Bid amount validation
- Increment/decrement controls
- Proxy bid option
- Authentication checks
- Real-time price updates

#### `UpcomingList`
Shows upcoming lots in a scrollable list.

**Props:**
- `items: AuctionCarListItem[]` - List of upcoming lots
- `currentItemId?: string` - Currently selected lot
- `onItemClick: (item) => void` - Item selection callback

**Features:**
- Live status indicators
- Thumbnail previews
- Bid count and price display
- Reserve status badges

### UI Components

#### `WatchButton`
Adds/removes items from watchlist with visual feedback.

**Props:**
- `auctionCarId: string` - Vehicle ID
- `size?: 'sm' | 'md' | 'lg'` - Button size
- `variant?: 'default' | 'outline' | 'ghost'` - Button style

**Features:**
- Authentication checks
- Success/error toasts
- Visual state changes
- API integration

#### `LocationModal`
Displays auction location details in a modal.

**Props:**
- `isOpen: boolean` - Modal visibility
- `onClose: () => void` - Close callback
- `location: LocationDetails | null` - Location data

**Features:**
- Contact information
- Map integration
- Hours display
- Responsive design

#### `ToastProvider`
Manages toast notifications throughout the app.

**Features:**
- Multiple toast types (success, error, info, warning)
- Auto-dismiss timers
- Animation effects
- Accessibility support

#### `LiveIndicator`
Shows live/offline status with visual indicators.

**Props:**
- `isLive: boolean` - Live status
- `size?: 'sm' | 'md' | 'lg'` - Indicator size
- `showText?: boolean` - Show text label

### Hooks

#### `useSignalR`
Manages SignalR connection for real-time updates.

**Features:**
- Automatic reconnection
- Event handling
- Connection state management
- Authentication token passing

**Events:**
- `onPriceUpdated` - Price changes
- `onBidPlaced` - New bids
- `onCarMoved` - Lot changes
- `onTimerTick` - Countdown updates
- `onAuctionStarted/Stopped` - Auction status

## API Integration

### Endpoints Used

- `GET /api/auctions/{auctionId}` - Auction details
- `GET /api/auctions/{auctionId}/cars` - Auction cars list
- `GET /api/auctioncars/{auctionCarId}` - Car details
- `POST /api/bids` - Place bid
- `POST /api/watchlist` - Add to watchlist
- `GET /api/locations/{locationId}` - Location details

### SignalR Hubs

- `/auctionHub` - Auction events
- `/bidHub` - Bid events

## Styling

All components use Tailwind CSS with:
- Responsive design
- Dark theme support
- Smooth animations
- Accessibility features
- Premium visual effects

## Testing

- Jest unit tests for core logic
- React Testing Library for component testing
- Storybook stories for visual testing
- Accessibility testing

## Usage Example

```tsx
import { AuctionJoinPage } from './pages/AuctionJoinPage';

// In your router
<Route path="/auctions/:auctionId/join" element={<AuctionJoinPage />} />
```

The page will automatically:
1. Load auction data
2. Connect to SignalR
3. Display current lot
4. Enable real-time updates
5. Handle user interactions
