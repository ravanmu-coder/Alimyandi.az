# Real-Time Architecture - Copart/eBay səviyyəsində

## 📋 Arxitekturun Məqsədi

Bütün istifadəçilərdə auction-un real vəziyyətinin eyni anda sinxron görünməsi:
- ✅ Qiymət, vaxt, cari maşın, status hamıda eyni
- ✅ Yeni bid gələndə bütün istifadəçilər eyni anda görür
- ✅ Timer hər userdə eyni vaxtda azalır
- ✅ Auction bitəndə hamıda dərhal bağlanır

## 🏗️ Arxitektur Sxem

```
Backend (SignalR)
      ↓
signalRManager.ts (Mərkəzləşdirilmiş Event Handler)
      ↓
auctionStore.ts (Zustand - Single Source of Truth)
      ↓
UI Components (LiveAuctionPage, etc.)
```

## 🔑 Əsas Prinsiplər

### 1. Single Source of Truth
- **Bütün auction state-i `auctionStore.ts`-də saxlanır**
- Heç bir komponent öz local state-ində price/timer/car saxlamır
- Hər komponent store-dan oxuyur, store vasitəsilə yazır

### 2. Mərkəzləşdirilmiş Event Handling
- **Bütün SignalR event-ləri YALNIZ `signalRManager.ts`-də dinlənir**
- Hər event gəldikdə store avtomatik update olunur
- Digər hook-larda (useRealtime, useBidHub, useTimer) heç bir `connection.on()` yoxdur

### 3. Server-Authoritative Timer
- **Timer yalnız serverdən gələn event-lərlə idarə olunur**
- Local timer/interval yoxdur
- `TimerTick` event-i hər saniyə gəlir və store-u yeniləyir
- `AuctionTimerReset` yeni bid zamanı timer-i sıfırlayır

### 4. Event-Driven Updates
- Bütün dəyişikliklər SignalR event-ləri vasitəsilə baş verir
- Heç bir polling/interval yoxdur
- UI avtomatik render olunur (Zustand subscription)

## 📁 Fayl Strukturu

### 1. `stores/auctionStore.ts`
**Məqsəd:** Bütün auction state-ini saxlayır

```typescript
interface AuctionStore {
  // Auction info
  auctionId: string | null;
  auction: AuctionDetailDto | null;
  status: 'Idle' | 'Running' | 'Paused' | 'Ended';
  
  // Current car
  currentCar: AuctionCarDetailDto | null;
  
  // Bidding
  currentPrice: number;
  highestBid: BidGetDto | null;
  bidHistory: BidGetDto[];
  
  // Timer (server-driven)
  remainingSeconds: number;
  
  // Connection
  isConnected: boolean;
  isLive: boolean;
  
  // Actions
  startAuction: () => void;
  setCurrentCar: (car) => void;
  updateHighestBid: (bid) => void;
  setRemainingSeconds: (seconds) => void;
  // ... və s.
}
```

**Xüsusiyyətlər:**
- Zustand istifadə edir
- DevTools dəstəyi (development modda)
- Selectors (optimized re-renders)
- Minimal, focused actions

### 2. `utils/signalRManager.ts`
**Məqsəd:** SignalR bağlantısını idarə edir və event-ləri store-a yönləndirir

```typescript
private setupEventHandlers(): void {
  // Auction events
  this.auctionConnection.on('AuctionStarted', (data) => {
    useAuctionStore.getState().startAuction();
  });
  
  this.auctionConnection.on('TimerTick', (data) => {
    useAuctionStore.getState().setRemainingSeconds(data.remainingSeconds);
  });
  
  // Bid events
  this.bidConnection.on('NewLiveBid', (data) => {
    useAuctionStore.getState().updateHighestBid(data.bid);
    useAuctionStore.getState().addBidToHistory(data.bid);
  });
  
  this.bidConnection.on('AuctionTimerReset', (data) => {
    useAuctionStore.getState().resetTimer(data.newTimerSeconds);
  });
  
  // ... və s.
}
```

**Xüsusiyyətlər:**
- Bütün event-lər burada dinlənir
- Hər event store-u avtomatik yeniləyir
- Custom handler-lər də saxlanılır (optional)
- Connection state də store-a yazılır

### 3. `hooks/useBidHub.ts`
**ÖNCƏKİ:** Event-ləri dinləyirdi
**İNDİ:** Yalnız server metodlarını çağırır

```typescript
// ✅ Yeni yanaşma
const placeBid = async (auctionCarId: string, amount: number) => {
  await connection.invoke("PlaceBid", { auctionCarId, amount });
  // Backend NewLiveBid eventi göndərəcək
  // signalRManager onu qəbul edib store-u yeniləyəcək
  // UI avtomatik render olunacaq
};

// ❌ Köhnə yanaşma (SİLİNDİ)
// connection.on('NewLiveBid', ...) - ARTIQ YOXDUR
```

### 4. `hooks/useRealtime.ts`
**ÖNCƏKİ:** Event-ləri dinləyirdi
**İNDİ:** Yalnız store-dan oxuyur

```typescript
// ✅ Yeni yanaşma
export const useRealtime = () => {
  const currentCar = useAuctionStore(state => state.currentCar);
  const currentPrice = useAuctionStore(state => state.currentPrice);
  const remainingSeconds = useAuctionStore(state => state.remainingSeconds);
  
  return { currentCar, currentPrice, remainingSeconds };
};

// ❌ Köhnə yanaşma (SİLİNDİ)
// connection.on('PriceUpdated', ...) - ARTIQ YOXDUR
```

### 5. `hooks/useTimer.ts`
**ÖNCƏKİ:** Local interval ilə timer sayırdı
**İNDİ:** Store-dan timer oxuyur

```typescript
// ✅ Yeni yanaşma
export const useTimer = () => {
  const remainingSeconds = useAuctionStore(state => state.remainingSeconds);
  
  // UI-də göstər
  return { remainingSeconds };
};

// ❌ Köhnə yanaşma (SİLİNDİ)
// setInterval(() => setTime(time - 1), 1000) - ARTIQ YOXDUR
```

### 6. `pages/LiveAuctionPage.tsx`
**ÖNCƏKİ:** Local useState ilə state saxlayırdı
**İNDİ:** Yalnız store-dan oxuyur

```typescript
// ✅ Yeni yanaşma
const LiveAuctionPage = () => {
  // Read from store
  const { currentCar, currentPrice, remainingSeconds, highestBid, bidHistory } = 
    useAuctionStore(selectBidding);
  const { isConnected, isLive } = useAuctionStore(selectConnection);
  
  // Actions
  const { placeBid } = useBidHub();
  
  const handlePlaceBid = async (amount: number) => {
    await placeBid(currentCar.id, amount);
    // Backend eventi göndərəcək, store yenilənəcək, UI render olunacaq
  };
  
  return (
    <div>
      <h1>Current Price: ${currentPrice}</h1>
      <p>Timer: {remainingSeconds}s</p>
      {/* ... */}
    </div>
  );
};

// ❌ Köhnə yanaşma (SİLİNDİ)
// const [price, setPrice] = useState(0);
// const [timer, setTimer] = useState(10);
// useEffect(() => { connection.on('...') }, []); - ARTIQ YOXDUR
```

## 🔄 Event Flow (Copart modeli)

### Bid Yerləşdirmə
```
1. User UI-də "Place Bid" düyməsini basır
   ↓
2. useBidHub().placeBid(carId, amount) çağırılır
   ↓
3. SignalR connection.invoke("PlaceBid", ...) serverə göndərir
   ↓
4. Backend:
   - Bid validate edir
   - Database-ə yazır
   - Clients.Group.SendAsync("NewLiveBid", ...) göndərir
   - Clients.Group.SendAsync("AuctionTimerReset", ...) göndərir
   ↓
5. signalRManager bu event-ləri alır:
   - NewLiveBid → store.updateHighestBid()
   - AuctionTimerReset → store.resetTimer()
   ↓
6. Store yenilənir
   ↓
7. Zustand subscription tetiklənir
   ↓
8. LiveAuctionPage avtomatik render olunur
   ↓
9. Bütün istifadəçilər eyni anda yeni bid-i görür ✅
```

### Timer Ticking
```
1. Backend hər saniyə:
   Clients.Group.SendAsync("TimerTick", { remainingSeconds: X })
   ↓
2. signalRManager alır:
   TimerTick → store.setRemainingSeconds(X)
   ↓
3. Store yenilənir
   ↓
4. UI avtomatik render olunur
   ↓
5. Bütün userlər eyni vaxtı görür ✅
```

### Auction Başlama
```
1. Admin "Start Auction" düyməsini basır
   ↓
2. Backend:
   Clients.Group.SendAsync("AuctionStarted", ...)
   ↓
3. signalRManager alır:
   AuctionStarted → store.startAuction()
   ↓
4. Store: status = 'Running', isLive = true
   ↓
5. UI dərhal live indicator göstərir ✅
```

## ✅ Təmin Edilənlər

### 1. Sinxronizasiya
- ✅ Bütün userlər eyni anda eyni state görür
- ✅ Heç bir desync yoxdur
- ✅ Timer hamıda eyni

### 2. Performance
- ✅ Zustand minimal re-render təmin edir
- ✅ Selectors istifadə edilir
- ✅ Heç bir polling yoxdur

### 3. Təmizlik
- ✅ Single source of truth
- ✅ Event duplikasiyası yoxdur
- ✅ Separation of concerns

### 4. Debugging
- ✅ Redux DevTools (Zustand devtools)
- ✅ Mərkəzləşdirilmiş log-lar
- ✅ Event trace etmək asan

## 🚫 Qadağalar

❌ Heç bir komponentdə local state ilə price/timer/car saxlama
❌ Heç bir hook-da connection.on() istifadə etmə (signalRManager-dən başqa)
❌ Local timer/interval yaratma
❌ Polling/health check intervalları
❌ Direct API call-larla state yeniləmə (event-lərə arxalan)

## 📊 Testing

### Development
```bash
# Redux DevTools açıq
# Console-da log-lar görünür:
🚀 [SignalR Event] AuctionStarted
💰 [SignalR Event] NewLiveBid: 5000
⏰ [SignalR Event] TimerTick: 9
```

### Production
```bash
# Log-lar minimal
# Zustand DevTools disabled
# Performance optimized
```

## 🎯 Nəticə

Bu arxitektur Copart/eBay kimi professional auction platformaların standartıdır:
- Mərkəzləşdirilmiş state idarəsi
- Event-driven real-time updates
- Server-authoritative timer
- Zero polling
- Sinxron, etibarlı, performant

**Bütün istifadəçilər artıq eyni real-time experience-ə malikdir!** 🎉

