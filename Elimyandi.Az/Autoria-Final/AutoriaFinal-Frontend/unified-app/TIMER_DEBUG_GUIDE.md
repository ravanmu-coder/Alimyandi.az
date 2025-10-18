# 🔍 Timer Debug Guide - Copart Style Real-Time System

## 🎯 Məqsəd

Timer auction başladıqda 30 saniyədən başlamalı və hər saniyə 1 azalmalıdır. Bütün istifadəçilər eyni timer-i görməlidir (real-time sync).

---

## ✅ Backend Test (C# / .NET)

### 1. Backend-i Başlat:
```bash
cd Autoria-Final/AutoriaFinal/AutoriaFinal.API
dotnet run
```

### 2. Log-larda Axtarın:

**Service Başladı?**
```
✅ Auction Timer Background Service Started.
```
- ❌ Görmürsünüzsə: Background service qeydiyyatda deyil!
- ✅ Görürsünüzsə: Service işləyir

**Hər Saniyə Timer Tick?**
```
⏰ Timer Tick: Auction {...}, Lot LOT-001, Remaining: 30s, Group: auction-{...}
⏰ Timer Tick: Auction {...}, Lot LOT-001, Remaining: 29s, Group: auction-{...}
⏰ Timer Tick: Auction {...}, Lot LOT-001, Remaining: 28s, Group: auction-{...}
```
- ❌ Görmürsünüzsə: Auction başlamayıb və ya service işləmir!
- ✅ Görürsünüzsə: Backend düzgün işləyir!

**Live Bid Zamanı:**
```
💰 Live bid placed: User {...}, Amount 15000, Highest: True
✅ Timer reset to 30s by LiveBid
⏰ Timer Tick: Auction {...}, Remaining: 30s
```
- ✅ Timer 30-a reset olmalıdır

**Timer Bitdikdə:**
```
⏰ TIMER EXPIRED for Auction {...}, Lot LOT-001. Triggering auto-move...
✅ Successfully moved to the next car for Auction {...}
SignalR Event Sent: CarMoved from LOT-001 to LOT-002
```
- ✅ Avtomatik növbəti car-a keçid

### 3. Auction Başlatmaq:

**Admin Panel ilə:**
```
1. Admin panel-ə gir
2. Auctions → Start Auction
3. Log-larda baxın: "AUCTION STARTED: {AuctionId}"
```

**API ilə (Postman/curl):**
```bash
POST https://localhost:7249/api/Auction/{auctionId}/start
Authorization: Bearer {your-token}
```

---

## ✅ Frontend Test (React / TypeScript)

### 1. Frontend-i Başlat:
```bash
cd Autoria-Final/AutoriaFinal-Frontend/unified-app
npm run dev
```

### 2. Browser Console-da Axtarın:

**SignalR Connection:**
```
🔧 Initializing/Updating SignalR hook for instance: https://localhost:7249_...
✅ Event handlers set: ['onConnectionStateChanged', 'onTimerTick', 'onAuctionTimerReset', 'onNewLiveBid', ...]
SignalR: Starting connection for instance ...
SignalR: AuctionHub started successfully
SignalR: BidHub started successfully
✅ SignalR: Connected successfully
```
- ❌ Görmürsünüzsə: SignalR bağlantı problemi!
- ✅ Görürsünüzsə: Connection uğurlu

**Group Join:**
```
SignalR: Joined auction group: {auctionId}
✅ User {...} joined auction {...} group: auction-{...}, Current timer: 30s
```
- ❌ Görmürsünüzsə: JoinAuction çağırılmayıb!
- ✅ Görürsünüzsə: Group-a qoşuldu

**Timer Tick Events (HƏR SANİYƏ):**
```
⏰ [SignalR Event] TimerTick received: { remainingSeconds: 30, timerSeconds: 30, ... }
⏰ [REAL-TIME] Timer Tick: { remainingSeconds: 29, ... }
⏱️ Updating timer: 30s → 29s
⏰ [SignalR Event] TimerTick received: { remainingSeconds: 28, ... }
⏱️ Updating timer: 29s → 28s
```
- ❌ Görmürsünüzsə: Backend TimerTick göndərmir və ya event handler işləmir!
- ✅ Görürsünüzsə: Timer düzgün işləyir!

**Live Bid Zamanı:**
```
💰 [REAL-TIME] New Live Bid Received: { amount: 15000, userName: "John" }
✅ Bid is for current car - updating state
✅ State updated - New price: $15000
🔄 [REAL-TIME] Timer Reset: { newTimerSeconds: 30, resetBy: "LiveBid" }
✅ Timer reset to 30s by LiveBid
⏰ [SignalR Event] TimerTick received: { remainingSeconds: 30 }
```
- ✅ Timer 30-a reset olmalıdır
- ✅ Bütün browser-lərdə eyni anda görünməlidir

---

## 🐛 Troubleshooting

### Problem 1: Timer Console-da Görünür AMMA UI-da Update Olmur

**Səbəb:** State update işləmir

**Test:**
```javascript
// Browser console-da:
console.log(window.location.href); // Check page URL
// Timer tick console-da görünürsə state problem var
```

**Həll:** LiveAuctionPage.tsx-də setState düzgün çağırılır?

### Problem 2: Timer Tick Event Heç Gəlmir

**Səbəb:** Backend göndərmir və ya SignalR group düzgün deyil

**Test Backend:**
```bash
# Backend log-unda:
dotnet run --verbosity normal

# Axtarın:
"Timer Tick: Auction {...}, Remaining: 30s"
```

**Test Frontend:**
```javascript
// Browser console-da:
// SignalR connection state:
console.log('Connected:', signalRHook.isConnected);
console.log('State:', signalRHook.connectionState);
```

**Həll:**
1. Backend log-unda "Timer Tick" yoxdursa → Auction başlamayıb
2. Backend log-unda var, amma frontend-də yoxdursa → Group name uyğunsuzluğu

### Problem 3: Yalnız İlk Timer Tick Gəlir, Sonra Kəsilir

**Səbəb:** Event handler-lər hər render-də yenilənir və de-register olur

**Həll:** ✅ Artıq düzəldildi - `useMemo` ilə events memoize edildi

### Problem 4: Timer 10-dan Başlayır, 30-dan Yox

**Səbəb:** Auction.TimerSeconds default dəyəri düzgün deyil

**Həll:** ✅ Artıq düzəldildi - Auction entity-də default 30

---

## 📊 SignalR Group Name Consistency Check

**Backend Group Names:**
```
✅ AuctionHub.JoinAuction: "auction-{auctionId}"
✅ AuctionTimerBackgroundService: "auction-{auctionId}"
✅ AuctionService.MoveToNextCarAsync: "auction-{auctionId}"
✅ BidHub.JoinAuctionCar: "AuctionCar-{auctionCarId}"
✅ BidService.PlaceLiveBidAsync: "AuctionCar-{auctionCarId}"
```

**Frontend Group Join:**
```
✅ joinAuction(auctionId) → calls JoinAuction(auctionId) → backend adds to "auction-{auctionId}"
✅ joinAuctionCar(carId) → calls JoinAuctionCar(carId) → backend adds to "AuctionCar-{carId}"
```

---

## 🧪 Step-by-Step Test Proseduru

### Test 1: Timer Starts at 30
```bash
1. Start backend: dotnet run
2. Start frontend: npm run dev  
3. Login və /all-auctions-a get
4. Create auction (admin panel)
5. Start auction (admin panel)
6. Join auction (click "Join" button)
7. Browser console check:
   ⏰ [SignalR Event] TimerTick received: { remainingSeconds: 30 }
8. UI-da timer "0:30" göstərməlidir ✅
9. 3 saniyə sonra "0:27" olmalıdır ✅
```

### Test 2: Timer Resets on Bid
```bash
1. Timer 15 saniyə olaraq gözlə
2. Bid ver ($10,000)
3. Console check:
   🔄 [REAL-TIME] Timer Reset: { newTimerSeconds: 30 }
   ⏱️ Updating timer: 15s → 30s
4. UI-da timer "0:30" göstərməlidir ✅
```

### Test 3: All Users See Same Timer (Real-Time)
```bash
1. 2 browser aç (Chrome və Firefox)
2. Hər ikisində eyni auction-a join et
3. Browser 1-də timer bax: 25s
4. Browser 2-də timer bax: 25s ✅ (eyni olmalıdır!)
5. Browser 1-də bid ver
6. HƏR İKİ browser-də timer 30s olmalıdır ✅
```

### Test 4: Auto-Move on Timer Expiry
```bash
1. Auction-a join et
2. 30 saniyə gözlə (bid vermə!)
3. Timer 0-a çatanda:
   - Backend log: "TIMER EXPIRED ... Triggering auto-move"
   - Frontend: "🚗 Car Moved"
   - UI: Növbəti lot göstərilməlidir ✅
```

---

## 📞 Debug Commands

### Backend Logs (Real-Time):
```bash
# Windows PowerShell:
dotnet run | Select-String "Timer"

# Linux/Mac:
dotnet run | grep -i timer
```

### Frontend Console Filter:
```javascript
// Browser console-da filter:
// Type "Timer" və yalnız timer events görün
```

### SignalR Trace:
```javascript
// Browser console:
localStorage.setItem('signalr.debug', 'true');
// Reload page
// Sonra:
localStorage.removeItem('signalr.debug');
```

---

## 🎉 Success Criteria

✅ **Backend:**
- Service başladı
- Hər saniyə "Timer Tick" log-u
- Bid zamanı "Timer reset to 30s"
- Timer bitdikdə "TIMER EXPIRED"

✅ **Frontend:**
- SignalR connected
- Group-a qoşuldu
- Hər saniyə TimerTick event alır
- UI-da timer azalır: 30 → 29 → 28 → ...
- Bid zamanı timer 30-a reset
- Bütün browser-lər eyni timer görür

✅ **Real-Time:**
- 2+ istifadəçi eyni timer görür
- Bid verilən an HƏR KƏS görür
- Timer reset HƏR KƏS görür
- Auto-move HƏR KƏS görür

🎉 **ƏGƏR BÜTÜN ✅ İŞARƏLƏR VARSA: SİSTEM İŞLƏYİR!** 🚀

