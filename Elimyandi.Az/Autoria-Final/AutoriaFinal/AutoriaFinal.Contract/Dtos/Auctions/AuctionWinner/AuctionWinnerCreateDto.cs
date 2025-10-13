using System;
using System.ComponentModel.DataAnnotations;

namespace AutoriaFinal.Contract.Dtos.Auctions.AuctionWinner
{
    public class AuctionWinnerCreateDto
    {
        [Required(ErrorMessage = "AuctionCar ID mütləqdir")]
        public Guid AuctionCarId { get; set; }

        [Required(ErrorMessage = "User ID mütləqdir")]
        public Guid UserId { get; set; }

        [Required(ErrorMessage = "Winning Bid ID mütləqdir")]
        public Guid WinningBidId { get; set; }

        [Required(ErrorMessage = "Amount mütləqdir")]
        [Range(1, 10000000, ErrorMessage = "Amount 1-10,000,000 arasında olmalıdır")]
        public decimal Amount { get; set; }

        [Range(1, 30, ErrorMessage = "Ödəniş müddəti 1-30 gün arasında olmalıdır")]
        public int PaymentDueDays { get; set; } = 7; // Default 7 gün

        [StringLength(1000, ErrorMessage = "Qeydlər 1000 simvoldan çox ola bilməz")]
        public string? Notes { get; set; }

        public DateTime? CustomPaymentDueDate { get; set; }
    }
}