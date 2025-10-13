# Join Auction (Live Bidding) - Test Plan

## Overview
This document outlines the comprehensive test plan for the Join Auction page with live bidding functionality, including SignalR BidHub integration, real-time updates, and all UI components.

## Test Environment Setup

### Prerequisites
1. Backend server running on `https://localhost:7249`
2. SignalR BidHub properly configured
3. Car REST endpoints accessible
4. Authentication token available
5. At least one active auction with vehicles

### Test Data Requirements
- Active auction with status "Live", "Active", or "Started"
- Auction cars with proper lot numbers
- Car photos/images available
- Location data for the auction
- User authentication token

## Manual Test Cases

### 1. Auction Loading and Display

#### Test Case 1.1: Successful Auction Load
**Steps:**
1. Navigate to `/auction-join` page
2. Verify auction loads successfully
3. Check auction overview displays correctly

**Expected Results:**
- Auction name displays in header
- Location information shows (if available)
- Live/Scheduled status indicator works
- Connection status shows "Connected"
- No error messages appear

#### Test Case 1.2: No Active Auction
**Steps:**
1. Ensure no active auctions exist
2. Navigate to `/auction-join` page

**Expected Results:**
- "No active auction" message displays
- Debug information shows in development mode
- Refresh button available
- No crashes or errors

#### Test Case 1.3: API Connection Error
**Steps:**
1. Stop backend server
2. Navigate to `/auction-join` page

**Expected Results:**
- Error message displays with troubleshooting steps
- Retry button available
- No crashes

### 2. SignalR BidHub Integration

#### Test Case 2.1: Hub Connection
**Steps:**
1. Open auction page with active auction
2. Check browser console for connection logs
3. Verify connection status indicator

**Expected Results:**
- "BidHub connected successfully" in console
- Connection status shows "Connected"
- Green connection indicator

#### Test Case 2.2: Hub Disconnection
**Steps:**
1. Disconnect network or stop SignalR hub
2. Observe connection status changes

**Expected Results:**
- Connection status shows "Disconnected"
- Red connection indicator
- Toast notification about connection loss
- Auto-reconnection attempts

#### Test Case 2.3: Join Auction Car
**Steps:**
1. Select a vehicle/lot
2. Check console for join logs

**Expected Results:**
- "Joined auction car" message in console
- Bid stats populate
- Current price updates

### 3. Live Bidding Functionality

#### Test Case 3.1: Place Live Bid
**Steps:**
1. Enter bid amount in live bidding panel
2. Click "Place Live Bid"
3. Verify bid submission

**Expected Results:**
- Bid submits successfully
- Success toast notification
- Current price updates
- Bid history updates
- Bid count increments

#### Test Case 3.2: Place Pre-Bid
**Steps:**
1. Switch to "Pre-Bid" tab
2. Enter bid amount
3. Click "Place Pre-Bid"

**Expected Results:**
- Pre-bid submits successfully
- Success toast notification
- Pre-bid appears in bid history
- Orange pre-bid indicator

#### Test Case 3.3: Place Proxy Bid
**Steps:**
1. Switch to "Proxy Bid" tab
2. Enter start and max amounts
3. Click "Place Proxy Bid"

**Expected Results:**
- Proxy bid submits successfully
- Success toast notification
- Purple proxy bid indicator
- Cancel proxy bid button appears

#### Test Case 3.4: Bid Validation
**Steps:**
1. Enter bid amount below minimum
2. Try to submit bid

**Expected Results:**
- Validation error message displays
- Bid submission blocked
- Suggested amount shown

#### Test Case 3.5: Quick Bid Buttons
**Steps:**
1. Click on quick bid amounts
2. Verify amounts populate correctly

**Expected Results:**
- Bid amount field updates
- Amounts are valid for submission

### 4. Real-Time Updates

#### Test Case 4.1: New Live Bid Broadcast
**Steps:**
1. Open auction in two different browsers/tabs
2. Place bid in one browser
3. Observe updates in second browser

**Expected Results:**
- Second browser receives real-time update
- Current price updates immediately
- Toast notification appears
- Bid history updates

#### Test Case 4.2: Highest Bid Update
**Steps:**
1. Place multiple bids from different users
2. Observe highest bid updates

**Expected Results:**
- Highest bid updates in real-time
- Bidder information updates
- Visual indicators show highest bid

#### Test Case 4.3: Timer Reset
**Steps:**
1. Trigger timer reset (admin action)
2. Observe timer updates

**Expected Results:**
- Timer resets to new value
- Toast notification about reset
- Countdown updates correctly

### 5. Vehicle Carousel

#### Test Case 5.1: Image Loading
**Steps:**
1. Select vehicle with photos
2. Observe image loading

**Expected Results:**
- Images load successfully
- Thumbnails display correctly
- Loading indicators work
- Error handling for failed images

#### Test Case 5.2: Image Navigation
**Steps:**
1. Use navigation arrows
2. Click on thumbnails
3. Use play/pause controls

**Expected Results:**
- Navigation works smoothly
- Thumbnail selection works
- Auto-play controls function
- Image counter updates

#### Test Case 5.3: No Images Available
**Steps:**
1. Select vehicle without photos
2. Observe fallback behavior

**Expected Results:**
- Placeholder icon displays
- "No photos available" message
- No crashes or errors

### 6. Bid History

#### Test Case 6.1: Bid History Display
**Steps:**
1. Place several bids
2. Check bid history panel

**Expected Results:**
- All bids display in chronological order
- Bid types clearly marked (Live/Pre/Proxy)
- Bidder names and amounts correct
- Time stamps accurate

#### Test Case 6.2: My Bids Highlighting
**Steps:**
1. Place bids as logged-in user
2. Check "Your Bids" section

**Expected Results:**
- User's bids highlighted
- Bid count accurate
- Highest bid indicator works

#### Test Case 6.3: Auto-Refresh
**Steps:**
1. Enable auto-refresh
2. Place bids from another user
3. Observe updates

**Expected Results:**
- Bid history updates automatically
- Auto-refresh indicator shows status
- Manual refresh also works

### 7. Auction Overview

#### Test Case 7.1: Statistics Display
**Steps:**
1. Load auction with vehicles and bids
2. Check overview statistics

**Expected Results:**
- Total vehicles count correct
- Total revenue accurate
- Success rate calculated correctly
- Average price displays

#### Test Case 7.2: Location Information
**Steps:**
1. Load auction with location
2. Check location display

**Expected Results:**
- Location name displays correctly
- City and name format: "City - Name"
- Location details expandable
- Loading states work

#### Test Case 7.3: Time Remaining
**Steps:**
1. Check countdown timer
2. Wait for time updates

**Expected Results:**
- Timer counts down correctly
- Format: HH:MM:SS
- Updates every second
- Shows "Ended" when time expires

### 8. Add Vehicle Modal

#### Test Case 8.1: Vehicle Selection
**Steps:**
1. Click "Add Vehicle" button
2. Select vehicles from list
3. Configure pricing

**Expected Results:**
- Modal opens successfully
- Available vehicles list loads
- Vehicle selection works
- Pricing auto-calculates

#### Test Case 8.2: Bulk Operations
**Steps:**
1. Open bulk settings
2. Configure multipliers and deltas
3. Apply to selected vehicles

**Expected Results:**
- Bulk settings panel opens
- Settings apply correctly
- Pricing updates for all selected
- Lot numbers generate automatically

#### Test Case 8.3: Vehicle Submission
**Steps:**
1. Select multiple vehicles
2. Click "Add Vehicles"
3. Verify submission

**Expected Results:**
- Vehicles added successfully
- Success toast notification
- Modal closes
- Auction refreshes with new vehicles

### 9. Error Handling and Offline Support

#### Test Case 9.1: Network Disconnection
**Steps:**
1. Disconnect network during active bidding
2. Attempt to place bid
3. Reconnect network

**Expected Results:**
- Connection status updates
- Bid attempts show error messages
- Auto-reconnection attempts
- Functionality resumes when reconnected

#### Test Case 9.2: API Errors
**Steps:**
1. Trigger various API errors (404, 500, etc.)
2. Observe error handling

**Expected Results:**
- User-friendly error messages
- No crashes or white screens
- Retry options available
- Debug information in console

#### Test Case 9.3: Invalid Data Handling
**Steps:**
1. Submit invalid bid amounts
2. Test with malformed data

**Expected Results:**
- Validation prevents invalid submissions
- Clear error messages
- Form state remains stable
- No data corruption

### 10. Performance and Responsiveness

#### Test Case 10.1: Large Dataset
**Steps:**
1. Load auction with many vehicles (50+)
2. Test scrolling and interactions

**Expected Results:**
- Smooth scrolling performance
- Images lazy-load correctly
- No memory leaks
- Responsive interactions

#### Test Case 10.2: Mobile Responsiveness
**Steps:**
1. Test on mobile devices
2. Check responsive layout

**Expected Results:**
- Layout adapts to screen size
- Touch interactions work
- Text remains readable
- Buttons accessible

#### Test Case 10.3: Concurrent Users
**Steps:**
1. Open multiple browser instances
2. Place bids simultaneously

**Expected Results:**
- All instances receive updates
- No conflicts or data loss
- Performance remains stable
- Real-time updates work

## Automated Test Scenarios

### Unit Tests
- BidHub hook functionality
- Component rendering
- State management
- Utility functions

### Integration Tests
- API client methods
- SignalR connection handling
- Real-time event processing
- Error boundary behavior

### End-to-End Tests
- Complete bidding flow
- Multi-user scenarios
- Error recovery
- Performance benchmarks

## Performance Benchmarks

### Response Times
- Auction load: < 2 seconds
- Bid submission: < 500ms
- Real-time updates: < 100ms
- Image loading: < 3 seconds

### Resource Usage
- Memory usage: < 100MB
- CPU usage: < 10% during normal operation
- Network requests: Minimized with caching

## Security Considerations

### Authentication
- Token validation
- Secure SignalR connection
- User session management

### Data Validation
- Input sanitization
- Bid amount validation
- SQL injection prevention

### Authorization
- Auction access control
- Bid placement permissions
- Admin function restrictions

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Features
- WebSocket support
- ES6+ features
- CSS Grid/Flexbox
- Intersection Observer

## Troubleshooting Guide

### Common Issues
1. **Connection Failed**: Check backend server and SignalR hub
2. **Images Not Loading**: Verify image URLs and CORS settings
3. **Bids Not Updating**: Check SignalR connection and event handlers
4. **Performance Issues**: Monitor network requests and memory usage

### Debug Tools
- Browser console logs
- Network tab monitoring
- SignalR connection state
- Component state inspection

## Success Criteria

### Functional Requirements
- ✅ All bid types work correctly
- ✅ Real-time updates function properly
- ✅ Error handling prevents crashes
- ✅ Mobile responsiveness maintained

### Performance Requirements
- ✅ Page loads within 2 seconds
- ✅ Bid submission under 500ms
- ✅ Real-time updates under 100ms
- ✅ Memory usage under 100MB

### User Experience Requirements
- ✅ Intuitive interface design
- ✅ Clear error messages
- ✅ Responsive interactions
- ✅ Accessibility compliance

## Test Execution Checklist

- [ ] All manual test cases executed
- [ ] Performance benchmarks met
- [ ] Error scenarios tested
- [ ] Mobile devices tested
- [ ] Multiple browsers tested
- [ ] Security tests completed
- [ ] Documentation updated
- [ ] Issues logged and resolved

## Conclusion

This comprehensive test plan ensures the Join Auction page with live bidding functionality works correctly across all scenarios, providing a robust and user-friendly experience for auction participants.
