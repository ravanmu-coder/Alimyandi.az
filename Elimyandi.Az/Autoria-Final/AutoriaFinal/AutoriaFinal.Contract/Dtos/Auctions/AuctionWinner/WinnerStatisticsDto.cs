using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.AuctionWinner
{
    public class WinnerStatisticsDto
    {
        // General stats
        public int TotalWinners { get; set; }
        public int CompletedSales { get; set; }
        public int PendingPayments { get; set; }
        public int OverduePayments { get; set; }
        public int CancelledWinners { get; set; }

        // Financial stats
        public decimal TotalWinAmount { get; set; }
        public decimal TotalPaidAmount { get; set; }
        public decimal TotalOutstandingAmount { get; set; }
        public decimal CollectionRate { get; set; } // %

        // Time range
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public Guid? AuctionId { get; set; }
        public string? AuctionName { get; set; }

        // Performance metrics
        public decimal AverageWinAmount { get; set; }
        public decimal AveragePaymentTime { get; set; } // days
        public decimal CompletionRate { get; set; } // %

        // Breakdown by status
        public Dictionary<string, int> StatusBreakdown { get; set; } = new();
        public Dictionary<string, decimal> AmountBreakdown { get; set; } = new();

        // Trends
        public decimal MonthOverMonthGrowth { get; set; } // %
        public string TrendDirection { get; set; } = default!; // "Up", "Down", "Stable"
    }
}
