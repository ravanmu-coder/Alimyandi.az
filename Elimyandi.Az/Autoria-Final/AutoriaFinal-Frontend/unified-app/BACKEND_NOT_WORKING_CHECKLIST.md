# Backend Not Broadcasting - Checklist

## 🚨 Symptoms You're Seeing

1. ✅ Timer shows `0:30` (initial value loaded)
2. ❌ Timer doesn't count down (frozen)
3. ❌ Can't place bids (disabled)

## 🎯 Root Cause

**Backend is NOT broadcasting `TimerTick` events every second!**

---

## ✅ Quick Backend Check

### Check 1: Is Background Service Running?

In your backend logs, you should see **EVERY SECOND**:

```
⏰ Timer Tick: Auction {AuctionId}, Remaining: 29s
⏰ Timer Tick: Auction {AuctionId}, Remaining: 28s
⏰ Timer Tick: Auction {AuctionId}, Remaining: 27s
```

**If you DON'T see this** → Background Service is NOT running!

### Check 2: Do You Have Background Service Code?

**File**: `AuctionTimerBackgroundService.cs`

```csharp
public class AuctionTimerBackgroundService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("⏱️ Timer service started");
        
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(1000, stoppingToken); // EVERY SECOND
            
            // Get live auctions
            var liveAuctions = await _auctionService.GetLiveAuctions();
            
            foreach (var auction in liveAuctions)
            {
                var timerInfo = await _auctionService.GetAuctionTimerInfoAsync(auction.Id);
                
                // SEND TO FRONTEND
                await _hubContext.Clients
                    .Group(auction.Id.ToString())
                    .SendAsync("TimerTick", new
                    {
                        remainingSeconds = timerInfo.RemainingSeconds,
                        timerSeconds = timerInfo.TimerSeconds,
                        auctionCarId = auction.CurrentCarId
                    });
                    
                _logger.LogInformation("⏰ Timer Tick: {AuctionId}, {Remaining}s",
                    auction.Id, timerInfo.RemainingSeconds);
            }
        }
    }
}
```

### Check 3: Is Service Registered?

**File**: `Program.cs`

```csharp
// Add this line:
builder.Services.AddHostedService<AuctionTimerBackgroundService>();
```

---

## 🧪 Frontend Diagnostic

### Open Browser Console and Check:

#### 1. Are Timer Tick Events Arriving?

You should see **EVERY SECOND**:

```
🎯 ========================================
⏰ [REAL-TIME] Timer Tick Event Received!
📊 Event Data: { remainingSeconds: 29, ... }
🎯 ========================================
```

**If you DON'T see this** → Backend is NOT sending events!

#### 2. Check WebSocket Messages

1. Open DevTools → **Network** tab
2. Filter by **WS**
3. Click on `auctionHub` connection
4. Go to **Messages** tab
5. You should see messages **every second**:

```json
{
  "type": 1,
  "target": "TimerTick",
  "arguments": [{
    "remainingSeconds": 29
  }]
}
```

**If you DON'T see messages** → Backend NOT broadcasting!

#### 3. Try to Bid

Click a bid button and check console:

```
🎯 ========== BID ATTEMPT ==========
📊 Current State: {
  isLive: false,           ← Should be TRUE!
  isActive: false,         ← Should be TRUE!
  isConnected: true,
  timerSeconds: 30
}
```

**If `isLive: false`** → Auction not started on backend!

---

## 🔧 How to Fix

### Option 1: Add Background Service (Recommended)

**Create file**: `Services/AuctionTimerBackgroundService.cs`

```csharp
using Microsoft.AspNetCore.SignalR;

public class AuctionTimerBackgroundService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly IHubContext<AuctionHub> _hubContext;
    private readonly ILogger<AuctionTimerBackgroundService> _logger;

    public AuctionTimerBackgroundService(
        IServiceProvider services,
        IHubContext<AuctionHub> hubContext,
        ILogger<AuctionTimerBackgroundService> logger)
    {
        _services = services;
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("⏱️ Timer Background Service Started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(1000, stoppingToken); // Every second

                using var scope = _services.CreateScope();
                var auctionService = scope.ServiceProvider
                    .GetRequiredService<IAuctionService>();

                // Get all live auctions
                var liveAuctions = await auctionService.GetLiveAuctionsAsync();

                foreach (var auction in liveAuctions)
                {
                    // Get timer info
                    var timerInfo = await auctionService
                        .GetAuctionTimerInfoAsync(auction.Id);

                    // Broadcast to frontend
                    await _hubContext.Clients
                        .Group(auction.Id.ToString())
                        .SendAsync("TimerTick", new
                        {
                            auctionCarId = auction.CurrentCarId,
                            remainingSeconds = timerInfo.RemainingSeconds,
                            timerSeconds = timerInfo.TimerSeconds,
                            currentCarLotNumber = timerInfo.CurrentCarLotNumber,
                            isExpired = timerInfo.IsExpired
                        }, stoppingToken);

                    _logger.LogDebug("⏰ Tick: {AuctionId} - {Remaining}s",
                        auction.Id, timerInfo.RemainingSeconds);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Timer service error");
            }
        }

        _logger.LogInformation("⏱️ Timer Background Service Stopped");
    }
}
```

**Register in Program.cs**:

```csharp
builder.Services.AddHostedService<AuctionTimerBackgroundService>();
```

### Option 2: Manual Broadcast in AuctionService

If you can't use Background Service, broadcast manually:

```csharp
// In your AuctionService - call this method every second somehow
public async Task BroadcastTimerTickAsync(Guid auctionId)
{
    var timerInfo = await GetAuctionTimerInfoAsync(auctionId);
    
    await _hubContext.Clients
        .Group(auctionId.ToString())
        .SendAsync("TimerTick", new
        {
            remainingSeconds = timerInfo.RemainingSeconds,
            timerSeconds = timerInfo.TimerSeconds
        });
}
```

---

## 🎯 What Should Happen

### When Everything Works:

**Backend logs (every second)**:
```
⏰ Timer Tick: Auction abc-123, Remaining: 29s
⏰ Timer Tick: Auction abc-123, Remaining: 28s
⏰ Timer Tick: Auction abc-123, Remaining: 27s
```

**Frontend console (every second)**:
```
🎯 ========================================
⏰ [REAL-TIME] Timer Tick Event Received!
📊 Event Data: { remainingSeconds: 29 }
🎯 ========================================
⏱️ Updating timer: 30s → 29s
```

**UI**:
- Timer counts down: `0:29` → `0:28` → `0:27`
- Bid buttons are enabled
- Can place bids

---

## 🐛 Still Not Working?

### 1. Check Auction State

Make sure auction is properly started:

```csharp
// Auction must be:
auction.IsLive = true;                    // ✅
auction.CurrentCarId != null;             // ✅
auction.CurrentCarLotNumber != null;      // ✅
auction.RemainingSeconds > 0;             // ✅
```

### 2. Check SignalR Groups

Users must join the auction group:

```csharp
// In AuctionHub
public async Task JoinAuction(string auctionId)
{
    await Groups.AddToGroupAsync(Context.ConnectionId, auctionId);
    _logger.LogInformation("✅ User joined auction: {AuctionId}", auctionId);
}
```

### 3. Test Backend Manually

Test SignalR from backend:

```csharp
// Add a test endpoint
[HttpPost("test/broadcast/{auctionId}")]
public async Task<IActionResult> TestBroadcast(Guid auctionId)
{
    await _hubContext.Clients
        .Group(auctionId.ToString())
        .SendAsync("TimerTick", new
        {
            remainingSeconds = 25,
            timerSeconds = 30
        });
        
    return Ok("Broadcast sent");
}
```

Then call it:
```bash
POST https://localhost:7249/api/Auction/test/broadcast/{auctionId}
```

If frontend receives this, SignalR works! Problem is the timer service.

---

## 📋 Checklist

Before timer will work, you need:

- [ ] Background Service created (`AuctionTimerBackgroundService.cs`)
- [ ] Service registered in `Program.cs`
- [ ] Service is running (check logs)
- [ ] Auction has `IsLive = true`
- [ ] Auction has active car (`CurrentCarId` not null)
- [ ] Frontend connected to SignalR (green indicator)
- [ ] Frontend joined auction group (see "✅ Joined auction group" in console)
- [ ] WebSocket shows messages in DevTools Network tab

**Once all checked**, timer will work! 🎯

---

## 🆘 Send Me This Info

If still not working, send:

1. **Backend logs** (last 20 lines)
2. **Frontend console** (copy-paste)
3. **Network → WS → Messages** (screenshot)
4. **Bid attempt output** (the diagnostic I added)

This will tell me exactly what's missing!

