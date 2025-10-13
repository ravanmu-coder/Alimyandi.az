using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.AuctionCar
{
    public class AuctionCarUpdateDto
    {
        [Range(100, 1000000, ErrorMessage = "ERV 100-1000000 arasında olmalıdır")]
        public decimal? EstimatedRetailValue { get; set; }

        [Range(1, 20, ErrorMessage = "Lane nömrəsi 1-20 arasında olmalıdır")]
        public int? LaneNumber { get; set; }

        [Range(1, 1000, ErrorMessage = "Run order 1-1000 arasında olmalıdır")]
        public int? RunOrder { get; set; }

        public DateTime? ScheduledTime { get; set; }

        public bool? RequiresSellerApproval { get; set; }

        [StringLength(1000, ErrorMessage = "Seller notes maksimum 1000 simvol ola bilər")]
        public string? SellerNotes { get; set; }

        // ✅ Manual overrides (Admin only)
        [Range(1, 1000000, ErrorMessage = "Start price 1-1000000 arasında olmalıdır")]
        public decimal? StartPriceOverride { get; set; }

        [Range(1, 1000000, ErrorMessage = "Reserve price 1-1000000 arasında olmalıdır")]
        public decimal? ReservePriceOverride { get; set; }

        // ✅ Auto-calculated when ERV changes
        public decimal? StartPrice => EstimatedRetailValue.HasValue ? Math.Round(EstimatedRetailValue.Value * 0.80m, 2) : null;
        public decimal? ReservePrice => EstimatedRetailValue.HasValue ? Math.Round(EstimatedRetailValue.Value * 0.90m, 2) : null;
    }
}
