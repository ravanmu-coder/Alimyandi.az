# Live Auction Timer Synchronization Fix

## Problem Description

When users joined a live auction, the timer was not synchronized properly across multiple users, and SignalR connections were being dropped. The issues included:

1. **Timer Not Syncing**: Each user's timer ran independently with local countdown logic
2. **Join Mid-Auction**: Users joining mid-auction didn't get the current server timer state
3. **Disconnections**: SignalR connections were being lost when joining auctions
4. **No Timer Updates**: Server timer tick events weren't properly updating the UI

## Root Causes

### 1. Local Timer Countdown
The `LiveAuctionTimer` component maintained its own internal countdown state that ran independently of the server. When the server sent timer updates, they would be overwritten by the local countdown.

### 2. Insufficient Timer Sync on Join
When users joined an auction mid-way, the system didn't properly fetch and sync the current server timer state. The `remainingTimeSeconds` field wasn't consistently available from the API.

### 3. No Reconnection Sync
When SignalR reconnected after a disconnection, the timer state wasn't re-synchronized with the server.

## Solutions Implemented

### 1. Server-Authoritative Timer Component
**File**: `unified-app/src/components/LiveAuctionTimer.tsx`

**Changes**:
- Removed local countdown logic completely
- Component now displays `timerSeconds` prop directly (server-authoritative)
- Timer only updates when prop changes (from server events)
- Added ref tracking to detect resets and expirations

**Before**:
```typescript
const [currentSeconds, setCurrentSeconds] = useState(timerSeconds);

// Local countdown interval
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentSeconds(prev => prev - 1);
  }, 1000);
  return () => clearInterval(interval);
}, [currentSeconds]);
```

**After**:
```typescript
// Use server-authoritative time directly - no local countdown
const currentSeconds = timerSeconds;
const prevSecondsRef = useRef(timerSeconds);

// Only detect changes from server
useEffect(() => {
  if (timerSeconds > prevSecondsRef.current) {
    // Timer was reset by server
    setLastResetTime(Date.now());
  }
  prevSecondsRef.current = timerSeconds;
}, [timerSeconds]);
```

### 2. Enhanced Timer Sync on Join
**File**: `unified-app/src/pages/LiveAuctionPage.tsx`

**Changes**:
- Added dedicated `getAuctionTimer()` API call when joining
- Fetches both auction status AND timer info in parallel
- Uses timer info from dedicated endpoint as primary source
- Falls back to snapshot data if timer endpoint unavailable

**Implementation**:
```typescript
// Get both auction status and timer info for perfect sync
const [auctionStatus, timerInfo] = await Promise.all([
  apiClient.getAuctionStatus(auctionId),
  apiClient.getAuctionTimer(auctionId).catch(() => null)
]);

// Use timer info from dedicated endpoint for most accurate sync
const serverTimer = timerInfo?.timerSeconds ?? 
                  (activeCarSnapshot as any).remainingTimeSeconds ?? 
                  (activeCarSnapshot as any).secondsRemaining ?? 0;

const isAuctionLive = timerInfo?.isLive ?? activeCarSnapshot.isActive;
```

### 3. Reconnection Timer Re-sync
**File**: `unified-app/src/pages/LiveAuctionPage.tsx`

**Changes**:
- Added timer re-sync logic in `onConnectionStateChanged` event
- When reconnected, immediately fetch current timer state
- Updates local state with server's current time

**Implementation**:
```typescript
onConnectionStateChanged: async (state, error) => {
  // When reconnected, re-sync timer state
  if (state === 'Connected' && hasJoinedGroupsRef.current && auctionId) {
    console.log('🔄 Reconnected - re-syncing timer state...');
    try {
      const timerInfo = await apiClient.getAuctionTimer(auctionId);
      if (timerInfo) {
        setState(prev => ({
          ...prev,
          timerSeconds: timerInfo.timerSeconds,
          isLive: timerInfo.isLive
        }));
        console.log(`✅ Re-synced timer: ${timerInfo.timerSeconds}s`);
      }
    } catch (err) {
      console.warn('⚠️ Failed to re-sync timer on reconnect:', err);
    }
  }
}
```

## How It Works Now

### Timer Flow

1. **User Joins Auction**:
   - Connects to SignalR (AuctionHub and BidHub)
   - Joins auction group and active car group
   - Fetches timer info from `/api/Auction/{id}/timer`
   - Sets initial timer state from server

2. **Timer Updates (Every Second)**:
   - Server sends `onTimerTick` event every second
   - Event contains `remainingSeconds` from server
   - Component receives updated `timerSeconds` prop
   - UI re-renders with new server time

3. **Timer Reset (On Bid)**:
   - Server sends `onAuctionTimerReset` event
   - Event contains `newTimerSeconds` (usually 10)
   - Component receives updated prop and displays reset time

4. **Reconnection**:
   - If disconnected and reconnected
   - System fetches current timer state
   - Syncs to server's current time
   - Continues receiving timer tick events

### SignalR Event Flow

```
User → Connect to SignalR
     → Join auction group (AuctionHub)
     → Join active car group (BidHub)
     → Fetch timer state (HTTP)
     ↓
Server sends events every second:
     → onTimerTick (remaining seconds)
     → onNewLiveBid (when bid placed)
     → onAuctionTimerReset (timer reset)
     → onCarMoved (next car)
     ↓
Component updates → UI re-renders
```

## Testing Guide

### Test 1: Multiple Users Same Timer
**Steps**:
1. Open auction in Browser A (Chrome)
2. Open same auction in Browser B (Firefox/Incognito)
3. Observe timer counting down

**Expected**:
- Both browsers show exact same time
- Timers count down in sync
- ±1 second difference acceptable (network latency)

### Test 2: Join Mid-Auction
**Steps**:
1. Start auction with Browser A
2. Wait 30 seconds for timer to count down
3. Open auction in Browser B (new user joining)

**Expected**:
- Browser B shows current server time (not reset to full time)
- Browser B timer matches Browser A timer
- Both continue counting in sync

### Test 3: Timer Reset on Bid
**Steps**:
1. Have auction running in 2 browsers
2. Place bid in Browser A
3. Observe timer in both browsers

**Expected**:
- Timer resets to 10s in BOTH browsers simultaneously
- Both browsers continue counting from 10s in sync

### Test 4: Reconnection Sync
**Steps**:
1. Open auction in Browser A
2. Simulate disconnect (open DevTools → Network → Offline)
3. Wait 5 seconds
4. Go back online

**Expected**:
- Browser shows reconnecting state
- On reconnect, timer syncs to current server time
- Timer continues counting from correct position
- No jump to wrong time

### Test 5: Timer Expiration
**Steps**:
1. Open auction in 2 browsers
2. Wait for timer to reach 0
3. Observe what happens

**Expected**:
- Both browsers show timer reaching 0 at same time
- Auction moves to next car (if available)
- Both browsers load next car with new timer

## Console Logs to Look For

### Successful Join
```
🔌 Connection ready, joining SignalR groups...
✅ Joined auction group: {auctionId}
📊 Auction Status: {...}
⏱️ Timer Info: { timerSeconds: 45, isLive: true, ... }
✅ Joined active car group: {carId}
✅ Synced - Timer: 45s, Live: true
```

### Timer Updates
```
⏰ [REAL-TIME] Timer Tick: 44s
⏰ [REAL-TIME] Timer Tick: 43s
⏰ [REAL-TIME] Timer Tick: 42s
```

### Timer Reset
```
🔄 [REAL-TIME] Timer Reset: 10s
Timer reset!
```

### Reconnection
```
🔌 Connection State Changed: { state: 'Reconnecting', ... }
🔌 Connection State Changed: { state: 'Connected', ... }
🔄 Reconnected - re-syncing timer state...
✅ Re-synced timer: 38s, Live: true
```

## API Endpoints Used

### Timer Sync
- `GET /api/Auction/{id}/timer` - Get current timer state
  - Returns: `{ auctionId, isLive, timerSeconds, currentCarLotNumber, ... }`

### Status Check
- `GET /api/auctions/{id}/status` - Get auction status
  - Returns: `{ activeCarId, allFinished }`

### Group Joining
- SignalR: `JoinGroup(auctionId)` - Join auction group
- SignalR: `JoinGroup(auctionCarId)` - Join car group

## Known Limitations

1. **Network Latency**: 
   - ±1 second difference between users is normal due to network latency
   - Server is authoritative, client display may lag slightly

2. **Timer Endpoint Availability**:
   - If `/api/Auction/{id}/timer` fails, falls back to snapshot data
   - May have less accurate timer in this case

3. **SignalR Connection Quality**:
   - Users with poor internet may experience disconnections
   - System will auto-reconnect and re-sync
   - During disconnection, timer may not update

## Troubleshooting

### Timer Not Updating
**Check**:
1. Is SignalR connected? (Check connection indicator)
2. Are you joined to groups? (Check console logs)
3. Is server sending `onTimerTick` events? (Check console)

**Fix**:
- Refresh page to rejoin
- Check network connectivity
- Verify backend SignalR hub is running

### Timer Out of Sync
**Check**:
1. Check console for last `onTimerTick` event timestamp
2. Compare server time in event vs displayed time
3. Check for errors in console

**Fix**:
- Refresh page to force re-sync
- Check server timer endpoint manually
- Verify no local state corruption

### Disconnections on Join
**Check**:
1. Check console for authentication errors
2. Verify authToken is valid
3. Check SignalR connection logs

**Fix**:
- Re-login to get fresh token
- Clear localStorage and re-authenticate
- Check backend SignalR configuration

## Files Modified

1. **unified-app/src/components/LiveAuctionTimer.tsx**
   - Removed local countdown logic
   - Made fully server-authoritative
   - Added useRef import

2. **unified-app/src/pages/LiveAuctionPage.tsx**
   - Enhanced group joining with timer sync
   - Added timer re-sync on reconnection
   - Moved hasJoinedGroupsRef to proper scope
   - Added parallel fetching of status and timer

## Backend Requirements

For this fix to work properly, the backend must:

1. **Send Timer Tick Events**: 
   - Broadcast `onTimerTick` event every second
   - Include `remainingSeconds` in event data

2. **Provide Timer Endpoint**:
   - `GET /api/Auction/{id}/timer` must return current timer state
   - Should include `timerSeconds`, `isLive`, and car info

3. **Send Timer Reset Events**:
   - When bid placed, broadcast `onAuctionTimerReset`
   - Include `newTimerSeconds` in event data

4. **Maintain Timer State**:
   - Server must be authoritative source of timer
   - Timer countdown happens on server, not client

## Summary

The timer synchronization is now **fully server-authoritative**. The client displays exactly what the server tells it to display, with no independent countdown logic. This ensures all users see the same time, regardless of when they join or if they reconnect.

The key principle: **Client displays, Server decides**.

