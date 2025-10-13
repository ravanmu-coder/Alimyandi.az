using System;

namespace AutoriaFinal.Contract.Dtos.Auctions.AuctionCar
{
    public class AuctionCarGetDto
    {
        public Guid Id { get; set; }
        public Guid AuctionId { get; set; }
        public Guid CarId { get; set; }
        public string LotNumber { get; set; } = default!;
        public int? ItemNumber { get; set; }

        // ✅ PRICING (Public info)
        public decimal StartPrice { get; set; }
        public decimal CurrentPrice { get; set; }
        public decimal MinPreBid { get; set; }
        public decimal? HammerPrice { get; set; }
        public decimal? TotalPrice { get; set; }

        // ✅ STATUS (Reserve is HIDDEN from buyers)
        public bool IsReserveMet { get; set; }
        public string WinnerStatus { get; set; } = default!;
        public string AuctionCondition { get; set; } = default!;
        public bool IsActive { get; set; }

        // ✅ BID INFO
        public int BidCount { get; set; }
        public int PreBidCount { get; set; }
        public DateTime? LastBidTime { get; set; }

        // ✅ SCHEDULING
        public int? LaneNumber { get; set; }
        public int? RunOrder { get; set; }
        public DateTime? ScheduledTime { get; set; }

        // ✅ CAR BASIC INFO
        public string? CarMake { get; set; }
        public string? CarModel { get; set; }
        public int? CarYear { get; set; }
        public string? CarVin { get; set; }
        public string? CarImage { get; set; }
        public string? CarCondition { get; set; }
        public string? PrimaryDamage { get; set; }

        // ✅ BUSINESS LOGIC HELPERS
        public bool CanBid => AuctionCondition == "LiveAuction" && IsActive;
        public bool HasPreBids => PreBidCount > 0;
        public bool IsPaymentOverdue { get; set; }
        public decimal NextMinimumBid { get; set; }
    }
}