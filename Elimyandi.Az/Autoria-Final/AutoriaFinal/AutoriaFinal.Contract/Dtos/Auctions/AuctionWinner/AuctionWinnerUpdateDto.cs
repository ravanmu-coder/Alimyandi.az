using System;
using System.ComponentModel.DataAnnotations;

namespace AutoriaFinal.Contract.Dtos.Auctions.AuctionWinner
{
    public class AuctionWinnerUpdateDto
    {
        [Range(0, 10000000, ErrorMessage = "Ödəniş məbləği 0-10,000,000 arasında olmalıdır")]
        public decimal? PaidAmount { get; set; }

        [Required(ErrorMessage = "Payment status mütləqdir")]
        public string PaymentStatus { get; set; } = default!;

        //  Yeni property-lər
        public DateTime? PaymentDueDate { get; set; }

        [StringLength(1000, ErrorMessage = "Qeydlər 1000 simvoldan çox ola bilməz")]
        public string? Notes { get; set; }

        public DateTime? WinnerConfirmedAt { get; set; }

        //  Update tracking
        [Required(ErrorMessage = "Update səbəbi mütləqdir")]
        [StringLength(500, ErrorMessage = "Update səbəbi 500 simvoldan çox ola bilməz")]
        public string UpdateReason { get; set; } = default!;

        [StringLength(100, ErrorMessage = "Payment reference 100 simvoldan çox ola bilməz")]
        public string? PaymentReference { get; set; } // Bank reference, transaction ID və s.
    }
}