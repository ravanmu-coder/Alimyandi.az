# LiveAuctionPage Refactor Guide

## Kritik Dəyişikliklər (Manual olaraq tətbiq edilməlidir)

### 1. Import Əlavə Et (Faylın əvvəlində)

```typescript
import { useAuctionStore, selectBidding, selectTimer, selectConnection } from '../stores/auctionStore';
```

### 2. Local State-i Store ilə Əvəz Et

#### ÖNCƏKİ (~ line 178-194):
```typescript
const [state, setState] = useState<LiveAuctionState>({
  auction: null,
  currentCar: null,
  activeLot: null,
  lotQueue: [],
  bidHistory: [],
  highestBid: null,
  timerSeconds: 10,
  isLive: false,
  auctionCompleted: false,
  stats: { /*...*/ }
});
```

#### YENİ:
```typescript
// Store-dan oxu
const auction = useAuctionStore(state => state.auction);
const currentCar = useAuctionStore(state => state.currentCar);
const bidHistory = useAuctionStore(state => state.bidHistory);
const highestBid = useAuctionStore(state => state.highestBid);
const remainingSeconds = useAuctionStore(state => state.remainingSeconds);
const isLive = useAuctionStore(state => state.isLive);
const status = useAuctionStore(state => state.status);
const totalBids = useAuctionStore(state => state.totalBids);
const uniqueBidders = useAuctionStore(state => state.uniqueBidders);
const activeBidders = useAuctionStore(state => state.activeBidders);

// Store actions
const setAuction = useAuctionStore(state => state.setAuction);
const setCurrentCar = useAuctionStore(state => state.setCurrentCar);
const setRemainingSeconds = useAuctionStore(state => state.setRemainingSeconds);

// Local state (UI-specific, saxla)
const [lotQueue, setLotQueue] = useState<AuctionCarGetDto[]>([]);
const [activeLot, setActiveLot] = useState<AuctionCarGetDto | null>(null);
const [auctionCompleted, setAuctionCompleted] = useState(false);

const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [isFullscreen, setIsFullscreen] = useState(false);
const [isMuted, setIsMuted] = useState(false);
const [currentImageIndex, setCurrentImageIndex] = useState(0);
const [bidAmount, setBidAmount] = useState('');
const [isPlacingBid, setIsPlacingBid] = useState(false);
const [isTransitioning, setIsTransitioning] = useState(false);
const [transitionMessage, setTransitionMessage] = useState('');
const [showCompletedModal, setShowCompletedModal] = useState(false);
const [viewDetailsMode, setViewDetailsMode] = useState(false);
```

### 3. SignalR Events-i Sadələşdir

#### ÖNCƏKİ (~ line 225-571):
Çox uzun event handler-lər var ki, store-u duplikat update edirlər.

#### YENİ:
```typescript
const {
  isConnected,
  isConnecting,
  connectionState,
  lastError,
  joinAuction,
  joinAuctionCar,
  placeLiveBid
} = useSignalR({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7249',
  token: localStorage.getItem('authToken') || '',
  autoConnect: true,
  events: {
    // Yalnız page-specific logic saxla, store update-ləri artıq signalRManager-dədir
    
    onCarMoved: async (data: any) => {
      console.log('🚗 Car Moved:', data);
      if (data.nextCarId) {
        await joinAuctionCar(data.nextCarId);
        // Fetch new car data və store-u update et
        try {
          const newCarSnapshot = await apiClient.getAuctionCar(data.nextCarId);
          setCurrentCar(newCarSnapshot);
        } catch (err) {
          console.error('Failed to load new car:', err);
        }
      }
    },
    
    onConnectionStateChanged: (state, error) => {
      console.log('🔌 Connection State:', state);
      if (error) {
        toast.error(`Connection Error: ${error}`);
      }
    },
  }
});
```

**SİL:**
- `onAuctionStarted` - artıq signalRManager-də
- `onTimerTick` - artıq signalRManager-də
- `onAuctionTimerReset` - artıq signalRManager-də
- `onNewLiveBid` - artıq signalRManager-də
- `onPreBidPlaced` - artıq signalRManager-də
- `onHighestBidUpdated` - artıq signalRManager-də
- `onPriceUpdated` - artıq signalRManager-də
- `onAuctionStopped` - artıq signalRManager-də
- `onAuctionEnded` - artıq signalRManager-də

### 4. setState-ləri Store Actions ilə Əvəz Et

#### Nümunə 1 - Current Car Update:
```typescript
// ❌ ÖNCƏKİ
setState(prev => ({
  ...prev,
  currentCar: newCar,
  bidHistory: [],
  highestBid: null
}));

// ✅ YENİ
setCurrentCar(newCar);
// bidHistory və highestBid avtomatik sıfırlanacaq (store-da)
```

#### Nümunə 2 - Timer Update:
```typescript
// ❌ ÖNCƏKİ
setState(prev => ({ ...prev, timerSeconds: 10 }));

// ✅ YENİ
setRemainingSeconds(10);
```

#### Nümunə 3 - Auction Update:
```typescript
// ❌ ÖNCƏKİ
setState(prev => ({
  ...prev,
  auction: auctionResponse,
  lotQueue,
  isLive: currentState.isLive,
  timerSeconds: currentState.timerSeconds || 10,
  stats
}));

// ✅ YENİ
setAuction(auctionResponse);
setLotQueue(lotQueue);
useAuctionStore.getState().setLiveStatus(currentState.isLive);
setRemainingSeconds(currentState.timerSeconds || 10);
useAuctionStore.getState().updateStats(stats);
```

### 5. Timer Interval-ı SİL

#### SİL (~ line 207 və cleanup):
```typescript
// ❌ SİLİNƏCƏK
const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

// ❌ SİLİNƏCƏK - Timer artıq server-driven (TimerTick event)
useEffect(() => {
  if (timerIntervalRef.current) {
    clearInterval(timerIntervalRef.current);
  }
  
  if (state.isLive && state.timerSeconds > 0) {
    timerIntervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.timerSeconds > 0) {
          return { ...prev, timerSeconds: prev.timerSeconds - 1 };
        }
        return prev;
      });
    }, 1000);
  }
  
  return () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };
}, [state.isLive, state.timerSeconds]);
```

**Timer artıq server-dən `TimerTick` eventi ilə gəlir, local hesablama lazım deyil!**

### 6. Referensləri Dəyişdir

Faylın hər yerində `state.currentCar` → `currentCar`, `state.timerSeconds` → `remainingSeconds` kimi dəyişikliklər et.

**Find & Replace (VSCode):**
- `state.currentCar` → `currentCar`
- `state.auction` → `auction`
- `state.bidHistory` → `bidHistory`
- `state.highestBid` → `highestBid`
- `state.timerSeconds` → `remainingSeconds`
- `state.isLive` → `isLive`
- `state.stats.totalBids` → `totalBids`
- `state.stats.uniqueBidders` → `uniqueBidders`

### 7. loadInitialData Funksiyasını Update Et

```typescript
const loadInitialData = useCallback(async () => {
  try {
    setLoading(true);
    // ... fetch data
    
    // ❌ ÖNCƏKİ
    // setState({ auction: ..., currentCar: ..., ... });
    
    // ✅ YENİ - Store actions istifadə et
    setAuction(auctionResponse);
    setCurrentCar(currentCar);
    useAuctionStore.getState().setBidHistory(bidHistory);
    useAuctionStore.getState().updateHighestBid(highestBid);
    setRemainingSeconds(currentState.timerSeconds || 10);
    useAuctionStore.getState().updateStats(stats);
    
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, [setAuction, setCurrentCar, setRemainingSeconds]);
```

## Yoxlama

Refactor tamamlandıqdan sonra:

1. ✅ Heç bir `setState(prev => ({ ...prev, currentCar: ... }))` qalmamalıdır
2. ✅ `state.timerSeconds` yox, `remainingSeconds` istifadə olunmalıdır
3. ✅ SignalR event handler-lərində store update duplikasiyası olmamalıdır
4. ✅ Local timer interval tamamilə silinməlidir
5. ✅ Console-da "TimerTick" event-ləri hər saniyə görünməlidir

## Test

```bash
npm run dev
# Live auction səhifəsinə get
# Console-da yoxla:
⏰ [SignalR Event] TimerTick: 10
⏰ [SignalR Event] TimerTick: 9
💰 [SignalR Event] NewLiveBid: { amount: 5000 }
🔄 [SignalR Event] AuctionTimerReset: 10

# Redux DevTools-da store-u izlə
```

## Qeyd

Bu böyük bir refactor-dur. Ehtiyatlı ol və addım-addım test et. Hər bir dəyişiklikdən sonra səhifəni yoxla.

