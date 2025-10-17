# LiveAuctionPage Refactor Planı

## Məqsəd
LiveAuctionPage-i Zustand store əsaslı etmək, local state-i silmək

## Əsas Dəyişikliklər

### 1. State Oxuma (Store-dan)
```typescript
// ❌ ÖNCƏKİ
const [state, setState] = useState<LiveAuctionState>({
  auction: null,
  currentCar: null,
  bidHistory: [],
  highestBid: null,
  timerSeconds: 10,
  isLive: false,
  // ...
});

// ✅ YENİ
const auction = useAuctionStore(state => state.auction);
const currentCar = useAuctionStore(state => state.currentCar);
const bidHistory = useAuctionStore(state => state.bidHistory);
const highestBid = useAuctionStore(state => state.highestBid);
const remainingSeconds = useAuctionStore(state => state.remainingSeconds);
const isLive = useAuctionStore(state => state.isLive);
```

### 2. SignalR Event Handler-ləri Silmək
```typescript
// ❌ SİLİNƏCƏK - artıq signalRManager-də var
events: {
  onCarMoved: (data) => { ... },
  onAuctionStarted: (data) => { ... },
  onTimerTick: (data) => { ... },
  onNewLiveBid: (data) => { ... },
  // ...
}
```

### 3. Local Timer Silmək
```typescript
// ❌ SİLİNƏCƏK - timer artıq server-driven
const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
useEffect(() => {
  const interval = setInterval(() => {
    // local timer logic
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

### 4. State Yeniləmələr
```typescript
// ❌ ÖNCƏKİ
setState(prev => ({ ...prev, currentCar: newCar }));

// ✅ YENİ
useAuctionStore.getState().setCurrentCar(newCar);
```

## Addımlar

1. ✅ Store yaratdıq (auctionStore.ts)
2. ✅ signalRManager-ə store integration əlavə etdik
3. 🔄 LiveAuctionPage-də:
   - Local state-i store ilə əvəz et
   - SignalR event handler-ləri sil
   - Local timer-i sil
   - Store actions istifadə et

## Saxlanacaq Local State

Aşağıdakılar LOCAL qalacaq (UI-specific, store-a aid deyil):
- `loading` - səhifə yüklənməsi
- `error` - səhifə səhvi
- `isFullscreen` - UI mod
- `isMuted` - sound
- `currentImageIndex` - carousel
- `bidAmount` - input field
- `isPlacingBid` - button loading
- `isTransitioning` - animation
- `showCompletedModal` - modal visibility
- `viewDetailsMode` - view mode
- `lotQueue` - bütün maşınların siyahısı (dəyişmir)

## Silinəcək/Dəyişəcək

❌ `state.auction` → ✅ `useAuctionStore(s => s.auction)`
❌ `state.currentCar` → ✅ `useAuctionStore(s => s.currentCar)`
❌ `state.bidHistory` → ✅ `useAuctionStore(s => s.bidHistory)`
❌ `state.highestBid` → ✅ `useAuctionStore(s => s.highestBid)`
❌ `state.timerSeconds` → ✅ `useAuctionStore(s => s.remainingSeconds)`
❌ `state.isLive` → ✅ `useAuctionStore(s => s.isLive)`
❌ `state.stats` → ✅ `useAuctionStore(s => s.totalBids)` etc.
❌ SignalR events → ✅ Artıq signalRManager-də
❌ Local timer → ✅ Server-driven (TimerTick event)

## Faydalanma

Faylı kicik hissələrlə update edəcəyik:
1. İmport əlavə et (useAuctionStore)
2. Store selectors əlavə et
3. SignalR events-i sil
4. setState-ləri store actions ilə əvəz et
5. Timer logic-i sil

