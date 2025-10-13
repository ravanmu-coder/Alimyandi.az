using System;

namespace AutoriaFinal.Contract.Dtos.Auctions.Bid
{
    public class BidGetDto
    {
        public Guid Id { get; set; }
        public Guid AuctionCarId { get; set; }
        public Guid UserId { get; set; }
        public decimal Amount { get; set; }
        public bool IsPreBid { get; set; }
        public DateTime PlacedAtUtc { get; set; }

        //  Yeni əsas property-lər
        public string Status { get; set; } = default!;
        public string BidType { get; set; } = default!;
        public bool IsProxy { get; set; }
        public decimal? ProxyMax { get; set; }
        public bool IsAutoBid { get; set; }

        //  Display məlumatları
        public string UserName { get; set; } = default!;
        public string? UserDisplayName { get; set; }
        public string AuctionCarLotNumber { get; set; } = default!;

        //  Status indicators
        public bool IsWinning { get; set; }               // Hazırda qazanır
        public bool IsHighest { get; set; }               // Ən yüksək bid
        public bool IsActive { get; set; }                // Aktiv status
        public bool IsExpired { get; set; }               // Vaxtı bitib

        //  Bid ranking
        public int Rank { get; set; }                     // Bu bid-in ümumi sıralaması
        public decimal DistanceFromLeader { get; set; }   // Liderden məsafə

        //  Time information
        public string TimeAgo { get; set; } = default!;   // "5 dəqiqə əvvəl" formatında
        public DateTime LocalTime { get; set; }           // User timezone-da vaxt

        //  Proxy bid məlumatları (əgər proxy bid-dirsə)
        public decimal? RemainingProxyAmount { get; set; }
        public bool CanAutoIncrease { get; set; }
        public DateTime? ValidUntil { get; set; }

        //  Visual indicators üçün
        public string StatusColor { get; set; } = default!; // UI-də rəng üçün
        public string StatusIcon { get; set; } = default!;  // UI-də ikon üçün
        public bool IsHighlighted { get; set; }            // Vurğulanmalı-vurğulanmamalı
    }
}