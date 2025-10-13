using System;
using System.ComponentModel.DataAnnotations;

namespace AutoriaFinal.Contract.Dtos.Auctions.AuctionCar
{
    public class AuctionCarCreateDto
    {
        [Required(ErrorMessage = "Auction ID mütləqdir")]
        public Guid AuctionId { get; set; }

        [Required(ErrorMessage = "Car ID mütləqdir")]
        public Guid CarId { get; set; }

        [Required(ErrorMessage = "Lot nömrəsi mütləqdir")]
        [StringLength(50, MinimumLength = 1, ErrorMessage = "Lot nömrəsi 1-50 simvol arasında olmalıdır")]
        public string LotNumber { get; set; } = default!;

        [Range(1, 999999, ErrorMessage = "Item nömrəsi 1-999999 arasında olmalıdır")]
        public int? ItemNumber { get; set; }

        [Required(ErrorMessage = "Estimated Retail Value mütləqdir")]
        [Range(100, 1000000, ErrorMessage = "ERV 100-1000000 arasında olmalıdır")]
        public decimal EstimatedRetailValue { get; set; }

        [Range(1, 20, ErrorMessage = "Lane nömrəsi 1-20 arasında olmalıdır")]
        public int? LaneNumber { get; set; }

        [Range(1, 1000, ErrorMessage = "Run order 1-1000 arasında olmalıdır")]
        public int? RunOrder { get; set; }

        public DateTime? ScheduledTime { get; set; }

        public bool RequiresSellerApproval { get; set; } = true;

        [StringLength(1000, ErrorMessage = "Seller notes maksimum 1000 simvol ola bilər")]
        public string? SellerNotes { get; set; }

        // ✅ Auto-calculated values (readonly in API)
        public decimal StartPrice => Math.Round(EstimatedRetailValue * 0.80m, 2);
        public decimal ReservePrice => Math.Round(EstimatedRetailValue * 0.90m, 2);
        public decimal MinPreBid => StartPrice;
    }
}