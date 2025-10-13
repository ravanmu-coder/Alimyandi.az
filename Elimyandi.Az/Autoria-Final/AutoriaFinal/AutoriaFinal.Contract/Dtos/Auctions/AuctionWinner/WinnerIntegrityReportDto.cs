using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoriaFinal.Contract.Dtos.Auctions.AuctionWinner
{
    public class WinnerIntegrityReportDto
    {
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public Guid GeneratedByUserId { get; set; }

        // Summary
        public int TotalWinnersChecked { get; set; }
        public int IssuesFound { get; set; }
        public bool HasCriticalIssues { get; set; }

        // Issues breakdown
        public List<IntegrityIssue> Issues { get; set; } = new();

        // Data consistency
        public int MissingWinningBids { get; set; }
        public int InvalidAmounts { get; set; }
        public int OrphanedWinners { get; set; }
        public int DuplicateWinners { get; set; }

        // Payment inconsistencies
        public int PaymentAmountMismatches { get; set; }
        public int InvalidPaymentStatuses { get; set; }
        public int MissingPaymentDueDates { get; set; }

        // Timeline issues
        public int FutureDateIssues { get; set; }
        public int DateSequenceIssues { get; set; }

        // Recommendations
        public List<string> Recommendations { get; set; } = new();

        public class IntegrityIssue
        {
            public Guid WinnerId { get; set; }
            public string IssueType { get; set; } = default!;
            public string Description { get; set; } = default!;
            public string Severity { get; set; } = default!; // "Low", "Medium", "High", "Critical"
            public string? RecommendedAction { get; set; }
            public Dictionary<string, object> Details { get; set; } = new();
        }
    }
}