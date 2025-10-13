using System;

namespace AutoriaFinal.Contract.Dtos.Auctions.AuctionWinner
{
    public class AuctionWinnerGetDto
    {
        public Guid Id { get; set; }
        public Guid AuctionCarId { get; set; }
        public Guid UserId { get; set; }
        public Guid WinningBidId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentStatus { get; set; } = default!;

        // Əsas UI məlumatları
        public string AuctionName { get; set; } = default!;
        public string CarInfo { get; set; } = default!; // "2020 BMW X5"
        public string LotNumber { get; set; } = default!;
        public string UserName { get; set; } = default!;
        public DateTime AssignedAt { get; set; }

        // Status indicators
        public bool IsConfirmed { get; set; }
        public bool IsOverdue { get; set; }
        public bool IsCompleted { get; set; }
        public bool IsSecondChanceWinner { get; set; }
        public string StatusColor { get; set; } = default!; // UI üçün rəng
        public string StatusIcon { get; set; } = default!;  // UI üçün ikon

        // Payment məlumatları
        public decimal? PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public DateTime? PaymentDueDate { get; set; }
        public int? DaysUntilDue { get; set; }

        // Time formatting
        public string TimeAgo { get; set; } = default!; // "2 saət əvvəl"
        public string PaymentDueStatus { get; set; } = default!; // "3 gün qalıb"

        // Action availability
        public bool CanViewDetails { get; set; }
        public bool RequiresAction { get; set; }
        public string? RequiredAction { get; set; } // "Ödəniş et", "Təsdiq et"
        public bool CanSendReminder { get; set; }
        public bool CanOfferSecondChance { get; set; }

        // Payment reminder info
        public int PaymentReminderCount { get; set; }
        public DateTime? LastReminderSent { get; set; }
    }
}