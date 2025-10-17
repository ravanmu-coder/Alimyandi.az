# Backend Requirements for Live Auction Timer

## SignalR Hub Events Required

The frontend expects these SignalR events to be broadcast from the backend:

### 1. Timer Tick Event (REQUIRED - Every Second)

**Event Name**: `TimerTick`

**Broadcast Method**: `Clients.Group(auctionId).SendAsync("TimerTick", data)`

**Frequency**: Every 1 second while auction is live

**Data Structure**:
```csharp
// C# Backend
await Clients.Group(auctionId).SendAsync("TimerTick", new
{
    auctionCarId = currentCar.Id,           // string - Current car ID
    remainingSeconds = timerSeconds,         // int - REQUIRED! Seconds remaining
    timestamp = DateTime.UtcNow              // DateTime - Optional
});
```

**JavaScript Frontend Receives**:
```javascript
{
  auctionCarId: "abc-123",
  remainingSeconds: 45,  // ← CRITICAL FIELD!
  timestamp: "2025-10-17T14:30:00Z"
}
```

**Alternative Property Names** (frontend checks these in order):
1. `remainingSeconds` (preferred)
2. `secondsRemaining`
3. `timerSeconds`

---

### 2. Timer Reset Event (When Bid Placed)

**Event Name**: `AuctionTimerReset`

**Broadcast Method**: `Clients.Group(auctionId).SendAsync("AuctionTimerReset", data)`

**When**: Whenever a bid is placed and timer resets

**Data Structure**:
```csharp
// C# Backend
await Clients.Group(auctionId).SendAsync("AuctionTimerReset", new
{
    auctionCarId = currentCar.Id,
    newTimerSeconds = 10,                    // int - Usually 10 seconds
    reason = "BidPlaced",                    // string - Optional
    timestamp = DateTime.UtcNow
});
```

**JavaScript Frontend Receives**:
```javascript
{
  auctionCarId: "abc-123",
  newTimerSeconds: 10,  // ← Timer resets to this value
  reason: "BidPlaced",
  timestamp: "2025-10-17T14:30:00Z"
}
```

---

### 3. Auction Started Event

**Event Name**: `AuctionStarted`

**Broadcast Method**: `Clients.All.SendAsync("AuctionStarted", data)`

**When**: When auctioneer starts an auction

**Data Structure**:
```csharp
// C# Backend
await Clients.All.SendAsync("AuctionStarted", new
{
    auctionId = auction.Id,
    auctionCarId = firstCar.Id,
    lotNumber = firstCar.LotNumber,
    timerSeconds = auction.TimerSeconds,     // Initial timer value
    snapshot = GetAuctionCarSnapshot(firstCar),  // Optional but recommended
    timestamp = DateTime.UtcNow
});
```

---

### 4. Car Moved Event

**Event Name**: `CarMoved`

**Broadcast Method**: `Clients.Group(auctionId).SendAsync("CarMoved", data)`

**When**: When auction moves to next car

**Data Structure**:
```csharp
// C# Backend
await Clients.Group(auctionId).SendAsync("CarMoved", new
{
    auctionId = auction.Id,
    previousCarId = oldCar.Id,
    nextCarId = newCar.Id,
    nextLot = newCar.LotNumber,
    timerSeconds = auction.TimerSeconds,     // Timer for new car
    timestamp = DateTime.UtcNow
});
```

---

## HTTP Endpoints Required

### 1. Get Auction Timer Info (REQUIRED)

**Endpoint**: `GET /api/Auction/{auctionId}/timer`

**Purpose**: Get current timer state when user joins mid-auction

**Response**:
```json
{
  "auctionId": "abc-123",
  "isLive": true,
  "timerSeconds": 45,              // ← CRITICAL! Current remaining seconds
  "currentCarLotNumber": "001",
  "currentCarStartTime": "2025-10-17T14:25:00Z"
}
```

**C# Example**:
```csharp
[HttpGet("{auctionId}/timer")]
public async Task<ActionResult<AuctionTimerInfo>> GetAuctionTimer(string auctionId)
{
    var auction = await _context.Auctions
        .Include(a => a.CurrentCar)
        .FirstOrDefaultAsync(a => a.Id == auctionId);
    
    if (auction == null)
        return NotFound();
    
    return Ok(new AuctionTimerInfo
    {
        AuctionId = auction.Id,
        IsLive = auction.IsLive,
        TimerSeconds = auction.RemainingSeconds,  // ← Calculate remaining seconds!
        CurrentCarLotNumber = auction.CurrentCar?.LotNumber,
        CurrentCarStartTime = auction.CurrentCarStartTime
    });
}
```

---

### 2. Get Auction Status

**Endpoint**: `GET /api/auctions/{auctionId}/status`

**Purpose**: Check if auction has active car

**Response**:
```json
{
  "activeCarId": "car-123",  // null if no active car
  "allFinished": false       // true if auction completed
}
```

---

## Backend Timer Implementation

### Example: Background Timer Service

```csharp
public class AuctionTimerService : BackgroundService
{
    private readonly IHubContext<AuctionHub> _hubContext;
    private readonly IAuctionRepository _auctionRepo;
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(1000, stoppingToken); // Every second
            
            var liveAuctions = await _auctionRepo.GetLiveAuctions();
            
            foreach (var auction in liveAuctions)
            {
                // Decrement timer
                auction.RemainingSeconds--;
                
                // Broadcast timer tick to all users in auction
                await _hubContext.Clients
                    .Group(auction.Id)
                    .SendAsync("TimerTick", new
                    {
                        auctionCarId = auction.CurrentCarId,
                        remainingSeconds = auction.RemainingSeconds,
                        timestamp = DateTime.UtcNow
                    }, stoppingToken);
                
                // Handle timer expiration
                if (auction.RemainingSeconds <= 0)
                {
                    await HandleTimerExpired(auction);
                }
            }
            
            await _auctionRepo.SaveChanges();
        }
    }
}
```

---

## Group Management

### Auction Group (AuctionHub)

**Join Method**:
```csharp
public async Task JoinAuction(string auctionId)
{
    await Groups.AddToGroupAsync(Context.ConnectionId, auctionId);
    
    // Optional: Send current state to joining user
    var timerInfo = await GetCurrentTimerState(auctionId);
    await Clients.Caller.SendAsync("TimerSync", timerInfo);
}
```

### Car Group (BidHub)

**Join Method**:
```csharp
public async Task JoinAuctionCar(string auctionCarId)
{
    await Groups.AddToGroupAsync(Context.ConnectionId, auctionCarId);
}
```

---

## Critical Requirements Summary

### ✅ Must Have:

1. **`TimerTick` event** broadcast **every 1 second**
2. **`remainingSeconds`** field in timer tick (integer)
3. **`GET /api/Auction/{id}/timer`** endpoint returning current timer
4. **Timer persisted on backend** (not just in memory)
5. **`AuctionTimerReset`** event when bid placed

### ⚠️ Important:

1. Timer must **count DOWN** (45 → 44 → 43 → 42...)
2. Timer must be **server-authoritative** (backend controls it)
3. Events must be sent to **SignalR groups**, not individual connections
4. Timer state must **survive backend restarts** (use database)

### 📊 Nice to Have:

1. `timestamp` in events for debugging
2. `snapshot` with full car data in `AuctionStarted`
3. Timer synchronization endpoint for late joiners
4. Configurable timer duration per auction

---

## Testing Your Backend

### Test 1: Timer Tick Events

Run this in browser console after joining auction:

```javascript
// Check if receiving timer ticks
let tickCount = 0;
const originalHandler = window.onTimerTick;
window.onTimerTick = (data) => {
  tickCount++;
  console.log(`Tick ${tickCount}: ${data.remainingSeconds}s`);
  originalHandler?.(data);
};
```

**Expected**: Should see tick count increase every second, with remainingSeconds decreasing.

### Test 2: Timer Endpoint

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://localhost:7249/api/Auction/{auctionId}/timer
```

**Expected**:
```json
{
  "auctionId": "...",
  "isLive": true,
  "timerSeconds": 45
}
```

### Test 3: WebSocket Messages

1. Open DevTools → Network → WS
2. Click on SignalR connection
3. Go to Messages tab
4. Should see `TimerTick` messages every second

---

## Common Backend Mistakes

### ❌ Mistake 1: No Timer Tick Events
**Problem**: Backend doesn't broadcast timer ticks
**Fix**: Add background service that broadcasts every second

### ❌ Mistake 2: Wrong Property Name
**Problem**: Sending `timer` instead of `remainingSeconds`
**Fix**: Use exactly `remainingSeconds` (or one of the alternatives)

### ❌ Mistake 3: Timer Counts Up
**Problem**: Sending 1, 2, 3, 4... instead of 45, 44, 43...
**Fix**: Start at duration and decrement

### ❌ Mistake 4: No Timer Endpoint
**Problem**: Frontend can't get initial timer when joining
**Fix**: Implement `GET /api/Auction/{id}/timer`

### ❌ Mistake 5: Broadcasting to Wrong Group
**Problem**: Using wrong auction ID in group name
**Fix**: Ensure group name matches exactly what frontend joins

---

## Need Help?

If timer still not working:

1. **Check backend logs** - Is timer service running?
2. **Check SignalR logs** - Are events being sent?
3. **Check Network tab** - Are messages arriving?
4. **Check console** - Is frontend receiving events?

Compare your backend implementation against this document!

