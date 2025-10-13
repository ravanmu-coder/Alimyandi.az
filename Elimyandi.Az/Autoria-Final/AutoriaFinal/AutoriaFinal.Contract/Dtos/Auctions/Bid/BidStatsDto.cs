using System;

namespace AutoriaFinal.Contract.Dtos.Auctions.Bid
{
    public class BidStatsDto
    {
        public Guid AuctionCarId { get; set; }
        public string LotNumber { get; set; } = default!;

        // Ümumi statistikalar
        public int TotalBids { get; set; }
        public int UniqueBidders { get; set; }
        public int ActiveBids { get; set; }
        public int PreBids { get; set; }
        public int ProxyBids { get; set; }

        // Qiymət statistikaları
        public decimal CurrentPrice { get; set; }
        public decimal StartingPrice { get; set; }
        public decimal HighestBid { get; set; }
        public decimal LowestBid { get; set; }
        public decimal AverageBid { get; set; }
        public decimal PriceIncrease { get; set; }
        public decimal PriceIncreasePercentage { get; set; }

        // Vaxt statistikaları
        public DateTime? FirstBidTime { get; set; }
        public DateTime? LastBidTime { get; set; }
        public TimeSpan? BiddingDuration { get; set; }
        public TimeSpan? TimeSinceLastBid { get; set; }

        // Trend məlumatları
        public decimal BidsPerHour { get; set; }
        public decimal AverageBidInterval { get; set; }
        public string TrendDirection { get; set; } = default!; // "Up", "Down", "Stable"
    }
}