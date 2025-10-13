using System;

namespace AutoriaFinal.Contract.Dtos.Auctions.AuctionWinner
{
    public class AuctionWinnerDetailDto
    {
        public Guid Id { get; set; }
        public Guid AuctionCarId { get; set; }
        public Guid UserId { get; set; }
        public Guid WinningBidId { get; set; }
        public decimal Amount { get; set; }
        public decimal? PaidAmount { get; set; }
        public string PaymentStatus { get; set; } = default!;
        public DateTime AssignedAt { get; set; }

        //  Yeni property-lər
        public DateTime? WinnerConfirmedAt { get; set; }
        public int PaymentReminderCount { get; set; } = 0;
        public DateTime? PaymentDueDate { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        //  Əlaqəli entity məlumatları
        public string AuctionName { get; set; } = default!;
        public string AuctionCarLotNumber { get; set; } = default!;
        public string UserName { get; set; } = default!;
        public string? UserDisplayName { get; set; }
        public string? UserEmail { get; set; }
        public string? UserPhone { get; set; }

        // Car məlumatları
        public string CarMake { get; set; } = default!;
        public string CarModel { get; set; } = default!;
        public int CarYear { get; set; }
        public string CarVin { get; set; } = default!;
        public string? CarImage { get; set; }

        //  Bid məlumatları
        public DateTime BidPlacedAt { get; set; }
        public bool WasBidProxy { get; set; }
        public bool WasBidPreBid { get; set; }

        //  Payment məlumatları
        public decimal RemainingAmount => Amount - (PaidAmount ?? 0);
        public bool IsOverdue { get; set; }
        public int DaysOverdue { get; set; }
        public bool IsFullyPaid => PaidAmount >= Amount;
        public decimal PaymentProgress => PaidAmount.HasValue ? (PaidAmount.Value / Amount) * 100 : 0;

        //  Status indicators
        public bool RequiresConfirmation { get; set; }
        public bool RequiresPayment { get; set; }
        public bool IsReadyForDelivery { get; set; }
        public bool IsCompleted { get; set; }

        //  Timeline məlumatları
        public TimeSpan TimeSinceAssigned { get; set; }
        public TimeSpan? TimeToPaymentDue { get; set; }
        public TimeSpan? TimeSinceConfirmed { get; set; }

        //  Action flags
        public bool CanConfirm { get; set; }
        public bool CanReject { get; set; }
        public bool CanMakePayment { get; set; }
        public bool CanCancel { get; set; }
    }
}