# Live Auction Timer - Tam İmplementasiya (Azərbaycan dilində)

## 🎯 Backend Strukturunuz (HAZIR)

### Timer Məlumat Strukturu

```csharp
public class AuctionTimerInfo
{
    public Guid AuctionId { get; set; }
    public string? CurrentCarLotNumber { get; set; }    // Aktiv lot nömrəsi
    public DateTime? LastBidTime { get; set; }          // Son bid vaxtı
    public DateTime? CarStartTime { get; set; }         // Lot başlama vaxtı
    public int TimerSeconds { get; set; }               // Ümumi müddət (30s)
    public int RemainingSeconds { get; set; }           // QALAN saniyələr ⏱️
    public bool IsExpired { get; set; }                 // Vaxt bitib?
    public string? TimeDisplay { get; set; }            // "00:17"
}
```

### HTTP Endpoint (HAZIR ✅)

```csharp
GET /api/Auction/{id}/timer
```

**Response nümunəsi**:
```json
{
  "auctionId": "0149dfcc-9eba-4792-a346-ba269e61f3d0",
  "currentCarLotNumber": "001",
  "remainingSeconds": 25,  // ← Bu əsas field!
  "timerSeconds": 30,
  "isExpired": false,
  "timeDisplay": "00:25"
}
```

---

## 🔧 Backend-də Lazım Olan: SignalR Timer Tick Events

İndi sizə **YALNIZ BU HİSSƏNİ** əlavə etmək lazımdır:

### 1. Background Service - Hər Saniyə Timer Tick

```csharp
public class AuctionTimerBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AuctionTimerBackgroundService> _logger;
    private readonly IHubContext<AuctionHub> _auctionHubContext;

    public AuctionTimerBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<AuctionTimerBackgroundService> logger,
        IHubContext<AuctionHub> auctionHubContext)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _auctionHubContext = auctionHubContext;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("⏱️ Timer Background Service başladı");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(1000, stoppingToken); // Hər saniyə

                using var scope = _serviceProvider.CreateScope();
                var auctionService = scope.ServiceProvider.GetRequiredService<IAuctionService>();

                // Bütün aktiv auksionları tap
                var liveAuctions = await auctionService.GetLiveAuctionsAsync();

                foreach (var auction in liveAuctions)
                {
                    // Timer məlumatını al
                    var timerInfo = await auctionService.GetAuctionTimerInfoAsync(auction.Id);

                    // Frontend-ə SignalR ilə göndər
                    await _auctionHubContext.Clients
                        .Group(auction.Id.ToString())
                        .SendAsync("TimerTick", new
                        {
                            auctionCarId = auction.CurrentCarId,
                            remainingSeconds = timerInfo.RemainingSeconds,  // ← ƏSAS!
                            timerSeconds = timerInfo.TimerSeconds,
                            currentCarLotNumber = timerInfo.CurrentCarLotNumber,
                            isExpired = timerInfo.IsExpired,
                            timeDisplay = timerInfo.TimeDisplay,
                            timestamp = DateTime.UtcNow
                        }, stoppingToken);

                    _logger.LogDebug("⏰ Timer Tick: Auction {AuctionId}, Remaining: {Seconds}s",
                        auction.Id, timerInfo.RemainingSeconds);

                    // Əgər vaxt bitibsə
                    if (timerInfo.IsExpired && !string.IsNullOrEmpty(timerInfo.CurrentCarLotNumber))
                    {
                        _logger.LogInformation("⏰ Timer expired for lot {LotNumber} in auction {AuctionId}",
                            timerInfo.CurrentCarLotNumber, auction.Id);

                        // Növbəti maşına keç
                        await auctionService.MoveToNextCarAsync(auction.Id);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Timer service xətası");
            }
        }

        _logger.LogInformation("⏱️ Timer Background Service dayandı");
    }
}
```

### 2. Program.cs-də Service-i əlavə et

```csharp
// Program.cs və ya Startup.cs
builder.Services.AddHostedService<AuctionTimerBackgroundService>();
```

### 3. Timer Reset - Bid Zamanı

```csharp
// BidService.cs - Bid yerləşdirildikdə
public async Task<BidGetDto> PlaceLiveBidAsync(PlaceLiveBidRequest request)
{
    // ... bid logic ...

    // Timer-i sıfırla (məsələn 10 saniyəyə)
    auction.LastBidTime = DateTime.UtcNow;
    await _context.SaveChangesAsync();

    // Yeni timer məlumatını al
    var timerInfo = await GetAuctionTimerInfoAsync(auction.Id);

    // Frontend-ə bildir
    await _auctionHubContext.Clients
        .Group(auction.Id.ToString())
        .SendAsync("AuctionTimerReset", new
        {
            auctionCarId = request.AuctionCarId,
            newTimerSeconds = timerInfo.RemainingSeconds,
            remainingSeconds = timerInfo.RemainingSeconds,
            reason = "BidPlaced",
            timestamp = DateTime.UtcNow
        });

    return bidDto;
}
```

---

## ✅ Frontend (ARTIQ HAZIR!)

Frontend artıq sizin backend strukturunuzu tam dəstəkləyir:

### 1. Timer Endpoint-dən Oxuyur

```typescript
// LiveAuctionPage.tsx - İstifadəçi qoşulduqda
const timerInfo = await apiClient.getAuctionTimer(auctionId);

// Backend-dən gələn məlumat:
// {
//   remainingSeconds: 25,  ← Frontend bunu istifadə edir
//   timerSeconds: 30,
//   isExpired: false,
//   currentCarLotNumber: "001"
// }
```

### 2. SignalR Timer Tick Qəbul Edir

```typescript
// LiveAuctionPage.tsx - Hər saniyə
onTimerTick: (data) => {
  // Backend-dən gələn data:
  // {
  //   remainingSeconds: 24,  ← ƏSAS field
  //   timerSeconds: 30,
  //   currentCarLotNumber: "001"
  // }
  
  setState({ timerSeconds: data.remainingSeconds });
}
```

### 3. Timer-i Ekranda Göstərir

```typescript
// UI-da göstərilir:
<div>{formatTime(state.timerSeconds)}</div>
// Məs: "00:25" → "00:24" → "00:23" ...
```

---

## 🧪 Test Etmək Üçün

### Test 1: HTTP Endpoint

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://localhost:7249/api/Auction/{auctionId}/timer
```

**Gözlənilən nəticə** (Auksiyon aktiv ikən):
```json
{
  "remainingSeconds": 25,
  "timerSeconds": 30,
  "isExpired": false,
  "currentCarLotNumber": "001"
}
```

### Test 2: Browser Console

Saytı aç və console-da bax:

```javascript
// Hər saniyə görməlisən:
⏰ [REAL-TIME] Timer Tick Event Received: {
  remainingSeconds: 25,
  timerSeconds: 30,
  currentCarLotNumber: "001"
}
⏱️ Updating timer: 26s → 25s
⏱️ Updating timer: 25s → 24s
⏱️ Updating timer: 24s → 23s
```

### Test 3: WebSocket Messages

1. DevTools → Network → WS
2. Click on `auctionHub` connection
3. Messages tab-da görməlisən:

```json
{
  "type": 1,
  "target": "TimerTick",
  "arguments": [{
    "remainingSeconds": 25,
    "timerSeconds": 30
  }]
}
```

---

## 🎯 Nə İş Görür?

### Backend:
1. ✅ HTTP endpoint - Timer məlumatını qaytarır
2. ⏳ **Background Service lazımdır** - Hər saniyə `TimerTick` göndərməlidir
3. ⏳ **Bid zamanı reset** - `AuctionTimerReset` göndərməlidir

### Frontend:
1. ✅ HTTP endpoint-dən ilkin timer alır
2. ✅ SignalR-dan hər saniyə yeniləmə alır
3. ✅ Timer-i ekranda göstərir
4. ✅ Reconnection zamanı yenidən sync edir

---

## ⚠️ İndi Lazım Olan

Backend-də **yalnız bu 2 şeyi əlavə et**:

### 1. Background Service (yuxarıdakı kodu əlavə et)

```csharp
// AuctionTimerBackgroundService.cs - yeni fayl yarat
// Yuxarıdakı kodu copy et
```

### 2. Program.cs-də register et

```csharp
builder.Services.AddHostedService<AuctionTimerBackgroundService>();
```

**Bu qədər!** Frontend artıq hazırdır və gözləyir! 🚀

---

## 📊 Nümunə Flow

### İstifadəçi auksionu açır:

```
1. Frontend: GET /api/Auction/{id}/timer
   Backend: { remainingSeconds: 30, ... }
   Frontend: Timer = 30s ✅

2. Frontend: SignalR-a qoşulur
   Frontend: JoinAuction(auctionId) göndərir
   Backend: İstifadəçini qrupa əlavə edir ✅

3. Background Service (hər saniyə):
   Backend: TimerTick event göndərir { remainingSeconds: 29 }
   Frontend: Timer = 29s ✅
   
   Backend: TimerTick event göndərir { remainingSeconds: 28 }
   Frontend: Timer = 28s ✅
   
   Backend: TimerTick event göndərir { remainingSeconds: 27 }
   Frontend: Timer = 27s ✅
```

### Kimsə bid verir:

```
1. Frontend: placeLiveBid(amount)
2. Backend: Bid-i qeyd edir
3. Backend: LastBidTime = indi
4. Backend: AuctionTimerReset event { newTimerSeconds: 10 }
5. Frontend: Timer = 10s-ə reset olur ✅
6. Background Service: Yenidən 9, 8, 7, 6... göndərir
```

---

## 🐛 Problem Olsa

### Problem: Timer işləmir

**Yoxla**:
```bash
# 1. HTTP endpoint işləyir?
curl https://localhost:7249/api/Auction/{id}/timer

# 2. Background service işləyir?
# Backend logs-da görməlisən: "⏰ Timer Tick: ..."

# 3. SignalR-a qoşulub?
# Browser console-da görməlisən: "✅ Joined auction group"
```

### Problem: Timer 0-da qalır

**Səbəb**: Auksiyon aktiv deyil

**Həll**: 
- Backend-də `CurrentCarLotNumber` null olmamalıdır
- `RemainingSeconds > 0` olmalıdır
- `IsExpired = false` olmalıdır

---

## 📝 Xülasə

### ✅ Hazır olanlar:
- HTTP endpoint (`/api/Auction/{id}/timer`)
- Frontend timer logic
- SignalR qoşulma
- State management
- UI display

### ⏳ Əlavə edilməli:
- **Background Service** (TimerTick events göndərir)
- **Timer Reset** (Bid zamanı)

Background Service əlavə edəndən sonra **hər şey işləyəcək!** 🎉

---

## Suallar?

Əgər hələ də işləmirsə, console-dan bu məlumatları göndər:

1. Browser console output (5-10 sətir)
2. Backend logs (Timer service logs)
3. Network → WS → Messages screenshot

Bunlarla problemi tez tapacağam! 🔍

