using System;
using System.Collections.Generic;

namespace AutoriaFinal.Contract.Dtos.Auctions.Bid
{
    public class BidHistoryDto
    {
        public Guid AuctionCarId { get; set; }
        public string LotNumber { get; set; } = default!;
        public string CarInfo { get; set; } = default!; // "2020 BMW X5"

        public int TotalBids { get; set; }
        public int UniqueBidders { get; set; }
        public decimal StartingPrice { get; set; }
        public decimal WinningPrice { get; set; }
        public decimal PriceIncrease { get; set; }

        public DateTime AuctionStartTime { get; set; }
        public DateTime? AuctionEndTime { get; set; }
        public TimeSpan? AuctionDuration { get; set; }

        public IEnumerable<BidGetDto> Bids { get; set; } = new List<BidGetDto>();

        // Top bidders
        public IEnumerable<BidderSummaryDto> TopBidders { get; set; } = new List<BidderSummaryDto>();
    }

    public class BidderSummaryDto
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = default!;
        public string? DisplayName { get; set; }

        public int BidCount { get; set; }
        public decimal HighestBid { get; set; }
        public decimal TotalBidAmount { get; set; }
        public DateTime FirstBidTime { get; set; }
        public DateTime LastBidTime { get; set; }

        public bool IsWinner { get; set; }
        public int Rank { get; set; }
    }
}