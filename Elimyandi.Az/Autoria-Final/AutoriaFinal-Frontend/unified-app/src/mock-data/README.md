# Mock Data for Əlimyandı.az Auction API

Bu klasör Əlimyandı.az Auction API-si üçün bütün endpoint-lər üçün mock data ehtiva edir. Test məqsədləri üçün istifadə edilə bilər.

## Struktur

```
src/mock-data/
├── auction-mock-data.ts          # Auction endpoint-ləri üçün mock data
├── auction-car-mock-data.ts      # AuctionCar endpoint-ləri üçün mock data
├── auction-winner-mock-data.ts   # Auction Winner endpoint-ləri üçün mock data
├── auth-mock-data.ts             # Authentication endpoint-ləri üçün mock data
├── bid-mock-data.ts              # Bid endpoint-ləri üçün mock data
├── car-mock-data.ts              # Car endpoint-ləri üçün mock data
├── location-mock-data.ts         # Location endpoint-ləri üçün mock data
├── info-mock-data.ts             # Info endpoint üçün mock data
├── api-responses.ts              # Bütün API response-ləri üçün mock data
├── test-utils.ts                 # Test üçün utility funksiyaları
├── index.ts                      # Bütün mock data-ları export edən əsas fayl
└── README.md                     # Bu fayl
```

## İstifadə

### Əsas Mock Data İmport Etmək

```typescript
import { mockAuctions, mockCars, mockUsers } from './mock-data';
```

### API Response-ləri İstifadə Etmək

```typescript
import { mockAuctionResponses, mockAuthResponses } from './mock-data/api-responses';

// Test-də istifadə
const response = mockAuctionResponses.getAllAuctions;
```

### Test Utility-ləri İstifadə Etmək

```typescript
import { 
  createMockAuction, 
  createMockUser, 
  generateMockArray,
  createMockApiResponse 
} from './mock-data/test-utils';

// Yeni mock data yaratmaq
const newAuction = createMockAuction({
  title: "Custom Auction",
  status: "Active"
});

// Array yaratmaq
const auctions = generateMockArray(createMockAuction, 5);

// API response yaratmaq
const response = createMockApiResponse(auctions, 200, "Success");
```

## Endpoint-lər

### Auction Endpoints (19 endpoint)
- `GET /api/Auction` - Bütün auction-ları əldə et
- `POST /api/Auction` - Yeni auction yarat
- `GET /api/Auction/{id}` - Müəyyən auction əldə et
- `PUT /api/Auction/{id}` - Auction yenilə
- `DELETE /api/Auction/{id}` - Auction sil
- `POST /api/Auction/{id}/start` - Auction başlat
- `POST /api/Auction/{id}/end` - Auction bitir
- `POST /api/Auction/{id}/cancel` - Auction ləğv et
- `POST /api/Auction/{id}/extend` - Auction uzat
- `POST /api/Auction/{id}/next-car` - Növbəti avtomobilə keç
- `POST /api/Auction/{id}/set-current-car` - Cari avtomobili təyin et
- `GET /api/Auction/live` - Canlı auction-lar
- `GET /api/Auction/active` - Aktiv auction-lar
- `GET /api/Auction/ready-to-start` - Başlamağa hazır auction-lar
- `GET /api/Auction/expired` - Müddəti bitmiş auction-lar
- `GET /api/Auction/location/{locationId}` - Müəyyən lokasiyadakı auction-lar
- `GET /api/Auction/{id}/timer` - Auction timer
- `GET /api/Auction/{id}/current-state` - Auction cari vəziyyəti
- `GET /api/Auction/{id}/statistics` - Auction statistikaları

### AuctionCar Endpoints (25 endpoint)
- `GET /api/AuctionCar` - Bütün auction avtomobillərini əldə et
- `POST /api/AuctionCar` - Yeni auction avtomobili yarat
- `GET /api/AuctionCar/{id}` - Müəyyən auction avtomobili əldə et
- `PUT /api/AuctionCar/{id}` - Auction avtomobili yenilə
- `DELETE /api/AuctionCar/{id}` - Auction avtomobili sil
- Və s...

### Auth Endpoints (8 endpoint)
- `POST /api/Auth/register` - Qeydiyyat
- `POST /api/Auth/login` - Giriş
- `POST /api/Auth/logout` - Çıxış
- `POST /api/Auth/confirmemail` - Email təsdiq et
- `POST /api/Auth/resend-confirmation` - Təsdiq email-i yenidən göndər
- `POST /api/Auth/forgot-password` - Şifrəni unutdum
- `POST /api/Auth/reset-password` - Şifrəni sıfırla
- `GET /api/Auth/profile` - Profil məlumatları
- `GET /api/Auth/me` - Mənim məlumatlarım
- `GET /api/Auth/roles` - Rollar
- `GET /api/Auth/health` - Sağlamlıq yoxlaması

### Bid Endpoints (12 endpoint)
- `POST /api/Bid/prebid` - Pre-bid yarat
- `POST /api/Bid/live` - Canlı bid
- `POST /api/Bid/proxy` - Proxy bid yarat
- Və s...

### Car Endpoints (4 endpoint)
- `GET /api/Car` - Bütün avtomobilləri əldə et
- `POST /api/Car` - Yeni avtomobil yarat
- `GET /api/Car/{id}` - Müəyyən avtomobil əldə et
- `PUT /api/Car/{id}` - Avtomobil məlumatlarını yenilə
- `DELETE /api/Car/{id}` - Avtomobil sil
- `GET /api/Car/vin/{vin}` - VIN nömrəsinə görə avtomobil

### Location Endpoints (4 endpoint)
- `GET /api/Location` - Bütün lokasiyaları əldə et
- `POST /api/Location` - Yeni lokasiya yarat
- `GET /api/Location/{id}` - Müəyyən lokasiya əldə et
- `PUT /api/Location/{id}` - Lokasiya məlumatlarını yenilə
- `DELETE /api/Location/{id}` - Lokasiya sil

### Auction Winner Endpoints (16 endpoint)
- `GET /api/auction-winners` - Bütün qalibləri əldə et
- `POST /api/auction-winners` - Yeni qalib yarat
- Və s...

### Info Endpoint (1 endpoint)
- `GET /api/info` - API məlumatları

## Test Nümunələri

### Jest Test Nümunəsi

```typescript
import { mockAuctions, mockAuctionResponses } from './mock-data';

describe('Auction API', () => {
  test('should return all auctions', () => {
    const response = mockAuctionResponses.getAllAuctions;
    expect(response.data).toHaveLength(1);
    expect(response.data[0].title).toBe('Classic Car Auction - Spring 2024');
  });
});
```

### React Component Test Nümunəsi

```typescript
import { mockAuctions } from './mock-data';

const AuctionList = () => {
  const [auctions] = useState(mockAuctions);
  
  return (
    <div>
      {auctions.map(auction => (
        <div key={auction.id}>{auction.title}</div>
      ))}
    </div>
  );
};
```

### API Mock Nümunəsi

```typescript
import { mockAuctionResponses } from './mock-data/api-responses';

// API mock
jest.mock('./api', () => ({
  getAuctions: jest.fn().mockResolvedValue(mockAuctionResponses.getAllAuctions),
  createAuction: jest.fn().mockResolvedValue(mockAuctionResponses.createAuction),
}));
```

## Qeydlər

- Bütün mock data-lar real API strukturuna uyğundur
- UUID-lər test üçün sabitdir, lakin `generateMockId()` funksiyası ilə yeni UUID-lər yarada bilərsiniz
- Tarix və vaxt məlumatları ISO format-da verilir
- Bütün məlumatlar test məqsədləri üçün nəzərdə tutulub və real məlumatlarla əvəz edilməlidir
