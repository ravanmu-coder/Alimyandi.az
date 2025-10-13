using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.AuctionCar
{
    public class AuctionCarStatsDto
    {
        public Guid AuctionCarId { get; set; }
        public string LotNumber { get; set; } = default!;

        // Bid Statistics
        public int TotalBids { get; set; }
        public int PreBids { get; set; }
        public int LiveBids { get; set; }
        public int ProxyBids { get; set; }
        public int UniqueBidders { get; set; }

        // Price Statistics
        public decimal StartPrice { get; set; }
        public decimal CurrentPrice { get; set; }
        public decimal HighestBid { get; set; }
        public decimal AverageBid { get; set; }
        public decimal PriceIncrease { get; set; }
        public decimal PriceIncreasePercentage { get; set; }

        // Time Statistics
        public DateTime? FirstBidTime { get; set; }
        public DateTime? LastBidTime { get; set; }
        public TimeSpan? BiddingDuration { get; set; }
        public TimeSpan? TimeSinceLastBid { get; set; }
        public decimal BidsPerHour { get; set; }
        public decimal AverageBidInterval { get; set; }

        // Business Metrics
        public bool IsReserveMet { get; set; }
        public string TrendDirection { get; set; } = "Stable"; // Up, Down, Stable
        public string WinnerStatus { get; set; } = default!;
        public string AuctionCondition { get; set; } = default!;
    }
}
