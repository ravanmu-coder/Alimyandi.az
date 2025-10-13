using System;

namespace AutoriaFinal.Contract.Dtos.Auctions.Bid
{
    public class BidDetailDto
    {
        public Guid Id { get; set; }
        public Guid AuctionCarId { get; set; }
        public Guid UserId { get; set; }
        public decimal Amount { get; set; }
        public bool IsPreBid { get; set; }
        public bool IsProxy { get; set; }
        public decimal? ProxyMax { get; set; }
        public string Status { get; set; } = default!;
        public DateTime PlacedAtUtc { get; set; }

        // ƏLAVƏ: Yeni əsas property-lər
        public string BidType { get; set; } = default!;
        public string? Notes { get; set; }
        public DateTime? ValidUntil { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public string? IPAddress { get; set; }
        public string? UserAgent { get; set; }
        public int SequenceNumber { get; set; }
        public bool IsAutoBid { get; set; }
        public Guid? ParentBidId { get; set; }

        //  Metadata
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        //  Bid analizi və status məlumatları
        public bool IsWinningBid { get; set; }             // Bu bid hazırda qazanandır
        public bool IsHighestBid { get; set; }             // Bu bid ən yüksəkdir
        public bool IsUserHighestBid { get; set; }         // Bu istifadəçinin ən yüksək bid-idir
        public int BidRankOverall { get; set; }            // Ümumi sıralamada yerini
        public int BidRankByUser { get; set; }             // İstifadəçinin bid-ləri arasında yeri

        //  Statistika məlumatları
        public decimal NextMinimumBid { get; set; }        // Növbəti minimum bid məbləği
        public decimal DistanceFromWinning { get; set; }   // Qazanan bid-dən məsafə
        public decimal DistanceFromHighest { get; set; }   // Ən yüksək bid-dən məsafə

        //  Vaxt məlumatları
        public TimeSpan TimeToExpiry { get; set; }         // Bitməyə qalan vaxt (proxy bid üçün)
        public bool IsExpired { get; set; }               // Vaxtı bitib-bitmədiyini
        public bool IsActive { get; set; }                // Hələ aktivdir-yoxsa

        //  Əlaqəli entity məlumatları
        public string AuctionCarLotNumber { get; set; } = default!;
        public string AuctionName { get; set; } = default!;
        public string UserName { get; set; } = default!;
        public string? UserDisplayName { get; set; }

        //  Car məlumatları (əgər lazımdırsa)
        public string? CarMake { get; set; }
        public string? CarModel { get; set; }
        public int? CarYear { get; set; }
        public string? CarVin { get; set; }

        //  Proxy bid məlumatları
        public decimal RemainingProxyAmount { get; set; }  // Proxy bid-də qalan məbləğ
        public int ChildBidsCount { get; set; }           // Bu bid-dən törənən avtomatik bid sayı
        public decimal TotalProxyAmountUsed { get; set; } // Proxy bid-dən istifadə olunan məbləğ

        //  Performance və audit məlumatları
        public string? ClientInfo { get; set; }           // Client təhlili üçün
        public string? LocationInfo { get; set; }         // IP əsasında location
        public bool IsFromMobileDevice { get; set; }      // Mobil cihazdan verilibmi
    }
}