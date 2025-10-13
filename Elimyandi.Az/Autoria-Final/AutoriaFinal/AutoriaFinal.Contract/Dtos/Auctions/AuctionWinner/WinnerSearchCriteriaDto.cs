using AutoriaFinal.Domain.Enums.AuctionEnums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.AuctionWinner
{
    public class WinnerSearchCriteriaDto
    {
        // User filters
        public Guid? UserId { get; set; }
        public string? UserName { get; set; }
        public string? UserEmail { get; set; }

        // Auction filters  
        public Guid? AuctionId { get; set; }
        public string? AuctionName { get; set; }
        public Guid? AuctionCarId { get; set; }
        public string? LotNumber { get; set; }

        // Car filters
        public string? CarMake { get; set; }
        public string? CarModel { get; set; }
        public int? CarYear { get; set; }
        public string? CarVin { get; set; }

        // Amount filters
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
        public decimal? MinPaidAmount { get; set; }
        public decimal? MaxPaidAmount { get; set; }

        // Date filters
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public DateTime? PaymentDueFrom { get; set; }
        public DateTime? PaymentDueTo { get; set; }

        // Status filters
        public PaymentStatus? PaymentStatus { get; set; }
        public bool? IsConfirmed { get; set; }
        public bool? IsOverdue { get; set; }
        public bool? IsCompleted { get; set; }
        public bool? IsSecondChance { get; set; }

        // Pagination
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;

        // Sorting
        public string SortBy { get; set; } = "AssignedAt";
        public string SortDirection { get; set; } = "DESC"; // ASC or DESC
    }
}
