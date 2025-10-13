using System;

namespace AutoriaFinal.Contract.Dtos.Auctions.Bid
{
    public class BidSummaryDto
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = default!;
        public string? UserDisplayName { get; set; }

        public Guid AuctionId { get; set; }
        public string AuctionName { get; set; } = default!;

        // Bid statistikaları
        public int TotalBids { get; set; }              // Ümumi bid sayı
        public int PreBids { get; set; }                // Pre-bid sayı
        public int LiveBids { get; set; }               // Canlı bid sayı
        public int ProxyBids { get; set; }              // Proxy bid sayı
        public int WinningBids { get; set; }            // Qazanılmış bid sayı

        // Məbləğ statistikaları
        public decimal TotalBidAmount { get; set; }     // Ümumi bid məbləği
        public decimal HighestBidAmount { get; set; }   // Ən yüksək bid
        public decimal LowestBidAmount { get; set; }    // Ən aşağı bid
        public decimal AverageBidAmount { get; set; }   // Orta bid məbləği

        // Vaxt məlumatları
        public DateTime FirstBidTime { get; set; }      // İlk bid vaxtı
        public DateTime LastBidTime { get; set; }       // Son bid vaxtı
        public TimeSpan BiddingDuration { get; set; }   // Bid vermə müddəti

        // Uğur statistikaları
        public decimal WinRate { get; set; }            // Qalib gəlmə faizi
        public decimal AverageWinAmount { get; set; }   // Orta qalib məbləği
        public int AuctionCarsParticipated { get; set; } // İştirak etdiyi maşın sayı
    }
}