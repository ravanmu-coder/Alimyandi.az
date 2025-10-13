using AutoriaFinal.Contract.Dtos.Auctions.AuctionWinner;
using AutoriaFinal.Contract.Dtos.Auctions.Bid;
using System;
using System.Collections.Generic;

namespace AutoriaFinal.Contract.Dtos.Auctions.AuctionCar
{
    public class AuctionCarDetailDto
    {
        public Guid Id { get; set; }
        public Guid AuctionId { get; set; }
        public Guid CarId { get; set; }
        public string LotNumber { get; set; } = default!;
        public int? ItemNumber { get; set; }

        // ✅ COMPLETE PRICING INFO
        public decimal StartPrice { get; set; }
        public decimal CurrentPrice { get; set; }
        public decimal MinPreBid { get; set; }
        public decimal? HammerPrice { get; set; }
        public decimal? BuyersPremium { get; set; }
        public decimal? TotalPrice { get; set; }
        public decimal? SoldPrice { get; set; }

        // ✅ RESERVE INFO (Admin/Seller only)
        public decimal? ReservePrice { get; set; }
        public bool IsReserveMet { get; set; }
        public bool ShowReservePrice { get; set; } = false; // Controlled by service

        // ✅ STATUS & CONDITION
        public string WinnerStatus { get; set; } = default!;
        public string AuctionCondition { get; set; } = default!;
        public bool IsActive { get; set; }
        public bool RequiresSellerApproval { get; set; }

        // ✅ TIMING INFO
        public DateTime? ActiveStartTime { get; set; }
        public DateTime? LastBidTime { get; set; }
        public int RemainingTimeSeconds { get; set; }
        public bool IsTimeExpired { get; set; }

        // ✅ BID STATISTICS
        public int BidCount { get; set; }
        public int PreBidCount { get; set; }
        public int TotalBidsCount { get; set; }
        public decimal HighestPreBidAmount { get; set; }
        public decimal HighestBidAmount { get; set; }
        public decimal NextMinimumBid { get; set; }

        // ✅ SCHEDULING & LANE
        public int? LaneNumber { get; set; }
        public int? RunOrder { get; set; }
        public DateTime? ScheduledTime { get; set; }

        // ✅ POST-AUCTION PROCESS
        public DateTime? WinnerNotifiedAt { get; set; }
        public DateTime? DepositPaidAt { get; set; }
        public DateTime? PaymentDueDate { get; set; }
        public bool IsPaymentOverdue { get; set; }
        public string? UnsoldReason { get; set; }
        public string? SellerNotes { get; set; }

        // ✅ TIMESTAMPS
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // ✅ NAVIGATION PROPERTIES
        public ICollection<BidGetDto> Bids { get; set; } = new List<BidGetDto>();
        public ICollection<BidGetDto> PreBids { get; set; } = new List<BidGetDto>();
        public AuctionWinnerGetDto? AuctionWinner { get; set; }

        // ✅ CAR DETAILED INFO
        public string? CarMake { get; set; }
        public string? CarModel { get; set; }
        public int? CarYear { get; set; }
        public string? CarVin { get; set; }
        public string? CarCondition { get; set; }
        public string? PrimaryDamage { get; set; }
        public string? SecondaryDamage { get; set; }
        public string[]? CarImages { get; set; }
        public decimal? EstimatedRetailValue { get; set; }

        // ✅ BUSINESS LOGIC HELPERS
        public bool CanBid => AuctionCondition == "LiveAuction" && IsActive && !IsTimeExpired;
        public bool CanStartAuction => AuctionCondition == "ReadyForAuction" && (PreBidCount > 0 || StartPrice > 0);
        public bool HasPreBids => PreBidCount > 0;
        public bool HasValidBids => BidCount > PreBidCount;
        public bool IsSold => WinnerStatus is "Won" or "SellerApproved" or "DepositPaid" or "PaymentComplete" or "Completed";
        public bool IsUnsold => WinnerStatus is "Unsold" or "SellerRejected";
        public decimal TotalAmountDue => TotalPrice ?? HammerPrice ?? CurrentPrice;
    }
}