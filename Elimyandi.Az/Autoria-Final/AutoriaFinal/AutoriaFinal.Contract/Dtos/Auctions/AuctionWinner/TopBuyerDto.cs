using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.AuctionWinner
{
    public class TopBuyerDto
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = default!;
        public string? UserEmail { get; set; }
        public string? UserPhone { get; set; }

        // Statistics
        public int TotalWins { get; set; }
        public decimal TotalPurchaseAmount { get; set; }
        public decimal AveragePurchaseAmount { get; set; }
        public decimal SuccessRate { get; set; } // %

        // Time data
        public DateTime FirstWinDate { get; set; }
        public DateTime LastWinDate { get; set; }
        public TimeSpan AveragePaymentTime { get; set; }

        // Status
        public int OverdueCount { get; set; }
        public int CompletedCount { get; set; }
        public string ReliabilityScore { get; set; } = default!; // A+, B, C

        // UI helpers
        public string DisplayAmount { get; set; } = default!;
        public string Badge { get; set; } = default!; // "Premium", "Gold", "Silver"
    }
}
